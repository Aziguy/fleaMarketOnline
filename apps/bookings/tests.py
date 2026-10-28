from datetime import timedelta

import pytest
from django.urls import reverse
from django.utils import timezone

from apps.bookings.models import Booking


def _next_monday(hour):
    today = timezone.localdate()
    day = today + timedelta(days=(7 - today.weekday()) or 7)
    return {"date": day.isoformat(), "time": f"{hour:02d}:00"}


@pytest.fixture
def payload(salon):
    return {
        "kind": "appointment",
        "service": salon.services.get().pk,
        "party_size": 1,
        "contact_phone": "677111111",
        **_next_monday(10),
    }


def test_book_appointment(customer_client, salon, payload):
    response = customer_client.post(reverse("bookings:create", args=[salon.slug]), payload)
    assert response.status_code == 302
    booking = Booking.objects.get()
    assert booking.reference.startswith("RES-")
    assert booking.status == Booking.Status.PENDING


def test_appointment_requires_service(customer_client, salon, payload):
    payload["service"] = ""
    response = customer_client.post(reverse("bookings:create", args=[salon.slug]), payload)
    assert "service" in response.context["form"].errors


def test_refuses_closed_hours(customer_client, salon, payload):
    payload.update(_next_monday(21))
    response = customer_client.post(reverse("bookings:create", args=[salon.slug]), payload)
    assert "time" in response.context["form"].errors


def test_refuses_past_slot(customer_client, salon, payload):
    payload["date"] = (timezone.localdate() - timedelta(days=1)).isoformat()
    response = customer_client.post(reverse("bookings:create", args=[salon.slug]), payload)
    assert not Booking.objects.exists()
    assert response.status_code == 200


def test_shop_without_bookings_returns_404(customer_client, shop):
    assert customer_client.get(reverse("bookings:create", args=[shop.slug])).status_code == 404


def test_customer_can_cancel(customer_client, salon, payload):
    customer_client.post(reverse("bookings:create", args=[salon.slug]), payload)
    booking = Booking.objects.get()
    customer_client.post(reverse("bookings:cancel", args=[booking.reference]))
    booking.refresh_from_db()
    assert booking.status == Booking.Status.CANCELLED
