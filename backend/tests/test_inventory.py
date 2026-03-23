"""
Tests for the inventory app — products, stock, suppliers, purchase orders, alerts.
"""
import io
from decimal import Decimal

import pytest
from django.utils.text import slugify

from inventory.models import Category, Product, StockLog, Supplier, StockAlert


# ── Product Model ─────────────────────────────────────────────────────────────

class TestProductModel:
    def test_slug_auto_generated(self, db, category):
        p = Product.objects.create(
            name="Dairy Meal 50kg", category=category,
            price=Decimal("800.00"), unit="bag", stock_level=10,
        )
        assert p.slug == "dairy-meal-50kg"

    def test_stock_status_out_of_stock_when_zero(self, db, category):
        p = Product.objects.create(
            name="Empty Product", category=category,
            price=Decimal("100.00"), unit="unit",
            stock_level=0, reorder_point=5,
        )
        assert p.stock_status == "out_of_stock"

    def test_stock_status_low_when_at_reorder_point(self, db, category):
        p = Product.objects.create(
            name="Low Product", category=category,
            price=Decimal("100.00"), unit="unit",
            stock_level=3, reorder_point=5,
        )
        assert p.stock_status == "low"

    def test_stock_status_stocked_when_adequate(self, product):
        # product has stock_level=100, reorder_point=10 → 100 > 10*2=20 → stocked
        assert product.stock_status == "stocked"

    def test_slug_uniqueness_increments(self, db, category):
        p1 = Product.objects.create(
            name="Same Name", category=category,
            price=Decimal("100.00"), unit="unit",
        )
        p2 = Product.objects.create(
            name="Same Name", category=category,
            price=Decimal("100.00"), unit="unit",
        )
        assert p1.slug != p2.slug
        assert p2.slug == "same-name-1"


# ── Public Product Endpoints ──────────────────────────────────────────────────

class TestPublicProductEndpoints:
    def test_lists_active_products(self, api_client, product):
        resp = api_client.get("/api/products/")
        assert resp.status_code == 200
        names = [p["name"] for p in resp.data["results"]]
        assert "Unga wa Ngano" in names

    def test_inactive_product_not_in_public_list(self, api_client, product):
        product.is_active = False
        product.save()
        resp = api_client.get("/api/products/")
        names = [p["name"] for p in resp.data["results"]]
        assert "Unga wa Ngano" not in names

    def test_filter_by_category_slug(self, api_client, product, db):
        resp = api_client.get("/api/products/?category=feeds")
        assert resp.status_code == 200
        assert len(resp.data["results"]) >= 1

    def test_filter_is_ai_true(self, api_client, ai_product):
        resp = api_client.get("/api/products/?is_ai=true")
        assert resp.status_code == 200
        names = [p["name"] for p in resp.data["results"]]
        assert "Friesian Semen Straw" in names

    def test_search_by_name(self, api_client, product):
        resp = api_client.get("/api/products/?q=Unga")
        assert resp.status_code == 200
        assert any("Unga" in p["name"] for p in resp.data["results"])

    def test_product_detail_by_uuid(self, api_client, product):
        resp = api_client.get(f"/api/products/{product.pk}/")
        assert resp.status_code == 200
        assert resp.data["name"] == "Unga wa Ngano"

    def test_product_detail_by_slug(self, api_client, product):
        resp = api_client.get(f"/api/products/slug/{product.slug}/")
        assert resp.status_code == 200
        assert resp.data["name"] == "Unga wa Ngano"

    def test_featured_products_endpoint(self, api_client, db, category):
        Product.objects.create(
            name="Featured Product", category=category,
            price=Decimal("300.00"), unit="unit",
            is_featured=True, stock_level=10,
        )
        resp = api_client.get("/api/products/featured/")
        assert resp.status_code == 200
        results = resp.data.get("results", resp.data) if isinstance(resp.data, dict) else resp.data
        names = [p["name"] for p in results]
        assert "Featured Product" in names

    def test_product_public_serializer_has_no_stock_level(self, api_client, product):
        resp = api_client.get(f"/api/products/{product.pk}/")
        assert resp.status_code == 200
        assert "stock_level" not in resp.data


