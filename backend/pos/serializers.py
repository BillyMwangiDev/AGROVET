from rest_framework import serializers
from .models import Customer, Sale, SaleItem, AIRecord, MpesaTransaction


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            "id", "name", "phone", "email", "location",
            "notes", "total_purchases", "last_purchase", "loyalty_points", "created_at",
        ]
        read_only_fields = ["id", "total_purchases", "last_purchase", "loyalty_points", "created_at"]


class SaleItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleItem
        fields = ["id", "product", "product_name", "unit_price", "quantity", "line_total"]
        read_only_fields = ["id", "product_name", "unit_price", "line_total"]


class SaleItemCreateSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)


class SaleCreateSerializer(serializers.Serializer):
    customer_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    customer_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    customer_id = serializers.UUIDField(required=False, allow_null=True)
    payment_method = serializers.ChoiceField(choices=["cash", "mpesa", "card"])
    discount = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    redeem_points = serializers.IntegerField(min_value=0, default=0)
    items = SaleItemCreateSerializer(many=True, min_length=1)
    is_return = serializers.BooleanField(default=False)
    parent_sale_id = serializers.UUIDField(required=False, allow_null=True)


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    served_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Sale
        fields = [
            "id", "receipt_number", "customer", "customer_name", "customer_phone",
            "subtotal", "tax", "discount", "total", "payment_method",
            "status", "is_return", "parent_sale", "served_by", "served_by_name",
            "items", "created_at",
        ]
        read_only_fields = ["id", "receipt_number", "served_by", "created_at"]

    def get_served_by_name(self, obj):
        if obj.served_by:
            return obj.served_by.get_full_name() or obj.served_by.username
        return None


class SaleListSerializer(serializers.ModelSerializer):
    """Compact serializer for the receipt history browser table (no items array)."""
    customer_display = serializers.SerializerMethodField()
    served_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Sale
        fields = [
            "id", "receipt_number", "customer_display", "customer_name",
            "customer_phone", "subtotal", "tax", "discount", "total",
            "payment_method", "status", "is_return", "parent_sale",
            "served_by_name", "created_at",
        ]
        read_only_fields = fields

    def get_customer_display(self, obj):
        if obj.customer:
            return obj.customer.name
        return obj.customer_name or "Walk-in"

    def get_served_by_name(self, obj):
        if obj.served_by:
            return obj.served_by.get_full_name() or obj.served_by.username
        return None


class SaleDetailSerializer(serializers.ModelSerializer):
    """Full serializer for receipt detail modal — includes items and parent receipt number."""
    items = SaleItemSerializer(many=True, read_only=True)
    customer_display = serializers.SerializerMethodField()
    served_by_name = serializers.SerializerMethodField()
    parent_receipt_number = serializers.SerializerMethodField()

    class Meta:
        model = Sale
        fields = [
            "id", "receipt_number", "customer", "customer_display",
            "customer_name", "customer_phone", "subtotal", "tax",
            "discount", "total", "payment_method", "status",
            "is_return", "parent_sale", "parent_receipt_number",
            "served_by", "served_by_name", "items", "created_at",
        ]
        read_only_fields = fields

    def get_customer_display(self, obj):
        if obj.customer:
            return obj.customer.name
        return obj.customer_name or "Walk-in"

    def get_served_by_name(self, obj):
        if obj.served_by:
            return obj.served_by.get_full_name() or obj.served_by.username
        return None

    def get_parent_receipt_number(self, obj):
        if obj.parent_sale:
            return obj.parent_sale.receipt_number
        return None


class MpesaTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MpesaTransaction
        fields = [
            "id", "checkout_request_id", "phone", "amount",
            "status", "mpesa_receipt", "result_desc", "created_at",
        ]
        read_only_fields = fields


class AIRecordSerializer(serializers.ModelSerializer):
    semen_product_name = serializers.CharField(source="semen_product.name", read_only=True)
    semen_sire_code = serializers.CharField(source="semen_product.sire_code", read_only=True)

    class Meta:
        model = AIRecord
        fields = [
            "id", "farmer_name", "farmer_phone", "cow_id", "cow_breed",
            "semen_product", "semen_product_name", "semen_sire_code",
            "insemination_date", "technician", "status", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
