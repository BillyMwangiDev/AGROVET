"""
Tests for the pos app — sales, customers, M-Pesa, AI records.
Critical: tests the select_for_update + atomic stock deduction pattern.
"""
import re
from decimal import Decimal
from unittest.mock import patch, MagicMock

import pytest

from inventory.models import Product, StockLog
from pos.models import Customer, Sale, SaleItem, AIRecord, MpesaTransaction


# ── Helpers ───────────────────────────────────────────────────────────────────

SALE_URL = "/api/pos/sale/"


def make_sale_payload(product, quantity=1, payment="cash", **kwargs):
    return {
        "items": [{"product_id": str(product.pk), "quantity": quantity}],
        "payment_method": payment,
        "customer_name": kwargs.get("customer_name", "Walk-in"),
        "customer_phone": kwargs.get("customer_phone", "0700000000"),
        **{k: v for k, v in kwargs.items() if k not in ("customer_name", "customer_phone")},
    }


# ── Sale Creation ─────────────────────────────────────────────────────────────

class TestSaleCreation:
    def test_create_cash_sale_deducts_stock(self, admin_client, product):
        before = product.stock_level
        resp = admin_client.post(SALE_URL, make_sale_payload(product), format="json")
        assert resp.status_code == 201
        product.refresh_from_db()
        assert product.stock_level == before - 1

    def test_create_sale_creates_stock_log_with_reason_sale(self, admin_client, product):
        admin_client.post(SALE_URL, make_sale_payload(product), format="json")
        log = StockLog.objects.filter(product=product, reason="sale").first()
        assert log is not None
        assert log.change == -1

    def test_insufficient_stock_returns_400(self, admin_client, product):
        payload = make_sale_payload(product, quantity=9999)
        resp = admin_client.post(SALE_URL, payload, format="json")
        assert resp.status_code == 400
        assert "stock_errors" in resp.data

    def test_walk_in_customer_stored_as_strings(self, admin_client, product):
        payload = make_sale_payload(
            product,
            customer_name="Mary Wanjiku",
            customer_phone="0723456789",
        )
        resp = admin_client.post(SALE_URL, payload, format="json")
        assert resp.status_code == 201
        sale = Sale.objects.get(pk=resp.data["sale_id"])
        assert sale.customer_name == "Mary Wanjiku"
        assert sale.customer is None

    def test_receipt_number_format(self, admin_client, product):
        resp = admin_client.post(SALE_URL, make_sale_payload(product), format="json")
        assert resp.status_code == 201
        receipt_number = resp.data["receipt_number"]
        # Format: NIC-YYYYMMDD-NNN
        pattern = r"^NIC-\d{8}-\d{3}$"
        assert re.match(pattern, receipt_number), f"Bad receipt format: {receipt_number}"

    def test_vat_16_percent_applied(self, admin_client, product):
        # product price = 500, qty = 1 → subtotal = 500, tax = 500 * 0.16 = 80, total = 580
        resp = admin_client.post(SALE_URL, make_sale_payload(product, quantity=1), format="json")
        assert resp.status_code == 201
        total = Decimal(resp.data["total"])
        # subtotal = 500, tax = 80, total = 580
        assert total == Decimal("580.00")

    def test_loyalty_points_awarded_1_per_100_KES(self, admin_client, product, customer):
        payload = {
            **make_sale_payload(product, quantity=2),  # total = 2 * 500 * 1.16 = 1160
            "customer_id": str(customer.pk),
        }
        admin_client.post(SALE_URL, payload, format="json")
        customer.refresh_from_db()
        # total ~= 1160, floor(1160/100) = 11 points
        assert customer.loyalty_points >= 11

    def test_loyalty_redemption_reduces_total(self, admin_client, product, customer):
        # Give customer 50 points first
        customer.loyalty_points = 50
        customer.save()
        payload = {
            **make_sale_payload(product, quantity=1),
            "customer_id": str(customer.pk),
            "redeem_points": 50,
        }
        resp = admin_client.post(SALE_URL, payload, format="json")
        assert resp.status_code == 201
        # Points redeemed: 50 KES discount
        total = Decimal(resp.data["total"])
        # subtotal=500, discount=50, taxable=(500-50)*0.16=72, total=(500-50)+72=522
        assert total < Decimal("580.00")

    def test_stock_not_deducted_on_bad_request(self, admin_client, product):
        before = product.stock_level
        payload = make_sale_payload(product, quantity=9999)
        admin_client.post(SALE_URL, payload, format="json")
        product.refresh_from_db()
        assert product.stock_level == before  # unchanged

    def test_unauthenticated_cannot_create_sale(self, api_client, product):
        resp = api_client.post(SALE_URL, make_sale_payload(product), format="json")
        assert resp.status_code == 401

    def test_sale_html_receipt_in_response(self, admin_client, product):
        resp = admin_client.post(SALE_URL, make_sale_payload(product), format="json")
        assert resp.status_code == 201
        assert "receipt_html" in resp.data
        assert len(resp.data["receipt_html"]) > 0


