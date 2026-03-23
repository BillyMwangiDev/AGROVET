from django.urls import path
from .views import (
    CustomerListCreateView,
    CustomerDetailView,
    CustomerSalesView,
    CreateSaleView,
    SalePDFView,
    SaleListView,
    SaleDetailView,
    SaleReceiptHTMLView,
    AIRecordListCreateView,
    AIRecordDetailView,
    DashboardStatsView,
    SalesTrendView,
    CategorySplitView,
    MpesaSTKPushView,
    MpesaCallbackView,
    MpesaStatusView,
    HourlySalesView,
    SlowMoversView,
    CashierAuditView,
    DateRangeReportView,
    ExportCSVView,
    ExportExcelView,
)

urlpatterns = [
    # Customers
    path("customers/", CustomerListCreateView.as_view(), name="customer_list_create"),
    path("customers/<uuid:pk>/", CustomerDetailView.as_view(), name="customer_detail"),
    path("customers/<uuid:pk>/sales/", CustomerSalesView.as_view(), name="customer_sales"),
    # POS
    path("pos/sale/", CreateSaleView.as_view(), name="create_sale"),
    path("pos/sale/<uuid:pk>/receipt.pdf/", SalePDFView.as_view(), name="sale_pdf"),
    path("pos/sales/", SaleListView.as_view(), name="sale_list"),
    path("pos/sales/<uuid:pk>/", SaleDetailView.as_view(), name="sale_detail"),
    path("pos/sales/<uuid:pk>/receipt.html/", SaleReceiptHTMLView.as_view(), name="sale_receipt_html"),
    # M-Pesa
    path("pos/mpesa/stk-push/", MpesaSTKPushView.as_view(), name="mpesa_stk_push"),
    path("pos/mpesa/callback/<str:callback_secret>/", MpesaCallbackView.as_view(), name="mpesa_callback"),
    path("pos/mpesa/status/<str:checkout_request_id>/", MpesaStatusView.as_view(), name="mpesa_status"),
    # AI Records
    path("ai-records/", AIRecordListCreateView.as_view(), name="ai_record_list_create"),
    path("ai-records/<uuid:pk>/", AIRecordDetailView.as_view(), name="ai_record_detail"),
    # Analytics (existing)
    path("analytics/dashboard/", DashboardStatsView.as_view(), name="analytics_dashboard"),
    path("analytics/sales-trend/", SalesTrendView.as_view(), name="analytics_sales_trend"),
    path("analytics/category-split/", CategorySplitView.as_view(), name="analytics_category_split"),
    # Analytics (Phase 4)
    path("analytics/hourly/", HourlySalesView.as_view(), name="analytics_hourly"),
    path("analytics/slow-movers/", SlowMoversView.as_view(), name="analytics_slow_movers"),
    path("analytics/cashier-audit/", CashierAuditView.as_view(), name="analytics_cashier_audit"),
    path("analytics/date-range/", DateRangeReportView.as_view(), name="analytics_date_range"),
    path("analytics/export/csv/", ExportCSVView.as_view(), name="analytics_export_csv"),
    path("analytics/export/excel/", ExportExcelView.as_view(), name="analytics_export_excel"),
]
