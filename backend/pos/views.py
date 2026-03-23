import csv
import io
import logging
import math
from decimal import Decimal
from datetime import date, datetime, timedelta

from django.conf import settings
from django.db import transaction
from django.db.models import Sum, Count, Avg, F, Q
from django.db.models.functions import TruncDate, ExtractHour
from django.http import FileResponse, HttpResponse
from django.utils import timezone

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, AllowAny
from rest_framework.filters import SearchFilter
from rest_framework.exceptions import ValidationError

from inventory.models import Product, StockLog
from .models import Customer, Sale, SaleItem, AIRecord, MpesaTransaction
from .serializers import (
    CustomerSerializer,
    SaleSerializer,
    SaleListSerializer,
    SaleDetailSerializer,
    SaleCreateSerializer,
    AIRecordSerializer,
)
from .services.receipt import generate_receipt_html
from .services.pdf_receipt import generate_receipt_pdf

logger = logging.getLogger("pos")


def _generate_receipt_number():
    """Generate NIC-YYYYMMDD-NNN format receipt number (daily sequence)."""
    today = date.today()
    prefix = f"NIC-{today.strftime('%Y%m%d')}-"
    count = Sale.objects.filter(created_at__date=today).count() + 1
    return f"{prefix}{count:03d}"


# ── Customers ───────────────────────────────────────────────────────────────

class CustomerListCreateView(generics.ListCreateAPIView):
    serializer_class = CustomerSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [SearchFilter]
    search_fields = ["name", "phone", "location"]
    queryset = Customer.objects.all()


class CustomerDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = CustomerSerializer
    permission_classes = [IsAdminUser]
    queryset = Customer.objects.all()

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return super().update(request, *args, **kwargs)


class CustomerSalesView(generics.ListAPIView):
    """GET /api/customers/<uuid>/sales/ — paginated sales for a customer."""
    serializer_class = SaleDetailSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        params = self.request.query_params
        qs = (
            Sale.objects
            .filter(customer_id=self.kwargs["pk"])
            .prefetch_related("items")
            .select_related("served_by", "parent_sale")
            .order_by("-created_at")
        )
        try:
            start = date.fromisoformat(params.get("start_date", ""))
            qs = qs.filter(created_at__date__gte=start)
        except ValueError:
            pass
        try:
            end = date.fromisoformat(params.get("end_date", ""))
            qs = qs.filter(created_at__date__lte=end)
        except ValueError:
            pass
        return qs

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        try:
            page_size = min(int(request.query_params.get("page_size", 10)), 50)
            page = max(int(request.query_params.get("page", 1)), 1)
        except ValueError:
            page_size, page = 10, 1

        total_count = queryset.count()
        offset = (page - 1) * page_size
        page_qs = queryset[offset: offset + page_size]
        serializer = self.get_serializer(page_qs, many=True)
        return Response({
            "count": total_count,
            "page": page,
            "page_size": page_size,
            "total_pages": math.ceil(total_count / page_size) if total_count else 1,
            "results": serializer.data,
        })


# ── POS Sale ────────────────────────────────────────────────────────────────

