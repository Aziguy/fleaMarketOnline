import pytest
from django.urls import reverse

from apps.bookings.models import Booking
from apps.dashboard.realtime import Cursor, collect
from apps.orders.models import Order


def _order(shop, customer):
    return Order.objects.create(
        shop=shop,
        customer=customer,
        fulfillment="pickup",
        payment_method="cash",
        contact_name="Awa",
        contact_phone="677111111",
        subtotal=4500,
        total=4500,
    )


def test_cursor_roundtrip():
    assert Cursor.parse("12:3") == Cursor(12, 3)
    assert str(Cursor(12, 3)) == "12:3"
    assert Cursor.parse("nope") is None and Cursor.parse(None) is None


def test_collect_returns_only_new_events_with_their_cursor(shop, customer):
    first = _order(shop, customer)
    start = Cursor.latest(shop.pk)
    assert start.order == first.pk
    second = _order(shop, customer)
    events, cursor = collect(shop.pk, start)
    assert [e["reference"] for e, _ in events] == [second.reference]
    assert events[0][1] == Cursor(second.pk, start.booking) == cursor
    assert collect(shop.pk, cursor)[0] == []


def test_collect_bookings(salon, customer):
    booking = Booking.objects.create(
        shop=salon,
        customer=customer,
        kind="appointment",
        service=salon.services.get(),
        date="2030-01-07",
        time="10:00",
        contact_phone="677111111",
    )
    events, _ = collect(salon.pk, Cursor())
    assert events[0][0]["type"] == "booking" and events[0][0]["reference"] == booking.reference


def test_stream_requires_merchant(client, customer):
    assert client.get(reverse("dashboard:events")).status_code == 401
    client.force_login(customer)
    assert client.get(reverse("dashboard:events")).status_code == 403


def test_stream_sends_new_order_after_last_event_id(merchant_client, shop, customer):
    old = _order(shop, customer)
    new = _order(shop, customer)
    response = merchant_client.get(reverse("dashboard:events"), HTTP_LAST_EVENT_ID=f"{old.pk}:0")
    assert response["Content-Type"] == "text/event-stream"
    body = b"".join(response.streaming_content).decode()
    assert body.startswith("retry:")
    assert f"id: {new.pk}:0\nevent: order\n" in body
    assert old.reference not in body


@pytest.mark.django_db(transaction=True)
def test_async_stream(merchant, shop, customer):
    from asgiref.sync import async_to_sync
    from django.test import AsyncClient

    order = _order(shop, customer)

    async def run():
        client = AsyncClient()
        await client.aforce_login(merchant)
        response = await client.get(reverse("dashboard:events"), headers={"Last-Event-ID": "0:0"})
        return b"".join([chunk async for chunk in response.streaming_content]).decode()

    assert order.reference in async_to_sync(run)()
