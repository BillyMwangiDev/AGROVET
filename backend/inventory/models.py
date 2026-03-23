import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


class Supplier(models.Model):
    """Supplier/vendor that provides products to the store."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    tax_id = models.CharField(max_length=50, blank=True)
    payment_terms = models.CharField(max_length=100, blank=True, help_text="e.g. Net 30")
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    rating = models.PositiveSmallIntegerField(default=0, help_text="Rating 0–5")
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)  # feeds, seeds, chemicals, semen, equipment
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="categories/", blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Icon identifier e.g. 'leaf'")
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        related_name="subcategories",
        null=True,
        blank=True,
    )
    is_admin_only = models.BooleanField(
        default=False,
        help_text="If checked, this category is only visible to admin/staff users.",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "categories"
        ordering = ["name"]

    def __str__(self):
        if self.parent:
            return f"{self.parent.name} > {self.name}"
        return self.name


class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    sku = models.CharField(max_length=50, unique=True, blank=True, null=True)
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="products"
    )
    price = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=50)  # "50kg bag", "straw", "litre"
    package_size = models.CharField(max_length=50, blank=True, help_text="e.g. 100ml, 1L, 500g")
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)

    # SEO fields
    meta_title = models.CharField(max_length=60, blank=True)
    meta_description = models.CharField(max_length=160, blank=True)

    # Inventory fields
    stock_level = models.PositiveIntegerField(default=0)
    reorder_point = models.PositiveIntegerField(default=10)
    max_stock = models.PositiveIntegerField(default=100)
    expiry_date = models.DateField(blank=True, null=True)
    supplier = models.CharField(max_length=255, blank=True)  # legacy text field
    supplier_ref = models.ForeignKey(
        Supplier,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
        help_text="Link to a supplier record (optional).",
    )
    last_restocked = models.DateTimeField(blank=True, null=True)

    # AI Semen-specific fields (null/blank on non-semen products)
    is_ai_product = models.BooleanField(default=False)
    breed = models.CharField(max_length=100, blank=True)
    origin_country = models.CharField(max_length=100, blank=True)
    sire_code = models.CharField(max_length=50, blank=True, null=True, unique=True)
    # genetic_traits stores: {"milkYield": "12,000L+", "hardiness": "Moderate", ...}
    genetic_traits = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["category", "name"]
        indexes = [
            models.Index(fields=["category", "is_active"]),
            models.Index(fields=["is_ai_product"]),
            models.Index(fields=["stock_level"]),
            models.Index(fields=["is_featured"]),
            models.Index(fields=["slug"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.category})"

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def stock_status(self):
        if self.stock_level == 0:
            return "out_of_stock"
        if self.stock_level <= self.reorder_point:
            return "low"
        if self.stock_level <= self.reorder_point * 2:
            return "moderate"
        return "stocked"


class ProductImage(models.Model):
    """Additional product images beyond the main image."""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="additional_images")
    image = models.ImageField(upload_to="products/additional/")
    alt_text = models.CharField(max_length=200, blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "created_at"]

    def __str__(self):
        return f"{self.product.name} — image {self.order}"


class StockLog(models.Model):
    REASON_CHOICES = [
        ("sale", "Sale"),
        ("adjustment", "Manual Adjustment"),
        ("restock", "Restock"),
        ("return", "Return"),
        ("import", "Import"),
        ("purchase_order", "Purchase Order"),
        ("damaged", "Damaged"),
        ("expired", "Expired"),
    ]

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="stock_logs"
    )
    change = models.IntegerField()  # positive = stock in, negative = stock out
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    note = models.CharField(max_length=255, blank=True)
    reference = models.CharField(max_length=100, blank=True, help_text="PO number, order number, etc.")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="stock_logs",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["product", "created_at"])]

    def __str__(self):
        sign = "+" if self.change >= 0 else ""
        return f"{self.product.name} {sign}{self.change} ({self.reason})"


def _generate_po_number():
    """Auto-generate a PO number: PO-YYYYMMDD-NNN (daily sequence)."""
    today = timezone.now().date()
    prefix = f"PO-{today.strftime('%Y%m%d')}-"
    last = PurchaseOrder.objects.filter(po_number__startswith=prefix).order_by("-po_number").first()
    if last:
        try:
            seq = int(last.po_number.split("-")[-1]) + 1
        except (ValueError, IndexError):
            seq = 1
    else:
        seq = 1
    return f"{prefix}{seq:03d}"


class PurchaseOrder(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("sent", "Sent to Supplier"),
        ("confirmed", "Confirmed"),
        ("partial", "Partially Received"),
        ("received", "Fully Received"),
        ("cancelled", "Cancelled"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    po_number = models.CharField(max_length=30, unique=True, blank=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name="purchase_orders")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    expected_delivery = models.DateField(null=True, blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="purchase_orders",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.po_number} — {self.supplier.name}"

    def save(self, *args, **kwargs):
        if not self.po_number:
            self.po_number = _generate_po_number()
        # Recalculate total
        self.total = self.subtotal + self.tax + self.shipping
        super().save(*args, **kwargs)


class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="po_items")
    quantity_ordered = models.PositiveIntegerField()
    quantity_received = models.PositiveIntegerField(default=0)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.product.name} × {self.quantity_ordered}"

    @property
    def remaining(self):
        return max(0, self.quantity_ordered - self.quantity_received)

    @property
    def line_total(self):
        return self.unit_cost * self.quantity_ordered


class StockAlert(models.Model):
    TYPE_CHOICES = [
        ("low_stock", "Low Stock"),
        ("out_of_stock", "Out of Stock"),
        ("overstock", "Overstock"),
        ("expiring_soon", "Expiring Soon"),
        ("expired", "Expired"),
        ("damaged", "Damaged"),
    ]
    STATUS_CHOICES = [
        ("active", "Active"),
        ("acknowledged", "Acknowledged"),
        ("resolved", "Resolved"),
        ("dismissed", "Dismissed"),
    ]
    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("critical", "Critical"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="stock_alerts")
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default="medium")
    message = models.CharField(max_length=300)
    threshold_value = models.IntegerField(null=True, blank=True)
    acknowledged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="acknowledged_alerts",
    )
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="resolved_alerts",
    )
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["product", "status"])]

    def __str__(self):
        return f"{self.get_type_display()} — {self.product.name} [{self.status}]"

    def acknowledge(self, user):
        self.status = "acknowledged"
        self.acknowledged_by = user
        self.acknowledged_at = timezone.now()
        self.save(update_fields=["status", "acknowledged_by", "acknowledged_at"])

    def resolve(self, user):
        self.status = "resolved"
        self.resolved_by = user
        self.resolved_at = timezone.now()
        self.save(update_fields=["status", "resolved_by", "resolved_at"])

    def dismiss(self):
        self.status = "dismissed"
        self.save(update_fields=["status"])
