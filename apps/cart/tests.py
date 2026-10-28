from django.urls import reverse

from apps.cart.cart import Cart
from apps.catalog.models import Product


def test_add_and_group_by_shop(client, product, salon):
    other = Product.objects.create(shop=salon, name="Karité", price=3500)
    client.post(reverse("cart:add", args=[product.pk]), {"quantity": 2})
    client.post(reverse("cart:add", args=[other.pk]))
    cart = Cart(client.session)
    assert len(cart) == 3
    assert cart.total == 2 * 4500 + 3500
    assert {g.shop for g in cart.groups()} == {product.shop, salon}


def test_quantity_is_capped_by_stock(client, product):
    client.post(reverse("cart:add", args=[product.pk]), {"quantity": 99})
    assert Cart(client.session).quantity_of(product) == 10


def test_update_to_zero_removes_line(client, product):
    client.post(reverse("cart:add", args=[product.pk]))
    client.post(reverse("cart:update", args=[product.pk]), {"quantity": 0})
    assert len(Cart(client.session)) == 0


def test_htmx_add_returns_counter_and_toast(client, product):
    response = client.post(reverse("cart:add", args=[product.pk]), HTTP_HX_REQUEST="true")
    assert 'id="cart-counter"' in response.content.decode()
    assert "toast" in response["HX-Trigger"]


def test_whatsapp_message(client, product):
    client.post(reverse("cart:add", args=[product.pk]), {"quantity": 2})
    group = Cart(client.session).groups()[0]
    assert "2 x Riz 5 kg" in group.whatsapp_message()
    assert group.whatsapp_url.startswith("https://wa.me/237677000000?text=")


def test_add_ignores_external_next(client, product):
    response = client.post(reverse("cart:add", args=[product.pk]), {"next": "https://evil.example"})
    assert response.url == reverse("cart:detail")