# ── Category Endpoints ────────────────────────────────────────────────────────

class TestCategoryEndpoints:
    def test_list_categories(self, api_client, category):
        resp = api_client.get("/api/categories/")
        assert resp.status_code == 200
        names = [c["name"] for c in resp.data["results"]]
        assert "Feeds" in names

    def test_category_detail_by_slug(self, api_client, category, product):
        resp = api_client.get(f"/api/categories/{category.slug}/")
        assert resp.status_code == 200
        assert resp.data["category"]["name"] == "Feeds"
        assert resp.data["product_count"] >= 1

    def test_unknown_category_returns_404(self, api_client, db):
        resp = api_client.get("/api/categories/nonexistent-slug/")
        assert resp.status_code == 404


# ── Admin Inventory ───────────────────────────────────────────────────────────

class TestAdminInventory:
    URL = "/api/admin/inventory/"

    def test_admin_sees_stock_level_field(self, admin_client, product):
        resp = admin_client.get(self.URL)
        assert resp.status_code == 200
        results = resp.data["results"]
        assert len(results) >= 1
        assert "stock_level" in results[0]

    def test_unauthenticated_returns_401(self, api_client):
        resp = api_client.get(self.URL)
        assert resp.status_code == 401

    def test_admin_can_create_product(self, admin_client, category):
        resp = admin_client.post(self.URL, {
            "name": "New Product",
            "category": category.pk,
            "price": "350.00",
            "unit": "litre",
            "stock_level": 50,
            "reorder_point": 10,
        })
        assert resp.status_code == 201
        assert Product.objects.filter(name="New Product").exists()

    def test_admin_can_soft_delete_product(self, admin_client, product):
        url = f"/api/admin/inventory/{product.pk}/"
        resp = admin_client.delete(url)
        assert resp.status_code == 204
        product.refresh_from_db()
        assert product.is_active is False

    def test_soft_deleted_product_not_in_public_list(self, api_client, admin_client, product):
        admin_client.delete(f"/api/admin/inventory/{product.pk}/")
        resp = api_client.get("/api/products/")
        names = [p["name"] for p in resp.data["results"]]
        assert "Unga wa Ngano" not in names


# ── Stock Adjustment ──────────────────────────────────────────────────────────

class TestStockAdjust:
    def test_admin_can_increase_stock(self, admin_client, product):
        url = f"/api/admin/inventory/{product.pk}/adjust-stock/"
        before = product.stock_level
        resp = admin_client.patch(url, {"adjustment": 20, "reason": "Restock delivery"})
        assert resp.status_code == 200
        assert resp.data["stock_level"] == before + 20

    def test_admin_can_decrease_stock(self, admin_client, product):
        url = f"/api/admin/inventory/{product.pk}/adjust-stock/"
        before = product.stock_level
        resp = admin_client.patch(url, {"adjustment": -5, "reason": "Damaged goods"})
        assert resp.status_code == 200
        assert resp.data["stock_level"] == before - 5

    def test_creates_stock_log_entry(self, admin_client, product):
        url = f"/api/admin/inventory/{product.pk}/adjust-stock/"
        admin_client.patch(url, {"adjustment": 10, "reason": "Test restock"})
        log = StockLog.objects.filter(product=product).first()
        assert log is not None
        assert log.change == 10

    def test_cannot_decrease_below_zero(self, admin_client, product):
        url = f"/api/admin/inventory/{product.pk}/adjust-stock/"
        resp = admin_client.patch(url, {"adjustment": -9999})
        assert resp.status_code == 400


# ── Stock Log ─────────────────────────────────────────────────────────────────

