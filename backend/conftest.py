"""
Shared pytest fixtures for Nicmah Agrovet backend tests.
"""
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


# ── Auth / User fixtures ─────────────────────────────────────────────────────

@pytest.fixture
def api_client():
    """Unauthenticated DRF test client."""
    return APIClient()


@pytest.fixture
def admin_user(db):
    """Admin user — role='admin', is_staff=True for DRF IsAdminUser permission."""
    user = User.objects.create_user(
        username="admin_test",
        password="testpass123",
        first_name="Admin",
        last_name="Test",
        email="admin@test.com",
        role="admin",
        is_staff=True,
        is_superuser=True,
    )
    return user


@pytest.fixture
def manager_user(db):
    """Manager user — role='manager', is_staff=True."""
    user = User.objects.create_user(
        username="manager_test",
        password="testpass123",
        first_name="Manager",
        last_name="Test",
        email="manager@test.com",
        role="manager",
        is_staff=True,
    )
    return user


@pytest.fixture
def cashier_user(db):
    """Cashier user with PIN set to '1234', is_staff=True for POS access."""
    user = User.objects.create_user(
        username="cashier_test",
        password="testpass123",
        first_name="Cashier",
        last_name="Test",
        email="cashier@test.com",
        role="cashier",
        is_staff=True,
        is_active_cashier=True,
    )
    user.set_pin("1234")
    user.save()
    return user


@pytest.fixture
def customer_user(db):
    """Customer user — role='customer', is_staff=False."""
    user = User.objects.create_user(
        username="customer_test",
        password="testpass123",
        role="customer",
        is_staff=False,
    )
    return user


@pytest.fixture
def admin_client(admin_user):
    """Pre-authenticated client as admin."""
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture
def manager_client(manager_user):
    """Pre-authenticated client as manager."""
    client = APIClient()
    client.force_authenticate(user=manager_user)
    return client


@pytest.fixture
def cashier_client(cashier_user):
    """Pre-authenticated client as cashier."""
    client = APIClient()
    client.force_authenticate(user=cashier_user)
    return client


@pytest.fixture
def customer_client(customer_user):
    """Pre-authenticated client as customer."""
    client = APIClient()
    client.force_authenticate(user=customer_user)
    return client


# ── Inventory fixtures ────────────────────────────────────────────────────────

@pytest.fixture
def category(db):
    from inventory.models import Category
    return Category.objects.create(name="Feeds", slug="feeds")


@pytest.fixture
def product(db, category):
    from inventory.models import Product
    return Product.objects.create(
        name="Unga wa Ngano",
        category=category,
        price=Decimal("500.00"),
        unit="50kg bag",
        stock_level=100,
        reorder_point=10,
        max_stock=200,
    )


@pytest.fixture
def low_stock_product(db, category):
    from inventory.models import Product
    return Product.objects.create(
        name="Low Stock Item",
        category=category,
        price=Decimal("200.00"),
        unit="bottle",
        stock_level=2,
        reorder_point=5,
    )


@pytest.fixture
def ai_product(db, category):
    from inventory.models import Product
    return Product.objects.create(
        name="Friesian Semen Straw",
        category=category,
        price=Decimal("2000.00"),
        unit="straw",
        stock_level=50,
        reorder_point=5,
        is_ai_product=True,
        breed="Friesian",
        origin_country="Kenya",
    )


@pytest.fixture
def supplier(db):
    from inventory.models import Supplier
    return Supplier.objects.create(
        name="AgriSupply Ltd",
        contact_person="Jane Mwangi",
        email="jane@agrisupply.co.ke",
        phone="0700123456",
        payment_terms="Net 30",
    )


# ── POS fixtures ──────────────────────────────────────────────────────────────

@pytest.fixture
def customer(db):
    from pos.models import Customer
    return Customer.objects.create(
        name="Test Farmer",
        phone="0712345678",
        email="farmer@test.com",
    )


@pytest.fixture
def sale(db, product, admin_user, customer):
    from pos.models import Sale, SaleItem
    s = Sale.objects.create(
        receipt_number="NIC-20260306-001",
        customer=customer,
        subtotal=Decimal("500.00"),
        tax=Decimal("80.00"),
        discount=Decimal("0.00"),
        total=Decimal("580.00"),
        payment_method="cash",
        status="completed",
        served_by=admin_user,
    )
    SaleItem.objects.create(
        sale=s,
        product=product,
        product_name=product.name,
        unit_price=product.price,
        quantity=1,
        line_total=product.price,
    )
    return s


# ── Content fixtures ──────────────────────────────────────────────────────────

@pytest.fixture
def article_category(db):
    from content.models import ArticleCategory
    return ArticleCategory.objects.create(name="Farming Tips")


@pytest.fixture
def published_article(db, article_category, admin_user):
    from content.models import Article
    return Article.objects.create(
        title="How to Feed Dairy Cows",
        body="Feed dairy cows well for high yields.",
        author=admin_user,
        category=article_category,
        is_published=True,
    )


@pytest.fixture
def draft_article(db, article_category, admin_user):
    from content.models import Article
    return Article.objects.create(
        title="Draft Article",
        body="This is a draft.",
        author=admin_user,
        category=article_category,
        is_published=False,
    )