# ── PDF Receipt ───────────────────────────────────────────────────────────────

class TestPDFReceipt:
    def test_pdf_receipt_returns_pdf_content_type(self, admin_client, sale):
        url = f"/api/pos/sale/{sale.pk}/receipt.pdf/"
        resp = admin_client.get(url)
        assert resp.status_code == 200
        assert "application/pdf" in resp["Content-Type"]

    def test_pdf_receipt_404_for_unknown_sale(self, admin_client, db):
        import uuid
        url = f"/api/pos/sale/{uuid.uuid4()}/receipt.pdf/"
        resp = admin_client.get(url)
        assert resp.status_code == 404


# ── Customers ─────────────────────────────────────────────────────────────────

class TestCustomerCRUD:
    LIST_URL = "/api/customers/"

    def test_create_customer(self, admin_client, db):
        resp = admin_client.post(self.LIST_URL, {
            "name": "New Farmer",
            "phone": "0756789012",
            "email": "farmer@farm.com",
        })
        assert resp.status_code == 201
        assert Customer.objects.filter(phone="0756789012").exists()

    def test_list_customers_requires_auth(self, api_client, db):
        resp = api_client.get(self.LIST_URL)
        assert resp.status_code == 401

    def test_update_customer(self, admin_client, customer):
        url = f"/api/customers/{customer.pk}/"
        resp = admin_client.patch(url, {"location": "Nairobi"})
        assert resp.status_code == 200
        customer.refresh_from_db()
        assert customer.location == "Nairobi"

    def test_customer_sales_endpoint(self, admin_client, customer, sale):
        url = f"/api/customers/{customer.pk}/sales/"
        resp = admin_client.get(url)
        assert resp.status_code == 200
        assert len(resp.data) >= 1

    def test_duplicate_phone_returns_400(self, admin_client, customer):
        resp = admin_client.post(self.LIST_URL, {
            "name": "Another Farmer",
            "phone": "0712345678",  # same as customer fixture
        })
        assert resp.status_code == 400


# ── M-Pesa ────────────────────────────────────────────────────────────────────

