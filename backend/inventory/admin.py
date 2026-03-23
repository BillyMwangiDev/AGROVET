from django.contrib import admin
from .models import Category, Product, Supplier, PurchaseOrder, PurchaseOrderItem, StockAlert


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        "name", "category", "price", "unit",
        "stock_level", "reorder_point", "is_ai_product", "is_active",
    ]
    list_filter = ["category", "is_ai_product", "is_active"]
    search_fields = ["name", "description", "sire_code"]
    list_editable = ["stock_level", "is_active"]
    readonly_fields = ["created_at", "updated_at"]
    fieldsets = (
        ("Basic Info", {
            "fields": ("name", "category", "price", "unit", "description", "image", "is_active")
        }),
        ("Inventory", {
            "fields": ("stock_level", "reorder_point", "max_stock", "expiry_date",
                       "supplier", "supplier_ref", "last_restocked")
        }),
        ("AI Semen (leave blank for non-semen products)", {
            "fields": ("is_ai_product", "breed", "origin_country", "sire_code", "genetic_traits"),
            "classes": ("collapse",),
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ["name", "contact_person", "email", "phone", "rating", "is_active"]
    list_filter = ["is_active", "rating"]
    search_fields = ["name", "contact_person", "email", "phone"]
    list_editable = ["is_active"]


class PurchaseOrderItemInline(admin.TabularInline):
    model = PurchaseOrderItem
    extra = 0
    readonly_fields = ["remaining"]


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ["po_number", "supplier", "status", "total", "expected_delivery", "created_at"]
    list_filter = ["status"]
    search_fields = ["po_number", "supplier__name"]
    readonly_fields = ["po_number", "total", "created_at", "updated_at"]
    inlines = [PurchaseOrderItemInline]


@admin.register(StockAlert)
class StockAlertAdmin(admin.ModelAdmin):
    list_display = ["product", "type", "priority", "status", "created_at"]
    list_filter = ["type", "status", "priority"]
    search_fields = ["product__name", "message"]
    readonly_fields = ["created_at", "acknowledged_at", "resolved_at"]
