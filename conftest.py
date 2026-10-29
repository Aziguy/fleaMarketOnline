import pytest

from apps.accounts.models import User
from apps.catalog.models import Product, Service
from apps.shops.models import Shop, ShopType
from apps.shops.services import ensure_opening_hours


@pytest.fixture(autouse=True)
def _clear_cache():
    from django.core.cache import cache

    cache.clear()


PASSWORD = "Secret-pass-123"


@pytest.fixture
def customer(db):
    return User.objects.create_user("677111111", PASSWORD, first_name="Awa")


@pytest.fixture
def merchant(db):
    return User.objects.create_user(
        "699222222", PASSWORD, first_name="Paul", role=User.Role.MERCHANT
    )


def make_shop(owner, type_slug="epicerie", **extra):
    defaults = {
        "name": f"Boutique {owner.first_name}",
        "shop_type": ShopType.objects.get(slug=type_slug),
        "phone": "677000000",
        "mtn_momo_number": "677000000",
        "status": Shop.Status.APPROVED,
    }
    shop = Shop.objects.create(owner=owner, **{**defaults, **extra})
    ensure_opening_hours(shop)
    return shop


@pytest.fixture
def shop(merchant):
    return make_shop(merchant, offers_delivery=True, delivery_fee=1000)


@pytest.fixture
def product(shop):
    return Product.objects.create(shop=shop, name="Riz 5 kg", price=4500, stock=10)


@pytest.fixture
def salon(db):
    owner = User.objects.create_user("699333333", PASSWORD, first_name="Mireille")
    shop = make_shop(owner, "coiffure-beaute")
    Service.objects.create(shop=shop, name="Tresses", price=10000, duration_minutes=120)
    return shop


@pytest.fixture
def customer_client(client, customer):
    client.force_login(customer)
    return client


@pytest.fixture
def merchant_client(client, merchant, shop):
    client.force_login(merchant)
    return client
