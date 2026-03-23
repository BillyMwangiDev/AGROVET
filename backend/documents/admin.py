from django.contrib import admin
from .models import Document, DocumentItem


class DocumentItemInline(admin.TabularInline):
    model = DocumentItem
    extra = 0
    readonly_fields = ["total_price"]


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ["document_number", "document_type", "status", "customer_name", "total_amount", "created_at"]
    list_filter = ["document_type", "status"]
    search_fields = ["document_number", "customer_name", "customer_email", "customer_phone"]
    readonly_fields = ["document_number", "issue_date", "created_at", "updated_at"]
    inlines = [DocumentItemInline]
