from apps.catalog.models import Product


def test_slug_is_unique_per_shop(shop):
    a = Product.objects.create(shop=shop, name="Savon", price=500)
    b = Product.objects.create(shop=shop, name="Savon", price=600)
    assert (a.slug, b.slug) == ("savon", "savon-2")


def test_discount_percent(product):
    product.compare_at_price = 6000
    assert product.discount_percent == 25


def test_untracked_stock_is_always_available(product):
    product.stock = None
    assert product.in_stock
    assert product.max_quantity() == 50


def test_product_page(client, product):
    response = client.get(product.get_absolute_url())
    assert response.status_code == 200
    assert "4 500" in response.content.decode()


def test_inactive_product_is_hidden(client, product):
    product.is_active = False
    product.save()
    assert client.get(product.get_absolute_url()).status_code == 404
