from django.contrib import admin
from .models import Customer, Sale, SaleItem, AIRecord


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ["name", "phone", "location", "total_purchases", "last_purchase"]
    search_fields = ["name", "phone", "location"]


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 0
    readonly_fields = ["line_total"]


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = [
        "receipt_number", "customer_name", "total",
        "payment_method", "status", "served_by", "created_at",
    ]
    list_filter = ["status", "payment_method", "created_at"]
    search_fields = ["receipt_number", "customer_name", "customer_phone"]
    readonly_fields = ["id", "receipt_number", "created_at"]
    inlines = [SaleItemInline]


@admin.register(AIRecord)
class AIRecordAdmin(admin.ModelAdmin):
    list_display = [
        "farmer_name", "cow_id", "cow_breed", "semen_product",
        "insemination_date", "technician", "status",
    ]
    list_filter = ["status", "insemination_date"]
    search_fields = ["farmer_name", "farmer_phone", "cow_id"]
    list_editable = ["status"]