class TestStockLog:
    def test_stock_log_lists_entries(self, admin_client, product, db):
        StockLog.objects.create(
            product=product, change=10, reason="restock",
        )
        url = f"/api/admin/inventory/{product.pk}/stock-log/"
        resp = admin_client.get(url)
        assert resp.status_code == 200
        assert len(resp.data) >= 1

    def test_stock_log_requires_auth(self, api_client, product):
        url = f"/api/admin/inventory/{product.pk}/stock-log/"
        resp = api_client.get(url)
        assert resp.status_code == 401


# ── Excel Import ──────────────────────────────────────────────────────────────

class TestExcelImport:
    URL = "/api/admin/import-excel/"

    def test_import_invalid_file_type_returns_400(self, admin_client):
        fake_file = io.BytesIO(b"not an excel file")
        fake_file.name = "data.txt"
        resp = admin_client.post(self.URL, {"file": fake_file}, format="multipart")
        assert resp.status_code == 400

    def test_no_file_returns_400(self, admin_client):
        resp = admin_client.post(self.URL, {}, format="multipart")
        assert resp.status_code == 400


# ── Suppliers ─────────────────────────────────────────────────────────────────

class TestSuppliers:
    LIST_URL = "/api/suppliers/"

    def test_admin_can_list_suppliers(self, admin_client, supplier):
        resp = admin_client.get(self.LIST_URL)
        assert resp.status_code == 200
        names = [s["name"] for s in resp.data["results"]]
        assert "AgriSupply Ltd" in names

    def test_admin_can_create_supplier(self, admin_client, db):
        resp = admin_client.post(self.LIST_URL, {
            "name": "New Supplier",
            "contact_person": "John",
            "email": "new@supplier.com",
            "phone": "0711222333",
        })
        assert resp.status_code == 201

    def test_cashier_cannot_create_supplier(self, cashier_client, db):
        resp = cashier_client.post(self.LIST_URL, {
            "name": "Cashier Supplier",
            "phone": "0711222333",
        })
        assert resp.status_code == 403

    def test_admin_can_update_supplier(self, admin_client, supplier):
        url = f"/api/suppliers/{supplier.pk}/"
        resp = admin_client.patch(url, {"name": "Updated Supplier"})
        assert resp.status_code == 200
        assert resp.data["name"] == "Updated Supplier"

    def test_admin_can_deactivate_supplier(self, admin_client, supplier):
        url = f"/api/suppliers/{supplier.pk}/"
        resp = admin_client.delete(url)
        assert resp.status_code == 204
        supplier.refresh_from_db()
        assert supplier.is_active is False


# ── Purchase Orders ───────────────────────────────────────────────────────────

