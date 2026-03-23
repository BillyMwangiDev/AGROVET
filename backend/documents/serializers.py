from datetime import date, timedelta
from decimal import Decimal

from rest_framework import serializers

from inventory.models import Product
from pos.models import Customer
from .models import Document, DocumentItem


class DocumentItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentItem
        fields = ["id", "product", "description", "quantity", "unit_price", "total_price"]
        read_only_fields = ["id", "total_price"]


class DocumentItemCreateSerializer(serializers.Serializer):
    product_id = serializers.UUIDField(required=False, allow_null=True)
    description = serializers.CharField(max_length=255)
    quantity = serializers.IntegerField(min_value=1)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2)


class DocumentSerializer(serializers.ModelSerializer):
    items = DocumentItemSerializer(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()
    document_type_display = serializers.CharField(source="get_document_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Document
        fields = [
            "id", "document_number", "document_type", "document_type_display",
            "status", "status_display",
            "customer", "customer_name", "customer_email", "customer_phone", "customer_address",
            "issue_date", "due_date", "valid_until",
            "subtotal", "tax_amount", "discount_amount", "total_amount",
            "notes", "terms_conditions", "payment_terms",
            "items", "created_by_name", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "document_number", "issue_date", "created_at", "updated_at"]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None


class CreateDocumentSerializer(serializers.Serializer):
    document_type = serializers.ChoiceField(choices=["quotation", "invoice"])
    customer_id = serializers.UUIDField(required=False, allow_null=True)
    customer_name = serializers.CharField(max_length=255)
    customer_email = serializers.EmailField(required=False, allow_blank=True)
    customer_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    customer_address = serializers.CharField(required=False, allow_blank=True)
    # Quotation: validity_days or valid_until
    validity_days = serializers.IntegerField(required=False, min_value=1)
    valid_until = serializers.DateField(required=False, allow_null=True)
    # Invoice: due_date
    due_date = serializers.DateField(required=False, allow_null=True)
    discount_amount = serializers.DecimalField(max_digits=10, decimal_places=2, default=0, min_value=0)
    notes = serializers.CharField(required=False, allow_blank=True)
    terms_conditions = serializers.CharField(required=False, allow_blank=True)
    payment_terms = serializers.CharField(max_length=100, required=False, allow_blank=True)
    items = DocumentItemCreateSerializer(many=True, min_length=1)

    def validate(self, data):
        # Resolve valid_until for quotations
        if data.get("document_type") == "quotation":
            if not data.get("valid_until") and data.get("validity_days"):
                data["valid_until"] = date.today() + timedelta(days=data["validity_days"])
        return data


class UpdateDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ["status", "notes", "due_date", "valid_until", "payment_terms", "terms_conditions"]
