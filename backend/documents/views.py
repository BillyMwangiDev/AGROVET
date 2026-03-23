from decimal import Decimal

from django.core.mail import EmailMessage
from django.http import HttpResponse
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from inventory.models import Product
from pos.models import Customer
from users.permissions import IsManagerOrAbove
from .models import Document, DocumentItem
from .serializers import (
    CreateDocumentSerializer,
    DocumentSerializer,
    UpdateDocumentSerializer,
)
from .services.invoice_pdf import generate_invoice_pdf
from .services.quotation_pdf import generate_quotation_pdf


class DocumentListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsManagerOrAbove]

    def get(self, request):
        qs = Document.objects.prefetch_related("items").select_related("created_by")
        doc_type = request.query_params.get("type")
        doc_status = request.query_params.get("status")
        search = request.query_params.get("search", "").strip()
        if doc_type:
            qs = qs.filter(document_type=doc_type)
        if doc_status:
            qs = qs.filter(status=doc_status)
        if search:
            qs = qs.filter(
                document_number__icontains=search
            ) | qs.filter(customer_name__icontains=search)
        serializer = DocumentSerializer(qs[:200], many=True)
        return Response(serializer.data)

    def post(self, request):
        ser = CreateDocumentSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        # Resolve customer FK
        customer_obj = None
        if data.get("customer_id"):
            try:
                customer_obj = Customer.objects.get(id=data["customer_id"])
            except Customer.DoesNotExist:
                pass

        # Build line items & compute totals
        items_data = data.pop("items")
        subtotal = Decimal("0.00")
        item_objs = []
        for item_d in items_data:
            product_obj = None
            if item_d.get("product_id"):
                try:
                    product_obj = Product.objects.get(id=item_d["product_id"])
                except Product.DoesNotExist:
                    pass
            qty = item_d["quantity"]
            unit_price = item_d["unit_price"]
            line_total = unit_price * qty
            subtotal += line_total
            item_objs.append(DocumentItem(
                product=product_obj,
                description=item_d["description"],
                quantity=qty,
                unit_price=unit_price,
                total_price=line_total,
            ))

        discount = data.get("discount_amount", Decimal("0.00"))
        tax = (subtotal - discount) * Decimal("0.16")
        total = subtotal + tax - discount

        doc = Document.objects.create(
            document_type=data["document_type"],
            status="draft",
            customer=customer_obj,
            customer_name=data["customer_name"],
            customer_email=data.get("customer_email", ""),
            customer_phone=data.get("customer_phone", ""),
            customer_address=data.get("customer_address", ""),
            due_date=data.get("due_date"),
            valid_until=data.get("valid_until"),
            subtotal=subtotal,
            tax_amount=tax,
            discount_amount=discount,
            total_amount=total,
            notes=data.get("notes", ""),
            terms_conditions=data.get("terms_conditions", ""),
            payment_terms=data.get("payment_terms", ""),
            created_by=request.user,
        )
        for item in item_objs:
            item.document = doc
        DocumentItem.objects.bulk_create(item_objs)

        doc.refresh_from_db()
        return Response(DocumentSerializer(doc).data, status=status.HTTP_201_CREATED)


class DocumentDetailView(APIView):
    permission_classes = [IsAuthenticated, IsManagerOrAbove]

    def _get_doc(self, pk):
        try:
            return Document.objects.prefetch_related("items").select_related("created_by").get(id=pk)
        except Document.DoesNotExist:
            return None

    def get(self, request, pk):
        doc = self._get_doc(pk)
        if not doc:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(DocumentSerializer(doc).data)

    def patch(self, request, pk):
        doc = self._get_doc(pk)
        if not doc:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        ser = UpdateDocumentSerializer(doc, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        doc.refresh_from_db()
        return Response(DocumentSerializer(doc).data)

    def delete(self, request, pk):
        doc = self._get_doc(pk)
        if not doc:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        doc.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DocumentPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            doc = Document.objects.prefetch_related("items").get(id=pk)
        except Document.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if doc.document_type == "quotation":
            pdf_bytes = generate_quotation_pdf(doc)
        elif doc.document_type == "invoice":
            pdf_bytes = generate_invoice_pdf(doc)
        else:
            return Response({"detail": "Unknown document type."}, status=status.HTTP_400_BAD_REQUEST)

        filename = f"{doc.document_number}.pdf"
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class DocumentEmailView(APIView):
    permission_classes = [IsAuthenticated, IsManagerOrAbove]

    def post(self, request, pk):
        try:
            doc = Document.objects.prefetch_related("items").get(id=pk)
        except Document.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        email_address = request.data.get("email") or doc.customer_email
        if not email_address:
            return Response({"detail": "No email address provided."}, status=status.HTTP_400_BAD_REQUEST)

        if doc.document_type == "quotation":
            pdf_bytes = generate_quotation_pdf(doc)
            subject = f"Quotation {doc.document_number} — Nicmah Agrovet"
        else:
            pdf_bytes = generate_invoice_pdf(doc)
            subject = f"Invoice {doc.document_number} — Nicmah Agrovet"

        msg = EmailMessage(
            subject=subject,
            body=f"Dear {doc.customer_name},\n\nPlease find your {doc.get_document_type_display().lower()} attached.\n\nFor any queries, contact us on 0721 908 023.\n\nThank you,\nNicmah Agrovet",
            from_email=None,  # uses DEFAULT_FROM_EMAIL
            to=[email_address],
        )
        msg.attach(f"{doc.document_number}.pdf", pdf_bytes, "application/pdf")
        msg.send(fail_silently=True)

        # Update status to 'sent' if still draft
        if doc.status == "draft":
            doc.status = "sent"
            doc.save(update_fields=["status"])

        return Response({"message": f"Document emailed to {email_address}."})