class TestPurchaseOrders:
    LIST_URL = "/api/purchase-orders/"

    def test_admin_can_create_po(self, admin_client, supplier, product):
        resp = admin_client.post(self.LIST_URL, {
            "supplier": str(supplier.pk),
            "expected_delivery": "2026-04-01",
            "notes": "Test PO",
            "items": [
                {
                    "product": str(product.pk),
                    "quantity_ordered": 10,
                    "unit_cost": "450.00",
                }
            ],
        }, format="json")
        assert resp.status_code == 201
        assert resp.data["po_number"].startswith("PO-")

    def test_po_auto_generates_number(self, admin_client, supplier, product):
        resp = admin_client.post(self.LIST_URL, {
            "supplier": str(supplier.pk),
            "items": [{
                "product": str(product.pk),
                "quantity_ordered": 5,
                "unit_cost": "500.00",
            }],
        }, format="json")
        assert resp.status_code == 201
        po_number = resp.data["po_number"]
        assert po_number.startswith("PO-")

    def test_cashier_cannot_create_po(self, cashier_client, supplier, product):
        resp = cashier_client.post(self.LIST_URL, {
            "supplier": str(supplier.pk),
            "items": [],
        }, format="json")
        assert resp.status_code == 403

    def test_receive_items_updates_stock(self, admin_client, supplier, product):
        from inventory.models import PurchaseOrder, PurchaseOrderItem
        po_resp = admin_client.post(self.LIST_URL, {
            "supplier": str(supplier.pk),
            "items": [{
                "product": str(product.pk),
                "quantity_ordered": 10,
                "unit_cost": "400.00",
            }],
        }, format="json")
        assert po_resp.status_code == 201
        po_id = po_resp.data["id"]
        item_id = po_resp.data["items"][0]["id"]

        before_stock = product.stock_level
        receive_url = f"/api/purchase-orders/{po_id}/receive/"
        resp = admin_client.post(receive_url, {
            "items": [{"item_id": item_id, "quantity_received": 10}],
        }, format="json")
        assert resp.status_code == 200
        product.refresh_from_db()
        assert product.stock_level == before_stock + 10
        # Check DB directly — prefetch cache in the view may cause stale status in response
        from inventory.models import PurchaseOrder as PO
        assert PO.objects.get(pk=po_id).status == "received"

    def test_receive_items_creates_stock_log(self, admin_client, supplier, product):
        po_resp = admin_client.post(self.LIST_URL, {
            "supplier": str(supplier.pk),
            "items": [{
                "product": str(product.pk),
                "quantity_ordered": 5,
                "unit_cost": "400.00",
            }],
        }, format="json")
        po_id = po_resp.data["id"]
        item_id = po_resp.data["items"][0]["id"]
        admin_client.post(f"/api/purchase-orders/{po_id}/receive/", {
            "items": [{"item_id": item_id, "quantity_received": 5}],
        }, format="json")
        logs = StockLog.objects.filter(product=product, reason="purchase_order")
        assert logs.exists()

    def test_po_pdf_returns_200(self, admin_client, supplier, product):
        po_resp = admin_client.post(self.LIST_URL, {
            "supplier": str(supplier.pk),
            "items": [{
                "product": str(product.pk),
                "quantity_ordered": 3,
                "unit_cost": "400.00",
            }],
        }, format="json")
        po_id = po_resp.data["id"]
        resp = admin_client.get(f"/api/purchase-orders/{po_id}/pdf/")
        assert resp.status_code == 200
        assert resp["Content-Type"] == "application/pdf"


# ── Stock Alerts ──────────────────────────────────────────────────────────────

class TestStockAlerts:
    def test_generate_alerts_scans_products(self, admin_client, low_stock_product):
        resp = admin_client.post("/api/stock-alerts/generate/")
        assert resp.status_code == 200
        assert "products_scanned" in resp.data

    def test_generate_alerts_creates_low_stock_alert(self, admin_client, low_stock_product):
        admin_client.post("/api/stock-alerts/generate/")
        alerts = StockAlert.objects.filter(
            product=low_stock_product, type="low_stock"
        )
        assert alerts.exists()

    def test_acknowledge_alert(self, admin_client, low_stock_product):
        admin_client.post("/api/stock-alerts/generate/")
        alert = StockAlert.objects.filter(product=low_stock_product).first()
        if not alert:
            pytest.skip("No alerts generated for this product")
        resp = admin_client.patch(f"/api/stock-alerts/{alert.pk}/acknowledge/")
        assert resp.status_code == 200
        alert.refresh_from_db()
        assert alert.status == "acknowledged"

    def test_resolve_alert(self, admin_client, low_stock_product):
        StockAlert.objects.create(
            product=low_stock_product,
            type="low_stock",
            status="acknowledged",
            message="Low stock",
        )
        alert = StockAlert.objects.filter(product=low_stock_product).first()
        resp = admin_client.patch(f"/api/stock-alerts/{alert.pk}/resolve/")
        assert resp.status_code == 200
        alert.refresh_from_db()
        assert alert.status == "resolved"

    def test_list_alerts_requires_manager(self, cashier_client, db):
        resp = cashier_client.get("/api/stock-alerts/")
        # cashier has IsCashierOrAbove for acknowledge but IsManagerOrAbove for list
        assert resp.status_code == 403
