"""
Django signals for the inventory app.
- Sends low-stock alert emails when stock falls to/below reorder_point.
- Auto-creates/resolves StockAlert records for real-time alert tracking.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone


@receiver(post_save, sender="inventory.Product")
def handle_product_stock_alerts(sender, instance, **kwargs):
    """
    After any Product save:
    1. Resolve alerts that are no longer valid.
    2. Create new active alerts if conditions are met.
    3. Send low-stock email notification.
    """
    if not instance.is_active:
        return

    from .models import StockAlert

    today = timezone.now().date()
    _resolve_stale_alerts(instance, today)
    _create_alerts_if_needed(instance, today)
    _maybe_send_email(instance)


def _resolve_stale_alerts(product, today):
    from .models import StockAlert

    # If stock is back above reorder point → resolve low_stock / out_of_stock alerts
    if product.stock_level > product.reorder_point:
        StockAlert.objects.filter(
            product=product,
            type__in=["low_stock", "out_of_stock"],
            status__in=["active", "acknowledged"],
        ).update(status="resolved", resolved_at=timezone.now())

    # If not expired → resolve expired/expiring_soon
    if product.expiry_date is None or product.expiry_date > today:
        StockAlert.objects.filter(
            product=product,
            type__in=["expiring_soon", "expired"],
            status__in=["active", "acknowledged"],
        ).update(status="resolved", resolved_at=timezone.now())

    # If stock is at or below max_stock → resolve overstock
    if product.stock_level <= product.max_stock:
        StockAlert.objects.filter(
            product=product,
            type="overstock",
            status__in=["active", "acknowledged"],
        ).update(status="resolved", resolved_at=timezone.now())


def _create_alerts_if_needed(product, today):
    from .models import StockAlert

    def _has_active(alert_type):
        return StockAlert.objects.filter(
            product=product,
            type=alert_type,
            status__in=["active", "acknowledged"],
        ).exists()

    # Out of stock
    if product.stock_level == 0 and not _has_active("out_of_stock"):
        StockAlert.objects.create(
            product=product,
            type="out_of_stock",
            priority="critical",
            message=f"{product.name} is out of stock.",
            threshold_value=0,
        )

    # Low stock (only if not out of stock)
    elif 0 < product.stock_level <= product.reorder_point and not _has_active("low_stock"):
        StockAlert.objects.create(
            product=product,
            type="low_stock",
            priority="high",
            message=f"{product.name} stock is low: {product.stock_level} {product.unit} (reorder at {product.reorder_point}).",
            threshold_value=product.reorder_point,
        )

    # Overstock
    if product.stock_level > product.max_stock and not _has_active("overstock"):
        StockAlert.objects.create(
            product=product,
            type="overstock",
            priority="low",
            message=f"{product.name} stock exceeds max level: {product.stock_level} (max {product.max_stock}).",
            threshold_value=product.max_stock,
        )

    # Expiry alerts
    if product.expiry_date:
        days_left = (product.expiry_date - today).days
        if days_left < 0 and not _has_active("expired"):
            StockAlert.objects.create(
                product=product,
                type="expired",
                priority="critical",
                message=f"{product.name} expired on {product.expiry_date}.",
            )
        elif 0 <= days_left <= 30 and not _has_active("expiring_soon"):
            priority = "high" if days_left <= 7 else "medium"
            StockAlert.objects.create(
                product=product,
                type="expiring_soon",
                priority=priority,
                message=f"{product.name} expires in {days_left} day(s) ({product.expiry_date}).",
            )


def _maybe_send_email(product):
    if product.stock_level > product.reorder_point:
        return

    alert_email = getattr(settings, "STORE_ALERT_EMAIL", "")
    if not alert_email:
        return

    subject = f"[Nicmah Agrovet] Low Stock: {product.name}"
    message = (
        f"Product: {product.name}\n"
        f"Category: {product.category}\n"
        f"Current Stock: {product.stock_level} {product.unit}\n"
        f"Reorder Point: {product.reorder_point} {product.unit}\n\n"
        "Please restock this item as soon as possible.\n\n"
        "— Nicmah Agrovet Inventory System"
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[alert_email],
        fail_silently=True,
    )
