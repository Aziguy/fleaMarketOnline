from datetime import datetime, time

import pytest
from django.core import mail
from django.urls import reverse
from django.utils import timezone

from apps.shops.models import Shop, ShopType
from apps.shops.services import set_status


def test_shop_types_are_seeded(db):
    assert ShopType.objects.filter(slug="coiffure-beaute", takes_appointments=True).exists()
    assert ShopType.objects.filter(slug="restaurant", takes_table_bookings=True).exists()


def test_open_shop_makes_user_merchant(customer_client, customer):
    response = customer_client.post(
        reverse("shops:open"),
        {
            "name": "Chez Awa",
            "shop_type": ShopType.objects.get(slug="epicerie").pk,
            "level": "rdc",
            "unit": "A01",
            "phone": "677111111",
        },
    )
    assert response.status_code == 302
    shop = Shop.objects.get(owner=customer)
    customer.refresh_from_db()
    assert customer.is_merchant
    assert shop.status == Shop.Status.PENDING
    assert shop.slug == "chez-awa"
    assert shop.opening_hours.count() == 7


def test_pending_shop_hidden_from_public(client, shop):
    shop.status = Shop.Status.PENDING
    shop.save()
    assert client.get(shop.get_absolute_url()).status_code == 404
    assert shop not in client.get(reverse("shops:list")).context["page"]


def test_owner_can_preview_pending_shop(merchant_client, shop):
    shop.status = Shop.Status.PENDING
    shop.save()
    assert merchant_client.get(shop.get_absolute_url()).status_code == 200


def test_approval_notifies_owner(shop):
    shop.email = "boutique@example.cm"
    shop.status = Shop.Status.PENDING
    shop.save()
    set_status(shop, Shop.Status.APPROVED)
    assert len(mail.outbox) == 1


@pytest.mark.parametrize(
    "moment, expected",
    [
        (datetime(2026, 11, 2, 10, 0), True),
        (datetime(2026, 11, 2, 20, 0), False),
        (datetime(2026, 11, 1, 10, 0), False),
    ],
)
def test_is_open_at(shop, moment, expected):
    assert shop.is_open_at(timezone.make_aware(moment)) is expected


def test_opening_hours_default_sunday_closed(shop):
    sunday = shop.opening_hours.get(weekday=6)
    assert sunday.closed
    assert shop.opening_hours.get(weekday=0).opens == time(8, 0)
