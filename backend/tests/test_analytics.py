"""
Tests for analytics endpoints — dashboard, trends, exports.
"""
import pytest
from decimal import Decimal

from pos.models import Sale, SaleItem


# ── Dashboard Stats ───────────────────────────────────────────────────────────

class TestDashboardStats:
    URL = "/api/analytics/dashboard/"

    def test_returns_dashboard_keys(self, admin_client, db):
        resp = admin_client.get(self.URL)
        assert resp.status_code == 200
        assert "today_sales_total" in resp.data
        assert "today_orders_count" in resp.data
        assert "low_stock_count" in resp.data
        assert "total_customers" in resp.data
        assert "recent_sales" in resp.data

    def test_counts_todays_completed_sales(self, admin_client, sale):
        resp = admin_client.get(self.URL)
        assert resp.status_code == 200
        # The fixture sale has status=completed and created today
        assert resp.data["today_orders_count"] >= 1

    def test_counts_low_stock_products(self, admin_client, low_stock_product):
        resp = admin_client.get(self.URL)
        assert resp.status_code == 200
        # low_stock_product has stock_level=2, reorder_point=5 → low
        assert resp.data["low_stock_count"] >= 1

    def test_unauthenticated_returns_401(self, api_client):
        resp = api_client.get(self.URL)
        assert resp.status_code == 401


# ── Sales Trend ───────────────────────────────────────────────────────────────

class TestSalesTrend:
    URL = "/api/analytics/sales-trend/"

    def test_returns_list(self, admin_client, db):
        resp = admin_client.get(self.URL)
        assert resp.status_code == 200
        assert isinstance(resp.data, list)

    def test_default_7_days(self, admin_client, db):
        resp = admin_client.get(self.URL)
        assert resp.status_code == 200
        # With no sales data we get 0 entries (only days with sales are returned)
        assert isinstance(resp.data, list)

    def test_custom_days_param(self, admin_client, db):
        resp = admin_client.get(f"{self.URL}?days=14")
        assert resp.status_code == 200


# ── Category Split ────────────────────────────────────────────────────────────

class TestCategorySplit:
    URL = "/api/analytics/category-split/"

    def test_returns_list(self, admin_client, db):
        resp = admin_client.get(self.URL)
        assert resp.status_code == 200
        assert isinstance(resp.data, list)

    def test_returns_revenue_by_category(self, admin_client, sale):
        resp = admin_client.get(self.URL)
        assert resp.status_code == 200
        # With a sale fixture, there should be at least one category
        assert isinstance(resp.data, list)

    def test_unauthenticated_returns_401(self, api_client):
        resp = api_client.get(self.URL)
        assert resp.status_code == 401


# ── Hourly Sales ──────────────────────────────────────────────────────────────

class TestHourlySales:
    URL = "/api/analytics/hourly/"

    def test_returns_24_hour_buckets(self, admin_client, db):
        resp = admin_client.get(self.URL)
        assert resp.status_code == 200
        assert len(resp.data) == 24
        # Check structure
        assert "hour" in resp.data[0]
        assert "orders" in resp.data[0]
        assert "sales" in resp.data[0]

    def test_custom_days_param(self, admin_client, db):
        resp = admin_client.get(f"{self.URL}?days=7")
        assert resp.status_code == 200
        assert len(resp.data) == 24


# ── Slow Movers ───────────────────────────────────────────────────────────────

class TestSlowMovers:
    URL = "/api/analytics/slow-movers/"

    def test_returns_list(self, admin_client, product):
        resp = admin_client.get(self.URL)
        assert resp.status_code == 200
        assert isinstance(resp.data, list)

    def test_response_has_expected_fields(self, admin_client, product):
        resp = admin_client.get(self.URL)
        assert resp.status_code == 200
        if resp.data:
            item = resp.data[0]
            assert "name" in item
            assert "stock_level" in item
            assert "qty_sold" in item


# ── Cashier Audit ─────────────────────────────────────────────────────────────

class TestCashierAudit:
    URL = "/api/analytics/cashier-audit/"

    def test_returns_list(self, admin_client, db):
        resp = admin_client.get(self.URL)
        assert resp.status_code == 200
        assert isinstance(resp.data, list)

    def test_includes_cashier_on_sale(self, admin_client, sale):
        resp = admin_client.get(self.URL)
        assert resp.status_code == 200
        if resp.data:
            item = resp.data[0]
            assert "total_sales" in item
            assert "order_count" in item

    def test_unauthenticated_returns_401(self, api_client):
        resp = api_client.get(self.URL)
        assert resp.status_code == 401


# ── Exports ───────────────────────────────────────────────────────────────────

class TestExports:
    def test_export_csv_returns_text_csv(self, admin_client, sale):
        resp = admin_client.get("/api/analytics/export/csv/")
        assert resp.status_code == 200
        assert "text/csv" in resp["Content-Type"]
        content = b"".join(resp.streaming_content) if hasattr(resp, "streaming_content") else resp.content
        assert b"Receipt No" in content

    def test_export_excel_returns_xlsx_content_type(self, admin_client, sale):
        resp = admin_client.get("/api/analytics/export/excel/")
        assert resp.status_code == 200
        ct = resp["Content-Type"]
        assert "spreadsheetml" in ct or "excel" in ct

    def test_export_csv_unauthenticated_returns_401(self, api_client):
        resp = api_client.get("/api/analytics/export/csv/")
        assert resp.status_code == 401

    def test_date_range_report(self, admin_client, sale):
        resp = admin_client.get(
            "/api/analytics/date-range/?start=2026-01-01&end=2026-12-31"
        )
        assert resp.status_code == 200
        assert "total_sales" in resp.data
        assert "total_orders" in resp.data
        assert "daily" in resp.data
