"""
Tests for the documents app — quotations and invoices.
"""
import pytest
from decimal import Decimal

from documents.models import Document, DocumentItem


# ── Document CRUD ─────────────────────────────────────────────────────────────

class TestDocumentCRUD:
    LIST_URL = "/api/documents/"

    def _make_doc_payload(self, product, doc_type="quotation"):
        return {
            "document_type": doc_type,
            "customer_name": "Kipchumba Farms",
            "customer_email": "kipchumba@farm.co.ke",
            "customer_phone": "0712345678",
            "notes": "Please confirm within 7 days.",
            "items": [
                {
                    "description": product.name,
                    "quantity": 2,
                    "unit_price": str(product.price),
                }
            ],
        }

    def test_admin_can_create_quotation(self, admin_client, product):
        resp = admin_client.post(
            self.LIST_URL,
            self._make_doc_payload(product, "quotation"),
            format="json",
        )
        assert resp.status_code == 201
        assert resp.data["document_type"] == "quotation"
        assert resp.data["document_number"].startswith("NIC-QTN-")

    def test_admin_can_create_invoice(self, admin_client, product):
        resp = admin_client.post(
            self.LIST_URL,
            self._make_doc_payload(product, "invoice"),
            format="json",
        )
        assert resp.status_code == 201
        assert resp.data["document_type"] == "invoice"
        assert resp.data["document_number"].startswith("NIC-INV-")

    def test_document_number_format(self, admin_client, product):
        resp = admin_client.post(
            self.LIST_URL,
            self._make_doc_payload(product, "quotation"),
            format="json",
        )
        assert resp.status_code == 201
        import re
        pattern = r"^NIC-(QTN|INV)-\d{8}-\d{3}$"
        assert re.match(pattern, resp.data["document_number"])

    def test_list_documents(self, admin_client, product):
        admin_client.post(
            self.LIST_URL,
            self._make_doc_payload(product, "quotation"),
            format="json",
        )
        resp = admin_client.get(self.LIST_URL)
        assert resp.status_code == 200
        results = resp.data.get("results", resp.data) if isinstance(resp.data, dict) else resp.data
        assert len(results) >= 1

    def test_list_filter_by_type(self, admin_client, product):
        admin_client.post(
            self.LIST_URL,
            self._make_doc_payload(product, "quotation"),
            format="json",
        )
        admin_client.post(
            self.LIST_URL,
            self._make_doc_payload(product, "invoice"),
            format="json",
        )
        resp = admin_client.get(f"{self.LIST_URL}?type=quotation")
        assert resp.status_code == 200
        results = resp.data.get("results", resp.data) if isinstance(resp.data, dict) else resp.data
        for doc in results:
            assert doc["document_type"] == "quotation"

    def test_update_document_status(self, admin_client, product):
        create_resp = admin_client.post(
            self.LIST_URL,
            self._make_doc_payload(product, "quotation"),
            format="json",
        )
        doc_id = create_resp.data["id"]
        resp = admin_client.patch(
            f"{self.LIST_URL}{doc_id}/",
            {"status": "sent"},
            format="json",
        )
        assert resp.status_code == 200
        assert resp.data["status"] == "sent"

    def test_delete_document(self, admin_client, product):
        create_resp = admin_client.post(
            self.LIST_URL,
            self._make_doc_payload(product, "quotation"),
            format="json",
        )
        doc_id = create_resp.data["id"]
        resp = admin_client.delete(f"{self.LIST_URL}{doc_id}/")
        assert resp.status_code == 204
        assert not Document.objects.filter(pk=doc_id).exists()

    def test_unauthenticated_cannot_create(self, api_client, product):
        resp = api_client.post(
            self.LIST_URL,
            self._make_doc_payload(product),
            format="json",
        )
        assert resp.status_code == 401


# ── Document PDF ──────────────────────────────────────────────────────────────

class TestDocumentPDF:
    def _create_doc(self, client, product, doc_type="quotation"):
        resp = client.post("/api/documents/", {
            "document_type": doc_type,
            "customer_name": "PDF Test Client",
            "items": [{
                "description": product.name,
                "quantity": 1,
                "unit_price": str(product.price),
            }],
        }, format="json")
        assert resp.status_code == 201
        return resp.data["id"]

    def test_quotation_pdf_returns_200(self, admin_client, product):
        doc_id = self._create_doc(admin_client, product, "quotation")
        resp = admin_client.get(f"/api/documents/{doc_id}/pdf/")
        assert resp.status_code == 200
        assert "application/pdf" in resp["Content-Type"]

    def test_invoice_pdf_returns_200(self, admin_client, product):
        doc_id = self._create_doc(admin_client, product, "invoice")
        resp = admin_client.get(f"/api/documents/{doc_id}/pdf/")
        assert resp.status_code == 200
        assert "application/pdf" in resp["Content-Type"]