class CreateSaleView(APIView):
    """
    Create a sale and atomically deduct stock using select_for_update().
    Supports loyalty point redemption (redeem_points field).
    Returns the sale data including the thermal receipt HTML.
    """
    permission_classes = [IsAdminUser]

    @transaction.atomic
    def post(self, request):
        serializer = SaleCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # ── Return flow ──────────────────────────────────────────────────────
        if data.get("is_return", False):
            from django.db.models.functions import Greatest
            parent_sale = None
            parent_sale_id = data.get("parent_sale_id")
            if parent_sale_id:
                try:
                    parent_sale = Sale.objects.get(id=parent_sale_id)
                except Sale.DoesNotExist:
                    raise ValidationError({"parent_sale_id": "Original sale not found."})

            items_data = data["items"]
            product_ids = [str(item["product_id"]) for item in items_data]
            products = Product.objects.select_for_update().filter(id__in=product_ids)
            product_map = {str(p.id): p for p in products}

            missing = [pid for pid in product_ids if pid not in product_map]
            if missing:
                return Response(
                    {"stock_errors": [f"Product {pid} not found." for pid in missing]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            subtotal = sum(
                product_map[str(item["product_id"])].price * item["quantity"]
                for item in items_data
            )
            tax = subtotal * Decimal("0.16")
            total = subtotal + tax

            sale = Sale.objects.create(
                receipt_number=_generate_receipt_number(),
                customer=parent_sale.customer if parent_sale else None,
                customer_name=parent_sale.customer_name if parent_sale else data.get("customer_name", ""),
                customer_phone=parent_sale.customer_phone if parent_sale else data.get("customer_phone", ""),
                subtotal=subtotal,
                tax=tax,
                discount=Decimal("0"),
                total=total,
                payment_method=data["payment_method"],
                status="completed",
                served_by=request.user,
                is_return=True,
                parent_sale=parent_sale,
            )

            stock_logs = []
            for item in items_data:
                product = product_map[str(item["product_id"])]
                qty = item["quantity"]
                SaleItem.objects.create(
                    sale=sale,
                    product=product,
                    product_name=product.name,
                    unit_price=product.price,
                    quantity=qty,
                    line_total=product.price * qty,
                )
                Product.objects.filter(id=product.id).update(
                    stock_level=F("stock_level") + qty
                )
                stock_logs.append(StockLog(
                    product=product,
                    change=+qty,
                    reason="return",
                    note=f"Return: {sale.receipt_number}",
                    user=request.user,
                ))
            StockLog.objects.bulk_create(stock_logs)

            if parent_sale and parent_sale.customer:
                points_to_reverse = math.floor(float(parent_sale.total) / 100)
                Customer.objects.filter(id=parent_sale.customer.id).update(
                    total_purchases=F("total_purchases") - parent_sale.total,
                    loyalty_points=Greatest(F("loyalty_points") - points_to_reverse, 0),
                )

            sale.refresh_from_db()
            receipt_html = generate_receipt_html(sale)
            return Response(
                {
                    "sale_id": str(sale.id),
                    "receipt_number": sale.receipt_number,
                    "total": str(sale.total),
                    "receipt_html": receipt_html,
                    "is_return": True,
                },
                status=status.HTTP_201_CREATED,
            )

        # ── Normal sale flow ─────────────────────────────────────────────────
        items_data = data["items"]
        product_ids = [str(item["product_id"]) for item in items_data]

        # Lock product rows for the duration of this transaction
        products = Product.objects.select_for_update().filter(
            id__in=product_ids, is_active=True
        )
        product_map = {str(p.id): p for p in products}

        # Validate all items before touching anything
        errors = []
        for item in items_data:
            pid = str(item["product_id"])
            product = product_map.get(pid)
            if not product:
                errors.append(f"Product {pid} not found or is inactive.")
            elif product.stock_level < item["quantity"]:
                errors.append(
                    f"Insufficient stock for '{product.name}': "
                    f"requested {item['quantity']}, available {product.stock_level}."
                )

        if errors:
            return Response({"stock_errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        # Resolve customer FK if provided
        customer = None
        customer_id = data.get("customer_id")
        if customer_id:
            try:
                customer = Customer.objects.select_for_update().get(id=customer_id)
            except Customer.DoesNotExist:
                pass

        # Handle loyalty point redemption
        redeem_points = data.get("redeem_points", 0)
        points_discount = Decimal("0")
        if redeem_points > 0:
            if not customer:
                raise ValidationError(
                    {"redeem_points": "A registered customer must be selected to redeem loyalty points."}
                )
            if customer.loyalty_points < redeem_points:
                raise ValidationError(
                    {"redeem_points": f"Insufficient loyalty points. Available: {customer.loyalty_points}."}
                )
            points_discount = Decimal(redeem_points)  # 1 point = KES 1

        # Calculate totals (16% VAT)
        subtotal = sum(
            product_map[str(item["product_id"])].price * item["quantity"]
            for item in items_data
        )
        discount = data.get("discount", Decimal("0")) + points_discount
        tax = (subtotal - discount) * Decimal("0.16")
        total = subtotal + tax - discount

        # Create the Sale record
        sale = Sale.objects.create(
            receipt_number=_generate_receipt_number(),
            customer=customer,
            customer_name=data.get("customer_name", ""),
            customer_phone=data.get("customer_phone", ""),
            subtotal=subtotal,
            tax=tax,
            discount=discount,
            total=total,
            payment_method=data["payment_method"],
            status="completed",
            served_by=request.user,
        )

        # Create SaleItems, deduct stock, and log each movement
        stock_logs = []
        for item in items_data:
            product = product_map[str(item["product_id"])]
            qty = item["quantity"]
            line_total = product.price * qty

            SaleItem.objects.create(
                sale=sale,
                product=product,
                product_name=product.name,
                unit_price=product.price,
                quantity=qty,
                line_total=line_total,
            )

            # Use F() expression for atomic decrement
            Product.objects.filter(id=product.id).update(
                stock_level=F("stock_level") - qty
            )

            stock_logs.append(StockLog(
                product=product,
                change=-qty,
                reason="sale",
                note=sale.receipt_number,
                user=request.user,
            ))

        StockLog.objects.bulk_create(stock_logs)

        # Update customer totals + loyalty points if linked (1 point per KES 100 spent)
        if customer:
            points_earned = math.floor(float(total) / 100)
            Customer.objects.filter(id=customer.id).update(
                total_purchases=F("total_purchases") + total,
                last_purchase=timezone.now(),
                loyalty_points=F("loyalty_points") + points_earned - redeem_points,
            )

        # Reload sale with items for receipt generation
        sale.refresh_from_db()
        receipt_html = generate_receipt_html(sale)

        return Response(
            {
                "sale_id": str(sale.id),
                "receipt_number": sale.receipt_number,
                "total": str(sale.total),
                "receipt_html": receipt_html,
            },
            status=status.HTTP_201_CREATED,
        )


# ── AI Records ──────────────────────────────────────────────────────────────

class AIRecordListCreateView(generics.ListCreateAPIView):
    serializer_class = AIRecordSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [SearchFilter]
    search_fields = ["farmer_name", "farmer_phone", "cow_id", "technician"]
    queryset = AIRecord.objects.select_related("semen_product").all()


class AIRecordDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = AIRecordSerializer
    permission_classes = [IsAdminUser]
    queryset = AIRecord.objects.all()


# ── Analytics ───────────────────────────────────────────────────────────────

class DashboardStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        today = date.today()

        today_sales = Sale.objects.filter(
            created_at__date=today, status="completed"
        ).aggregate(total=Sum("total"), count=Count("id"))

        low_stock_count = Product.objects.filter(
            is_active=True,
            stock_level__lte=F("reorder_point"),
        ).count()

        out_of_stock_count = Product.objects.filter(
            is_active=True, stock_level=0
        ).count()

        total_customers = Customer.objects.count()

        expiring_soon_count = Product.objects.filter(
            is_active=True,
            expiry_date__isnull=False,
            expiry_date__gte=today,
            expiry_date__lte=today + timedelta(days=30),
        ).count()

        expired_count = Product.objects.filter(
            is_active=True,
            expiry_date__isnull=False,
            expiry_date__lt=today,
        ).count()

        # Recent sales (last 5)
        recent = Sale.objects.filter(status="completed").order_by("-created_at")[:5]
        recent_data = [
            {
                "id": str(s.id),
                "receipt_number": s.receipt_number,
                "customer_name": s.customer.name if s.customer else s.customer_name or "Walk-in",
                "total": str(s.total),
                "payment_method": s.payment_method,
                "created_at": s.created_at.isoformat(),
            }
            for s in recent
        ]

        return Response({
            "today_sales_total": str(today_sales["total"] or 0),
            "today_orders_count": today_sales["count"] or 0,
            "low_stock_count": low_stock_count,
            "out_of_stock_count": out_of_stock_count,
            "total_customers": total_customers,
            "expiring_soon_count": expiring_soon_count,
            "expired_count": expired_count,
            "recent_sales": recent_data,
        })


class SalesTrendView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        days = int(request.query_params.get("days", 7))
        start_date = date.today() - timedelta(days=days - 1)

        trend = (
            Sale.objects.filter(
                created_at__date__gte=start_date,
                status="completed",
            )
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(sales=Sum("total"), orders=Count("id"))
            .order_by("day")
        )

        data = [
            {
                "date": entry["day"].strftime("%a"),
                "full_date": entry["day"].isoformat(),
                "sales": float(entry["sales"] or 0),
                "orders": entry["orders"],
            }
            for entry in trend
        ]

        return Response(data)


class CategorySplitView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from pos.models import SaleItem as SI

        splits = (
            SI.objects.select_related("product__category")
            .values("product__category__name")
            .annotate(revenue=Sum("line_total"))
            .order_by("-revenue")
        )

        total_revenue = sum(s["revenue"] or 0 for s in splits)

        COLORS = ["#0B3A2C", "#E4B83A", "#6B7A72", "#111915", "#065f46"]
        data = [
            {
                "name": entry["product__category__name"] or "Uncategorized",
                "value": round(
                    float(entry["revenue"] or 0) / float(total_revenue) * 100, 1
                ) if total_revenue else 0,
                "revenue": float(entry["revenue"] or 0),
                "color": COLORS[i % len(COLORS)],
            }
            for i, entry in enumerate(splits)
        ]

        return Response(data)


# ── PDF Receipt ──────────────────────────────────────────────────────────────

class SalePDFView(APIView):
    """GET /api/pos/sale/<uuid>/receipt.pdf/ — download receipt as PDF."""
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        from io import BytesIO
        try:
            sale = Sale.objects.prefetch_related("items").get(pk=pk)
        except Sale.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        pdf_bytes = generate_receipt_pdf(sale)
        response = FileResponse(
            BytesIO(pdf_bytes),
            content_type="application/pdf",
            as_attachment=True,
            filename=f"receipt_{sale.receipt_number}.pdf",
        )
        return response


# ── Sale History & Detail ─────────────────────────────────────────────────────

class SaleListView(generics.ListAPIView):
    """
    GET /api/pos/sales/
    Params: start_date, end_date, search, payment_method, is_return, page, page_size
    """
    serializer_class = SaleListSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        params = self.request.query_params

        try:
            end_date = date.fromisoformat(params.get("end_date", ""))
        except ValueError:
            end_date = date.today()
        try:
            start_date = date.fromisoformat(params.get("start_date", ""))
        except ValueError:
            start_date = end_date - timedelta(days=29)

        qs = (
            Sale.objects
            .filter(created_at__date__gte=start_date, created_at__date__lte=end_date)
            .select_related("customer", "served_by")
            .order_by("-created_at")
        )

        search = params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(receipt_number__icontains=search) |
                Q(customer_name__icontains=search) |
                Q(customer_phone__icontains=search) |
                Q(customer__name__icontains=search) |
                Q(customer__phone__icontains=search)
            )

        payment_method = params.get("payment_method", "").strip()
        if payment_method in ("cash", "mpesa", "card"):
            qs = qs.filter(payment_method=payment_method)

        is_return_param = params.get("is_return", "").strip().lower()
        if is_return_param == "true":
            qs = qs.filter(is_return=True)
        elif is_return_param == "false":
            qs = qs.filter(is_return=False)

        return qs

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        try:
            page_size = min(int(request.query_params.get("page_size", 25)), 100)
            page = max(int(request.query_params.get("page", 1)), 1)
        except ValueError:
            page_size, page = 25, 1

        total_count = queryset.count()
        offset = (page - 1) * page_size
        page_qs = queryset[offset: offset + page_size]
        serializer = self.get_serializer(page_qs, many=True)
        return Response({
            "count": total_count,
            "page": page,
            "page_size": page_size,
            "total_pages": math.ceil(total_count / page_size) if total_count else 1,
            "results": serializer.data,
        })


class SaleDetailView(generics.RetrieveAPIView):
    """GET /api/pos/sales/<uuid>/ — full sale detail for receipt modal."""
    serializer_class = SaleDetailSerializer
    permission_classes = [IsAdminUser]
    queryset = Sale.objects.prefetch_related("items").select_related(
        "customer", "served_by", "parent_sale"
    ).all()


class SaleReceiptHTMLView(APIView):
    """GET /api/pos/sales/<uuid>/receipt.html/ — return thermal receipt HTML for reprint."""
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            sale = Sale.objects.prefetch_related("items").select_related(
                "customer", "served_by"
            ).get(pk=pk)
        except Sale.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"receipt_html": generate_receipt_html(sale)})


# ── M-Pesa STK Push ──────────────────────────────────────────────────────────

class MpesaSTKPushView(APIView):
    """POST /api/pos/mpesa/stk-push/ — initiate an STK Push."""
    permission_classes = [IsAdminUser]

    def post(self, request):
        from .services.mpesa import stk_push

        phone = request.data.get("phone", "").strip()
        amount = request.data.get("amount")
        account_ref = request.data.get("account_reference", "Nicmah")

        if not phone or not amount:
            return Response(
                {"detail": "phone and amount are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Normalize to 254XXXXXXXXX
        if phone.startswith("0"):
            phone = "254" + phone[1:]
        elif phone.startswith("+"):
            phone = phone[1:]

        try:
            result = stk_push(
                phone=phone,
                amount=int(float(amount)),
                account_reference=account_ref,
                description="Agrovet Sale",
            )
        except Exception as exc:
            logger.error("STK push failed for phone=%s amount=%s: %s", phone, amount, exc, exc_info=True)
            return Response(
                {"detail": "Payment initiation failed. Please try again."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        checkout_request_id = result.get("CheckoutRequestID", "")
        MpesaTransaction.objects.create(
            checkout_request_id=checkout_request_id,
            merchant_request_id=result.get("MerchantRequestID", ""),
            phone=phone,
            amount=Decimal(str(amount)),
            account_reference=account_ref,
        )

        return Response({
            "checkout_request_id": checkout_request_id,
            "customer_message": result.get("CustomerMessage", ""),
            "response_code": result.get("ResponseCode", ""),
        }, status=status.HTTP_200_OK)


class MpesaCallbackView(APIView):
    """POST /api/pos/mpesa/callback/<callback_secret>/ — called by Safaricom after payment.

    The callback_secret is a random token embedded in the URL so that only
    Safaricom (who received the URL from us) can reach this endpoint.
    Safaricom does not sign callbacks with HMAC, so a secret URL path is the
    recommended verification approach.
    """
    permission_classes = [AllowAny]
    authentication_classes = []  # No auth — Safaricom doesn't send JWT

    def post(self, request, callback_secret: str):
        expected = settings.MPESA_CALLBACK_SECRET
        if not expected or callback_secret != expected:
            logger.warning("M-Pesa callback rejected: invalid secret token")
            return Response(status=status.HTTP_403_FORBIDDEN)

        body = request.data.get("Body", {})
        stk = body.get("stkCallback", {})
        checkout_request_id = stk.get("CheckoutRequestID", "")
        result_code = stk.get("ResultCode")
        result_desc = stk.get("ResultDesc", "")

        try:
            txn = MpesaTransaction.objects.get(checkout_request_id=checkout_request_id)
        except MpesaTransaction.DoesNotExist:
            logger.warning("M-Pesa callback: unknown CheckoutRequestID=%s", checkout_request_id)
            return Response({"ResultCode": 0, "ResultDesc": "Accepted"})

        if result_code == 0:
            items = stk.get("CallbackMetadata", {}).get("Item", [])
            receipt = next((i["Value"] for i in items if i.get("Name") == "MpesaReceiptNumber"), "")
            txn.status = "success"
            txn.mpesa_receipt = str(receipt)
        else:
            txn.status = "cancelled" if result_code == 1032 else "failed"

        txn.result_desc = result_desc
        txn.save(update_fields=["status", "mpesa_receipt", "result_desc", "updated_at"])
        return Response({"ResultCode": 0, "ResultDesc": "Accepted"})


class MpesaStatusView(APIView):
    """GET /api/pos/mpesa/status/<checkout_request_id>/ — poll payment status."""
    permission_classes = [IsAdminUser]

    def get(self, request, checkout_request_id):
        try:
            txn = MpesaTransaction.objects.get(checkout_request_id=checkout_request_id)
        except MpesaTransaction.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "status": txn.status,
            "mpesa_receipt": txn.mpesa_receipt,
            "result_desc": txn.result_desc,
            "amount": str(txn.amount),
            "phone": txn.phone,
        })


# ── Phase 4 Analytics ─────────────────────────────────────────────────────────

class HourlySalesView(APIView):
    """GET /api/analytics/hourly/ — sales volume by hour of day (last 30 days)."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        days = int(request.query_params.get("days", 30))
        start_date = date.today() - timedelta(days=days)

        hourly = (
            Sale.objects
            .filter(created_at__date__gte=start_date, status="completed")
            .annotate(hour=ExtractHour("created_at"))
            .values("hour")
            .annotate(orders=Count("id"), sales=Sum("total"))
            .order_by("hour")
        )

        # Fill all 24 hours even if no data
        data_map = {entry["hour"]: entry for entry in hourly}
        data = [
            {
                "hour": h,
                "label": f"{h:02d}:00",
                "orders": data_map.get(h, {}).get("orders", 0),
                "sales": float(data_map.get(h, {}).get("sales") or 0),
            }
            for h in range(24)
        ]
        return Response(data)


class SlowMoversView(APIView):
    """GET /api/analytics/slow-movers/ — products with lowest sales velocity (30 days)."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        days = int(request.query_params.get("days", 30))
        limit = int(request.query_params.get("limit", 20))
        start_date = date.today() - timedelta(days=days)

        from inventory.models import Product as Prod

        # Products that had any sales in the period
        sold_ids = (
            SaleItem.objects
            .filter(sale__created_at__date__gte=start_date, sale__status="completed")
            .values_list("product_id", flat=True)
            .distinct()
        )

        # Active products with zero or low sales
        slow = (
            Prod.objects
            .filter(is_active=True)
            .annotate(
                qty_sold=Sum(
                    "sale_items__quantity",
                    filter=Q(
                        sale_items__sale__created_at__date__gte=start_date,
                        sale_items__sale__status="completed",
                    )
                )
            )
            .order_by("qty_sold")[:limit]
        )

        data = [
            {
                "id": str(p.id),
                "name": p.name,
                "stock_level": p.stock_level,
                "price": str(p.price),
                "qty_sold": p.qty_sold or 0,
                "category": p.category.name if p.category else None,
            }
            for p in slow
        ]
        return Response(data)


class CashierAuditView(APIView):
    """GET /api/analytics/cashier-audit/ — per-cashier sales summary."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        days = int(request.query_params.get("days", 30))
        start_date = date.today() - timedelta(days=days)

        from django.contrib.auth import get_user_model
        User = get_user_model()

        audit = (
            Sale.objects
            .filter(created_at__date__gte=start_date, status="completed", served_by__isnull=False)
            .values("served_by__id", "served_by__first_name", "served_by__last_name", "served_by__username")
            .annotate(
                total_sales=Sum("total"),
                order_count=Count("id"),
                avg_sale=Avg("total"),
            )
            .order_by("-total_sales")
        )

        data = [
            {
                "cashier_id": str(entry["served_by__id"]),
                "name": (
                    f"{entry['served_by__first_name']} {entry['served_by__last_name']}".strip()
                    or entry["served_by__username"]
                ),
                "total_sales": float(entry["total_sales"] or 0),
                "order_count": entry["order_count"],
                "avg_sale": float(entry["avg_sale"] or 0),
            }
            for entry in audit
        ]
        return Response(data)


class DateRangeReportView(APIView):
    """GET /api/analytics/date-range/?start=YYYY-MM-DD&end=YYYY-MM-DD — custom period report."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            start = date.fromisoformat(request.query_params.get("start", ""))
            end = date.fromisoformat(request.query_params.get("end", ""))
        except ValueError:
            end = date.today()
            start = end - timedelta(days=6)

        sales_qs = Sale.objects.filter(
            created_at__date__gte=start,
            created_at__date__lte=end,
            status="completed",
        )

        totals = sales_qs.aggregate(revenue=Sum("total"), orders=Count("id"), avg=Avg("total"))

        by_method = (
            sales_qs.values("payment_method")
            .annotate(total=Sum("total"), count=Count("id"))
            .order_by("-total")
        )

        top_products = (
            SaleItem.objects
            .filter(sale__in=sales_qs)
            .values("product_name")
            .annotate(qty=Sum("quantity"), revenue=Sum("line_total"))
            .order_by("-revenue")[:10]
        )

        daily = (
            sales_qs
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(sales=Sum("total"), orders=Count("id"))
            .order_by("day")
        )

        return Response({
            "start": start.isoformat(),
            "end": end.isoformat(),
            "total_sales": float(totals["revenue"] or 0),
            "total_orders": totals["orders"] or 0,
            "avg_order_value": float(totals["avg"] or 0),
            "by_payment_method": [
                {
                    "method": m["payment_method"],
                    "total": float(m["total"] or 0),
                    "count": m["count"],
                }
                for m in by_method
            ],
            "top_products": [
                {
                    "name": p["product_name"],
                    "qty": p["qty"],
                    "revenue": float(p["revenue"] or 0),
                }
                for p in top_products
            ],
            "daily": [
                {
                    "date": d["day"].isoformat(),
                    "sales": float(d["sales"] or 0),
                    "orders": d["orders"],
                }
                for d in daily
            ],
        })


class ExportCSVView(APIView):
    """GET /api/analytics/export/csv/?start=&end= — download sales as CSV."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            start = date.fromisoformat(request.query_params.get("start", ""))
            end = date.fromisoformat(request.query_params.get("end", ""))
        except ValueError:
            end = date.today()
            start = end - timedelta(days=29)

        sales_qs = (
            Sale.objects
            .filter(created_at__date__gte=start, created_at__date__lte=end, status="completed")
            .select_related("customer", "served_by")
            .prefetch_related("items")
            .order_by("created_at")
        )

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Receipt No", "Date", "Customer", "Cashier",
            "Subtotal", "Tax", "Discount", "Total", "Payment Method",
        ])
        for s in sales_qs:
            customer_name = s.customer.name if s.customer else (s.customer_name or "Walk-in")
            cashier_name = s.served_by.get_full_name() if s.served_by else ""
            writer.writerow([
                s.receipt_number,
                s.created_at.strftime("%Y-%m-%d %H:%M"),
                customer_name,
                cashier_name,
                s.subtotal,
                s.tax,
                s.discount,
                s.total,
                s.payment_method,
            ])

        response = HttpResponse(output.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = (
            f'attachment; filename="sales_{start}_{end}.csv"'
        )
        return response


class ExportExcelView(APIView):
    """GET /api/analytics/export/excel/?start=&end= — download sales as Excel."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            import openpyxl
        except ImportError:
            return Response({"detail": "openpyxl not installed."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            start = date.fromisoformat(request.query_params.get("start", ""))
            end = date.fromisoformat(request.query_params.get("end", ""))
        except ValueError:
            end = date.today()
            start = end - timedelta(days=29)

        sales_qs = (
            Sale.objects
            .filter(created_at__date__gte=start, created_at__date__lte=end, status="completed")
            .select_related("customer", "served_by")
            .order_by("created_at")
        )

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Sales"

        headers = ["Receipt No", "Date", "Customer", "Cashier",
                   "Subtotal", "Tax", "Discount", "Total", "Payment Method"]
        ws.append(headers)

        for s in sales_qs:
            customer_name = s.customer.name if s.customer else (s.customer_name or "Walk-in")
            cashier_name = s.served_by.get_full_name() if s.served_by else ""
            ws.append([
                s.receipt_number,
                s.created_at.strftime("%Y-%m-%d %H:%M"),
                customer_name,
                cashier_name,
                float(s.subtotal),
                float(s.tax),
                float(s.discount),
                float(s.total),
                s.payment_method,
            ])

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)

        response = HttpResponse(
            output.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = (
            f'attachment; filename="sales_{start}_{end}.xlsx"'
        )
        return response
