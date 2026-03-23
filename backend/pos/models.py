import uuid
from datetime import date
from django.db import models
from django.conf import settings


class Customer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, unique=True)
    email = models.EmailField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    total_purchases = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    last_purchase = models.DateTimeField(blank=True, null=True)
    loyalty_points = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-last_purchase"]

    def __str__(self):
        return f"{self.name} ({self.phone})"


class Sale(models.Model):
    PAYMENT_METHODS = [
        ("cash", "Cash"),
        ("mpesa", "M-Pesa"),
        ("card", "Card"),
    ]
    STATUS_CHOICES = [
        ("completed", "Completed"),
        ("pending", "Pending"),
        ("cancelled", "Cancelled"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    receipt_number = models.CharField(max_length=20, unique=True)  # NIC-20240320-001
    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales",
    )
    # Walk-in customer fields (used when no Customer FK)
    customer_name = models.CharField(max_length=255, blank=True)
    customer_phone = models.CharField(max_length=20, blank=True)

    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHODS)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="completed")
    served_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales",
    )
    is_return = models.BooleanField(default=False)
    parent_sale = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="returns",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["created_at"]),
            models.Index(fields=["status"]),
            models.Index(fields=["is_return"]),
        ]

    def __str__(self):
        return f"{self.receipt_number} — KES {self.total}"


class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "inventory.Product", on_delete=models.PROTECT, related_name="sale_items"
    )
    product_name = models.CharField(max_length=255)  # snapshot at time of sale
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()
    line_total = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.product_name} x{self.quantity}"


class AIRecord(models.Model):
    STATUS_CHOICES = [
        ("scheduled", "Scheduled"),
        ("completed", "Completed"),
        ("confirmed_pregnant", "Confirmed Pregnant"),
        ("failed", "Failed"),
    ]

    CALVING_OUTCOME_CHOICES = [
        ("bull", "Bull"),
        ("heifer", "Heifer"),
        ("twin", "Twin"),
        ("abortion", "Abortion"),
        ("unknown", "Unknown"),
        ("died", "Animal Died"),
        ("slaughtered", "Slaughtered"),
        ("sold", "Sold"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Certificate identification
    certificate_no = models.CharField(max_length=25, unique=True, blank=True)

    # Farmer details
    farmer_name = models.CharField(max_length=255)
    farmer_phone = models.CharField(max_length=20)
    sub_location = models.CharField(max_length=100, blank=True)
    farm_ai_no = models.CharField(max_length=50, blank=True, verbose_name="Farm A.I No.")
    amount_charged = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        verbose_name="Service Fee (Kshs)"
    )

    # Animal details
    cow_id = models.CharField(max_length=50, verbose_name="Ear No.")
    animal_name = models.CharField(max_length=100, blank=True)
    cow_breed = models.CharField(max_length=100)
    animal_dob = models.DateField(null=True, blank=True, verbose_name="Animal Date of Birth")

    # Last calving
    last_calving_date = models.DateField(null=True, blank=True)
    last_calving_outcome = models.CharField(
        max_length=20, choices=CALVING_OUTCOME_CHOICES, blank=True
    )

    # First insemination
    semen_product = models.ForeignKey(
        "inventory.Product",
        on_delete=models.PROTECT,
        limit_choices_to={"is_ai_product": True},
        related_name="ai_records",
    )
    insemination_date = models.DateField()
    insemination_time = models.TimeField(null=True, blank=True)
    bull_code = models.CharField(max_length=50, blank=True)
    bull_name = models.CharField(max_length=100, blank=True)
    technician = models.CharField(max_length=255)

    # Second insemination (optional repeat)
    second_semen_product = models.ForeignKey(
        "inventory.Product",
        on_delete=models.PROTECT,
        limit_choices_to={"is_ai_product": True},
        related_name="ai_records_second",
        null=True,
        blank=True,
    )
    second_insemination_date = models.DateField(null=True, blank=True)
    second_insemination_time = models.TimeField(null=True, blank=True)
    second_bull_code = models.CharField(max_length=50, blank=True)
    second_bull_name = models.CharField(max_length=100, blank=True)
    second_technician = models.CharField(max_length=255, blank=True)

    # Outcome & notes
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="scheduled")
    measure = models.TextField(blank=True, verbose_name="Measurements / Observations")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-insemination_date"]

    def save(self, *args, **kwargs):
        if not self.certificate_no:
            today = date.today()
            prefix = f"NIC-AI-{today.strftime('%Y%m%d')}-"
            count = AIRecord.objects.filter(certificate_no__startswith=prefix).count()
            self.certificate_no = f"{prefix}{str(count + 1).zfill(3)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.certificate_no} — {self.farmer_name} / {self.cow_id} ({self.get_status_display()})"


class MpesaTransaction(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("success", "Success"),
        ("failed", "Failed"),
        ("cancelled", "Cancelled"),
    ]

    checkout_request_id = models.CharField(max_length=100, unique=True)
    merchant_request_id = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    account_reference = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    mpesa_receipt = models.CharField(max_length=50, blank=True)
    result_desc = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"MPesa {self.checkout_request_id} — {self.status}"