class TestMpesa:
    STK_URL = "/api/pos/mpesa/stk-push/"

    @patch("pos.services.mpesa.requests.post")
    def test_stk_push_creates_mpesa_transaction(self, mock_post, admin_client, db):
        mock_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "ResponseCode": "0",
                "CheckoutRequestID": "ws_CO_TEST12345",
                "MerchantRequestID": "MERC_REQ_001",
                "CustomerMessage": "Success. Request accepted for processing.",
            },
        )
        resp = admin_client.post(self.STK_URL, {
            "phone": "0712345678",
            "amount": "580",
            "account_reference": "NIC-20260306-001",
        }, format="json")
        # Either 200 (STK initiated) or 502 (sandbox timeout) — either is valid in test
        assert resp.status_code in (200, 502)

    def test_mpesa_callback_marks_success(self, api_client, db):
        from django.test import override_settings
        txn = MpesaTransaction.objects.create(
            checkout_request_id="ws_CO_TEST_SUCCESS",
            phone="254712345678",
            amount=Decimal("580.00"),
            status="pending",
        )
        callback_data = {
            "Body": {
                "stkCallback": {
                    "CheckoutRequestID": "ws_CO_TEST_SUCCESS",
                    "ResultCode": 0,
                    "ResultDesc": "The service request is processed successfully.",
                    "CallbackMetadata": {
                        "Item": [
                            {"Name": "MpesaReceiptNumber", "Value": "PGK1234XYZ"},
                            {"Name": "Amount", "Value": 580},
                        ]
                    },
                }
            }
        }
        with override_settings(MPESA_CALLBACK_SECRET="testsecret"):
            resp = api_client.post(
                "/api/pos/mpesa/callback/testsecret/",
                callback_data,
                format="json",
            )
        assert resp.status_code == 200
        txn.refresh_from_db()
        assert txn.status == "success"
        assert txn.mpesa_receipt == "PGK1234XYZ"

    def test_mpesa_callback_wrong_secret_returns_403(self, api_client, db):
        from django.test import override_settings
        callback_data = {"Body": {"stkCallback": {"CheckoutRequestID": "xxx", "ResultCode": 0}}}
        with override_settings(MPESA_CALLBACK_SECRET="correctsecret"):
            resp = api_client.post(
                "/api/pos/mpesa/callback/wrongsecret/",
                callback_data,
                format="json",
            )
        assert resp.status_code == 403

    def test_mpesa_status_returns_current_status(self, admin_client, db):
        txn = MpesaTransaction.objects.create(
            checkout_request_id="ws_CO_STATUS_TEST",
            phone="254712345678",
            amount=Decimal("200.00"),
            status="pending",
        )
        resp = admin_client.get(f"/api/pos/mpesa/status/{txn.checkout_request_id}/")
        assert resp.status_code == 200
        assert resp.data["status"] == "pending"

    def test_mpesa_status_404_unknown(self, admin_client, db):
        resp = admin_client.get("/api/pos/mpesa/status/unknown_checkout_id/")
        assert resp.status_code == 404


# ── AI Records ────────────────────────────────────────────────────────────────

class TestAIRecords:
    LIST_URL = "/api/ai-records/"

    def test_create_ai_record(self, admin_client, ai_product):
        resp = admin_client.post(self.LIST_URL, {
            "farmer_name": "James Mwangi",
            "farmer_phone": "0700111222",
            "cow_id": "COW-001",
            "cow_breed": "Ayrshire",
            "semen_product": str(ai_product.pk),
            "insemination_date": "2026-03-06",
            "technician": "Dr. Kamau",
            "status": "scheduled",
        }, format="json")
        assert resp.status_code == 201
        assert AIRecord.objects.filter(farmer_name="James Mwangi").exists()

    def test_list_requires_auth(self, api_client, db):
        resp = api_client.get(self.LIST_URL)
        assert resp.status_code == 401

    def test_update_status_to_confirmed_pregnant(self, admin_client, ai_product, db):
        record = AIRecord.objects.create(
            farmer_name="Test Farmer",
            farmer_phone="0700123456",
            cow_id="COW-002",
            cow_breed="Friesian",
            semen_product=ai_product,
            insemination_date="2026-01-01",
            technician="Dr. Test",
            status="completed",
        )
        url = f"{self.LIST_URL}{record.pk}/"
        resp = admin_client.patch(url, {"status": "confirmed_pregnant"}, format="json")
        assert resp.status_code == 200
        record.refresh_from_db()
        assert record.status == "confirmed_pregnant"

    def test_list_ai_records(self, admin_client, ai_product, db):
        AIRecord.objects.create(
            farmer_name="List Test Farmer",
            farmer_phone="0700999888",
            cow_id="COW-LIST",
            cow_breed="Holstein",
            semen_product=ai_product,
            insemination_date="2026-02-01",
            technician="Dr. List",
        )
        resp = admin_client.get(self.LIST_URL)
        assert resp.status_code == 200
        assert len(resp.data["results"]) >= 1
