from rest_framework import serializers
from .models import Category, Product, ProductImage, StockLog, Supplier, PurchaseOrder, PurchaseOrderItem, StockAlert


class CategorySerializer(serializers.ModelSerializer):
    subcategory_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            "id", "name", "slug", "description", "image", "icon",
            "parent", "is_admin_only", "is_active", "subcategory_count",
        ]

    def get_subcategory_count(self, obj):
        return obj.subcategories.filter(is_active=True).count()


class CategoryNestedSerializer(serializers.ModelSerializer):
    """Lightweight serializer for nested category use (no recursion)."""
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "icon"]


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt_text", "order", "is_active"]


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    stock_status = serializers.CharField(read_only=True)
    additional_images = ProductImageSerializer(many=True, read_only=True)
    supplier_name = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "sku", "category", "category_name", "category_slug",
            "price", "unit", "package_size", "description", "image", "additional_images",
            "is_active", "is_featured", "stock_status",
            "meta_title", "meta_description",
            # Inventory fields (read_only on public endpoint, writable for admin)
            "stock_level", "reorder_point", "max_stock",
            "expiry_date", "supplier", "supplier_ref", "supplier_name", "last_restocked",
            # AI semen fields
            "is_ai_product", "breed", "origin_country", "sire_code", "genetic_traits",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at", "supplier_name"]

    def get_supplier_name(self, obj):
        if obj.supplier_ref:
            return obj.supplier_ref.name
        return obj.supplier or None


class ProductPublicSerializer(serializers.ModelSerializer):
    """Lighter serializer for the public storefront — excludes sensitive stock details."""
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    stock_status = serializers.CharField(read_only=True)
    in_stock = serializers.SerializerMethodField()
    additional_images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "sku", "category", "category_name", "category_slug",
            "price", "unit", "package_size", "description", "image", "additional_images",
            "is_featured", "stock_status", "in_stock",
            "meta_title", "meta_description",
            "is_ai_product", "breed", "origin_country", "sire_code", "genetic_traits",
        ]

    def get_in_stock(self, obj):
        return obj.stock_level > 0


class ProductSearchSuggestionSerializer(serializers.ModelSerializer):
    """Ultra-lightweight serializer for search autocomplete."""
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Product
        fields = ["id", "name", "slug", "sku", "category_name", "price", "in_stock"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["in_stock"] = instance.stock_level > 0
        return data


class SupplierSerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Supplier
        fields = [
            "id", "name", "contact_person", "email", "phone", "address",
            "tax_id", "payment_terms", "credit_limit", "rating", "notes",
            "is_active", "created_at", "product_count",
        ]
        read_only_fields = ["id", "created_at"]

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    product_unit = serializers.CharField(source="product.unit", read_only=True)
    remaining = serializers.IntegerField(read_only=True)
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = PurchaseOrderItem
        fields = [
            "id", "product", "product_name", "product_sku", "product_unit",
            "quantity_ordered", "quantity_received", "unit_cost",
            "remaining", "line_total", "notes",
        ]


class PurchaseOrderSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    items = PurchaseOrderItemSerializer(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            "id", "po_number", "supplier", "supplier_name", "status", "status_display",
            "expected_delivery", "subtotal", "tax", "shipping", "total",
            "notes", "items", "created_by_name", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "po_number", "total", "created_at", "updated_at"]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None


class PurchaseOrderCreateSerializer(serializers.ModelSerializer):
    """Used for creating a PO with inline items."""
    items = PurchaseOrderItemSerializer(many=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            "supplier", "status", "expected_delivery",
            "subtotal", "tax", "shipping", "notes", "items",
        ]

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        request = self.context.get("request")
        po = PurchaseOrder.objects.create(
            **validated_data,
            created_by=request.user if request else None,
        )
        subtotal = 0
        for item_data in items_data:
            item = PurchaseOrderItem.objects.create(purchase_order=po, **item_data)
            subtotal += item.unit_cost * item.quantity_ordered
        po.subtotal = subtotal
        po.save(update_fields=["subtotal", "total"])
        return po


class ReceiveItemsSerializer(serializers.Serializer):
    """Used to receive items in a PO — updates received quantities and stock."""
    items = serializers.ListField(
        child=serializers.DictField(child=serializers.IntegerField()),
        help_text='[{"item_id": 1, "quantity_received": 5}, ...]'
    )


class StockAlertSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_id = serializers.UUIDField(source="product.id", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    product_unit = serializers.CharField(source="product.unit", read_only=True)
    type_display = serializers.CharField(source="get_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)
    acknowledged_by_name = serializers.SerializerMethodField()
    resolved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = StockAlert
        fields = [
            "id", "product", "product_id", "product_name", "product_sku", "product_unit",
            "type", "type_display", "status", "status_display",
            "priority", "priority_display", "message", "threshold_value",
            "acknowledged_by_name", "resolved_by_name",
            "acknowledged_at", "resolved_at", "created_at",
        ]
        read_only_fields = fields

    def get_acknowledged_by_name(self, obj):
        if obj.acknowledged_by:
            return obj.acknowledged_by.get_full_name() or obj.acknowledged_by.username
        return None

    def get_resolved_by_name(self, obj):
        if obj.resolved_by:
            return obj.resolved_by.get_full_name() or obj.resolved_by.username
        return None


class StockAdjustSerializer(serializers.Serializer):
    adjustment = serializers.IntegerField(
        help_text="Positive to add stock, negative to reduce."
    )
    reason = serializers.CharField(max_length=255, required=False, allow_blank=True)


class StockLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    reason_display = serializers.CharField(source="get_reason_display", read_only=True)

    class Meta:
        model = StockLog
        fields = [
            "id", "change", "reason", "reason_display",
            "note", "user", "user_name", "created_at",
        ]
        read_only_fields = fields

    def get_user_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return "System"
