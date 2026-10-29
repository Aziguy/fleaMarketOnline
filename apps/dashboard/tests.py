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
        with django_assert_max_num_queries(15):
            merchant_client.get(reverse(f"dashboard:{name}"))


def _png(width, height, name="photo.png"):
    from io import BytesIO

    from django.core.files.uploadedfile import SimpleUploadedFile
    from PIL import Image

    buffer = BytesIO()
    Image.new("RGB", (width, height), "green").save(buffer, "PNG")
    return SimpleUploadedFile(name, buffer.getvalue(), content_type="image/png")


def _settings_data(shop, **extra):
    return {
        "name": shop.name,
        "level": "rdc",
        "phone": "677000000",
        "accepts_cash": "on",
        "offers_pickup": "on",
        "delivery_fee": 0,
        **extra,
    }


def test_settings_optimize_logo_and_banner(merchant_client, shop):
    from PIL import Image

    response = merchant_client.post(
        reverse("dashboard:settings"),
        _settings_data(shop, logo=_png(800, 600), banner=_png(2400, 1200)),
    )
    assert response.status_code == 302
    shop.refresh_from_db()
    assert shop.logo.name.endswith(".webp") and shop.banner.name.startswith("shops/banners/")
    assert Image.open(shop.logo).size == (512, 512)
    assert Image.open(shop.banner).size == (1800, 600)


def test_settings_reject_small_banner(merchant_client, shop):
    response = merchant_client.post(
        reverse("dashboard:settings"), _settings_data(shop, banner=_png(400, 200))
    )
    assert "banner" in response.context["form"].errors
    shop.refresh_from_db()
    assert not shop.banner


def test_settings_replace_and_clear_delete_files(
    merchant_client, shop, django_capture_on_commit_callbacks
):
    url = reverse("dashboard:settings")
    merchant_client.post(url, _settings_data(shop, banner=_png(1800, 600)))
    shop.refresh_from_db()
    first = shop.banner.name
    with django_capture_on_commit_callbacks(execute=True):
        merchant_client.post(url, _settings_data(shop, banner=_png(1800, 600)))
    shop.refresh_from_db()
    assert shop.banner.name != first and not shop.banner.storage.exists(first)
    second = shop.banner.name
    with django_capture_on_commit_callbacks(execute=True):
        merchant_client.post(url, _settings_data(shop, **{"banner-clear": "on"}))
    shop.refresh_from_db()
    assert not shop.banner and not shop.banner.storage.exists(second)


def _paid_order(shop, customer, total, paid_at, **extra):
    from apps.orders.models import OrderItem

    order = Order.objects.create(
        shop=shop,
        customer=customer,
        fulfillment="pickup",
        payment_method="mtn_momo",
        contact_name=extra.pop("contact_name", "Awa"),
        contact_phone="677111111",
        subtotal=total,
        total=total,
        status=Order.Status.COMPLETED,
        paid_with="mtn_momo",
        paid_at=paid_at,
        **extra,
    )
    OrderItem.objects.create(order=order, product_name="Riz 5 kg", unit_price=total, quantity=1)
    return order


def test_statistics(merchant_client, shop, customer):
    from datetime import timedelta

    from django.utils import timezone

    now = timezone.now()
    _paid_order(shop, customer, 4500, now)
    _paid_order(shop, customer, 5500, now - timedelta(days=2))
    _paid_order(shop, customer, 2000, now - timedelta(days=40))
    response = merchant_client.get(reverse("dashboard:statistics"), {"periode": "30"})
    stats = response.context["stats"]
    assert stats["revenue"] == 10000 and stats["orders"] == 2 and stats["basket"] == 5000
    assert stats["trend"] == 400
    assert stats["payments"][0]["percent"] == 100
    assert stats["top_products"][0]["sold"] == 2
    assert len(stats["series"]) == 30 and stats["series"][-3].height == 100
    assert (
        merchant_client.get(reverse("dashboard:statistics"), {"periode": "999"}).context["stats"][
            "days"
        ]
        == 30
    )


def test_orders_export_csv(merchant_client, shop, customer):
    from django.utils import timezone

    _paid_order(shop, customer, 4500, timezone.now(), contact_name="=HYPERLINK(1)")
    response = merchant_client.get(reverse("dashboard:orders_export"))
    content = b"".join(response.streaming_content).decode()
    assert response["Content-Type"].startswith("text/csv")
    assert content.startswith("﻿Référence;")
    assert "'=HYPERLINK(1)" in content and "1 x Riz 5 kg" in content and ";4500\r\n" in content
    assert "attachment" in response["Content-Disposition"]


def test_poster_and_qr_downloads(merchant_client, shop):
    page = merchant_client.get(reverse("dashboard:poster")).content.decode()
    assert shop.name in page and "<svg" in page and shop.get_absolute_url() in page
    png = merchant_client.get(reverse("dashboard:poster_qr_png"))
    assert png["Content-Type"] == "image/png" and png.content[:4] == b"\x89PNG"
    svg = merchant_client.get(reverse("dashboard:poster_qr_svg"))
    assert svg["Content-Type"] == "image/svg+xml" and b"<svg" in svg.content
