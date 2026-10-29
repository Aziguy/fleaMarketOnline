from django.urls import reverse

from apps.bookings.models import Booking
from apps.catalog.models import Product
from apps.orders.models import Order


def test_dashboard_redirects_non_merchant(customer_client):
    response = customer_client.get(reverse("dashboard:home"))
    assert response.url == reverse("shops:open")


def test_dashboard_pages(merchant_client, product):
    for name in [
        "home",
        "settings",
        "hours",
        "categories",
        "products",
        "product_create",
        "services",
        "service_create",
        "orders",
        "bookings",
    ]:
        assert merchant_client.get(reverse(f"dashboard:{name}")).status_code == 200, name


def test_create_product(merchant_client, shop):
    response = merchant_client.post(
        reverse("dashboard:product_create"),
        {
            "name": "Huile 1 L",
            "price": 1500,
            "compare_at_price": "",
            "stock": 12,
            "is_active": "on",
            "images-TOTAL_FORMS": 0,
            "images-INITIAL_FORMS": 0,
            "images-MIN_NUM_FORMS": 0,
            "images-MAX_NUM_FORMS": 4,
        },
    )
    assert response.status_code == 302
    assert shop.products.get().name == "Huile 1 L"


def test_cannot_edit_other_shop_product(merchant_client, salon):
    other = Product.objects.create(shop=salon, name="Karité", price=3500)
    response = merchant_client.get(reverse("dashboard:product_edit", args=[other.pk]))
    assert response.status_code == 404


def test_settings_require_payment_method(merchant_client, shop):
    response = merchant_client.post(
        reverse("dashboard:settings"),
        {
            "name": shop.name,
            "level": "rdc",
            "phone": "677000000",
            "offers_pickup": "on",
            "delivery_fee": 0,
        },
    )
    assert response.context["form"].non_field_errors()


def test_order_actions(merchant_client, shop, customer, product):
    order = Order.objects.create(
        shop=shop,
        customer=customer,
        fulfillment="pickup",
        payment_method="cash",
        contact_name="Awa",
        contact_phone="677111111",
        subtotal=4500,
        total=4500,
    )
    url = reverse("dashboard:order_action", args=[order.reference])
    merchant_client.post(url, {"status": "confirmed"})
    merchant_client.post(url, {"status": "ready"})
    response = merchant_client.post(
        url,
        {"status": "completed", "pickup_code": "bad", "paid_with": "cash"},
        HTTP_HX_REQUEST="true",
    )
    order.refresh_from_db()
    assert order.status == Order.Status.READY
    assert "Code de retrait incorrect" in response.content.decode()
    merchant_client.post(
        url, {"status": "completed", "pickup_code": order.pickup_code, "paid_with": "cash"}
    )
    order.refresh_from_db()
    assert order.status == Order.Status.COMPLETED


def test_booking_action(client, salon, customer):
    booking = Booking.objects.create(
        shop=salon,
        customer=customer,
        kind="appointment",
        service=salon.services.get(),
        date="2030-01-07",
        time="10:00",
        contact_phone="677111111",
    )
    client.force_login(salon.owner)
    client.post(
        reverse("dashboard:booking_action", args=[booking.reference]),
        {"status": "confirmed", "merchant_note": "À lundi"},
    )
    booking.refresh_from_db()
    assert booking.status == Booking.Status.CONFIRMED
    assert booking.merchant_note == "À lundi"


def test_merchant_can_manage_several_shops(merchant_client, merchant, shop):
    from conftest import make_shop

    second = make_shop(merchant, "restaurant", name="Resto Paul")
    assert merchant_client.get(reverse("dashboard:home")).wsgi_request.shop == shop
    merchant_client.post(reverse("dashboard:switch_shop"), {"shop": second.pk})
    response = merchant_client.get(reverse("dashboard:products"))
    assert response.wsgi_request.shop == second
    assert len(response.wsgi_request.shops) == 2


def test_cannot_switch_to_other_merchant_shop(merchant_client, salon):
    response = merchant_client.post(reverse("dashboard:switch_shop"), {"shop": salon.pk})
    assert response.status_code == 404


def test_dashboard_query_count_is_bounded(
    merchant_client, shop, customer, product, django_assert_max_num_queries
):
    for _ in range(10):
        Order.objects.create(
            shop=shop,
            customer=customer,
            fulfillment="pickup",
            payment_method="cash",
            contact_name="Awa",
            contact_phone="677111111",
            subtotal=100,
            total=100,
        )
    for name in ["home", "orders", "products"]:
        with django_assert_max_num_queries(14):
            merchant_client.get(reverse(f"dashboard:{name}"))
