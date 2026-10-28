import pytest
from django.core import mail
from django.urls import reverse

from apps.orders.models import Order
from apps.orders.services import OrderError, cancel_by_customer, change_status

CHECKOUT = {
    "fulfillment": "pickup",
    "payment_method": "mtn_momo",
    "contact_name": "Awa",
    "contact_phone": "677111111",
}


@pytest.fixture
def order(customer_client, product):
    customer_client.post(reverse("cart:add", args=[product.pk]), {"quantity": 3})
    customer_client.post(reverse("orders:checkout", args=[product.shop.slug]), CHECKOUT)
    return Order.objects.get()


def test_checkout_requires_login(client, product):
    client.post(reverse("cart:add", args=[product.pk]))
    response = client.get(reverse("orders:checkout", args=[product.shop.slug]))
    assert response.status_code == 302
    assert "/compte/connexion/" in response["Location"]


def test_place_order_snapshots_and_decrements_stock(order, product, client):
    product.refresh_from_db()
    assert product.stock == 7
    assert order.total == 3 * 4500
    assert order.items.get().product_name == "Riz 5 kg"
    assert len(order.pickup_code) == 6
    assert order.reference.startswith("CMD-")


def test_cart_is_emptied_for_that_shop(order, customer_client):
    response = customer_client.get(reverse("cart:detail"))
    assert response.context["groups"] == []


def test_delivery_adds_fee_and_requires_address(customer_client, product):
    customer_client.post(reverse("cart:add", args=[product.pk]))
    url = reverse("orders:checkout", args=[product.shop.slug])
    response = customer_client.post(url, {**CHECKOUT, "fulfillment": "delivery"})
    assert "delivery_address" in response.context["form"].errors
    customer_client.post(url, {**CHECKOUT, "fulfillment": "delivery", "delivery_address": "Bastos"})
    assert Order.objects.get().total == 4500 + 1000


def test_payment_method_must_be_accepted_by_shop(customer_client, product):
    customer_client.post(reverse("cart:add", args=[product.pk]))
    url = reverse("orders:checkout", args=[product.shop.slug])
    response = customer_client.post(url, {**CHECKOUT, "payment_method": "orange_money"})
    assert "payment_method" in response.context["form"].errors


def test_insufficient_stock_is_refused(customer_client, product):
    customer_client.post(reverse("cart:add", args=[product.pk]), {"quantity": 5})
    product.stock = 2
    product.save()
    customer_client.post(reverse("orders:checkout", args=[product.shop.slug]), CHECKOUT)
    assert not Order.objects.exists()


def test_shop_is_notified_by_email(
    shop, customer_client, product, django_capture_on_commit_callbacks
):
    shop.email = "boutique@example.cm"
    shop.save()
    customer_client.post(reverse("cart:add", args=[product.pk]))
    with django_capture_on_commit_callbacks(execute=True):
        customer_client.post(reverse("orders:checkout", args=[shop.slug]), CHECKOUT)
    assert mail.outbox[0].to == ["boutique@example.cm"]


def test_pickup_flow_requires_code(order):
    change_status(order, Order.Status.CONFIRMED)
    change_status(order, Order.Status.READY)
    with pytest.raises(OrderError):
        change_status(order, Order.Status.COMPLETED, pickup_code="000000x")
    change_status(order, Order.Status.COMPLETED, pickup_code=order.pickup_code, paid_with="cash")
    assert order.paid_with == "cash" and order.paid_at


def test_invalid_transition(order):
    with pytest.raises(OrderError):
        change_status(order, Order.Status.COMPLETED)


def test_cancel_restocks(order, product):
    cancel_by_customer(order)
    product.refresh_from_db()
    assert product.stock == 10
    assert order.status == Order.Status.CANCELLED


def test_customer_cannot_cancel_ready_order(order):
    change_status(order, Order.Status.CONFIRMED)
    change_status(order, Order.Status.READY)
    with pytest.raises(OrderError):
        cancel_by_customer(order)


def test_other_customer_cannot_see_order(order, client, merchant):
    client.force_login(merchant)
    assert client.get(order.get_absolute_url()).status_code == 404
