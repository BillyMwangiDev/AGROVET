import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone


def _generate_document_number(doc_type: str) -> str:
    """Auto-generate: NIC-QTN-YYYYMMDD-NNN or NIC-INV-YYYYMMDD-NNN (daily sequence)."""
    prefix_map = {"quotation": "QTN", "invoice": "INV"}
    code = prefix_map.get(doc_type, "DOC")
    today = timezone.now().date()
    prefix = f"NIC-{code}-{today.strftime('%Y%m%d')}-"
    last = Document.objects.filter(document_number__startswith=prefix).order_by("-document_number").first()
    if last:
        try:
            seq = int(last.document_number.split("-")[-1]) + 1
        except (ValueError, IndexError):
            seq = 1
    else:
        seq = 1
    return f"{prefix}{seq:03d}"


class Document(models.Model):
    TYPES = [
        ("quotation", "Quotation"),
        ("invoice", "Invoice"),
    ]
    STATUSES = [
        ("draft", "Draft"),
        ("sent", "Sent"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("cancelled", "Cancelled"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document_number = models.CharField(max_length=30, unique=True, blank=True)
    document_type = models.CharField(max_length=20, choices=TYPES)
    status = models.CharField(max_length=20, choices=STATUSES, default="draft")

    # Customer — optional FK or walk-in strings
    customer = models.ForeignKey(
        "pos.Customer",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents",
    )
    customer_name = models.CharField(max_length=255)
    customer_email = models.EmailField(blank=True)
    customer_phone = models.CharField(max_length=20, blank=True)
    customer_address = models.TextField(blank=True)

    # Dates
    issue_date = models.DateField(auto_now_add=True)
    due_date = models.DateField(null=True, blank=True)       # invoices
    valid_until = models.DateField(null=True, blank=True)    # quotations

    # Financials (calculated on save)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Text
    notes = models.TextField(blank=True)
    terms_conditions = models.TextField(blank=True)
    payment_terms = models.CharField(max_length=100, blank=True)

    # Metadata
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_documents",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["document_type", "status"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.document_number} — {self.customer_name}"

    def save(self, *args, **kwargs):
        if not self.document_number:
            self.document_number = _generate_document_number(self.document_type)
        super().save(*args, **kwargs)


class DocumentItem(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "inventory.Product",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="document_items",
    )
    description = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.description} × {self.quantity}"

    def save(self, *args, **kwargs):
        self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)
