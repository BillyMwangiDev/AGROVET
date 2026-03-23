import uuid
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.hashers import make_password, check_password
from django.db import models


class User(AbstractUser):
    ROLE_ADMIN = "admin"
    ROLE_MANAGER = "manager"
    ROLE_CASHIER = "cashier"
    ROLE_CUSTOMER = "customer"

    ROLES = [
        (ROLE_ADMIN, "Admin"),
        (ROLE_MANAGER, "Manager"),
        (ROLE_CASHIER, "Cashier"),
        (ROLE_CUSTOMER, "Customer"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=ROLES, default=ROLE_CASHIER)
    phone = models.CharField(max_length=20, blank=True)
    pin = models.CharField(max_length=128, blank=True)  # hashed 4-digit PIN
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    is_active_cashier = models.BooleanField(default=False)

    class Meta:
        ordering = ["first_name", "last_name"]

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"

    def set_pin(self, raw_pin: str):
        """Hash and store a 4-digit PIN."""
        self.pin = make_password(raw_pin)

    def check_pin(self, raw_pin: str) -> bool:
        """Verify a raw PIN against the stored hash."""
        return check_password(raw_pin, self.pin)

    @property
    def is_admin(self):
        return self.role == self.ROLE_ADMIN

    @property
    def is_manager_or_above(self):
        return self.role in (self.ROLE_ADMIN, self.ROLE_MANAGER)

    @property
    def is_staff_member(self):
        return self.role in (self.ROLE_ADMIN, self.ROLE_MANAGER, self.ROLE_CASHIER)


class StoreConfig(models.Model):
    """Singleton model for store-wide configuration."""
    staff_limit = models.PositiveIntegerField(default=10)
    idle_timeout_minutes = models.PositiveIntegerField(default=5)

    class Meta:
        verbose_name = "Store Configuration"
        verbose_name_plural = "Store Configuration"

    def __str__(self):
        return "Store Configuration"

    @classmethod
    def get(cls):
        """Return the singleton instance, creating it if it doesn't exist."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class StoreSettings(models.Model):
    """
    Singleton — extended store settings for Phase 4.
    Stores business identity, M-Pesa credentials, and feature flags.
    """
    business_name = models.CharField(max_length=255, default="Nicmah Agrovet")
    logo = models.ImageField(upload_to="store/", null=True, blank=True)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=16)
    currency = models.CharField(max_length=10, default="KES")
    mpesa_consumer_key = models.CharField(max_length=255, blank=True)
    mpesa_consumer_secret = models.CharField(max_length=255, blank=True)
    mpesa_shortcode = models.CharField(max_length=20, blank=True)
    mpesa_passkey = models.CharField(max_length=255, blank=True)
    mpesa_callback_url = models.CharField(max_length=500, blank=True)
    receipt_footer = models.TextField(blank=True)
    enable_etims = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Store Settings"
        verbose_name_plural = "Store Settings"

    def __str__(self):
        return "Store Settings"

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
