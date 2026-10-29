from django.urls import reverse

from apps.notifications.models import Notification

from .models import Favorite


def test_toggle_product_favorite_htmx(customer_client, customer, product):
    url = reverse("favorites:toggle_product", args=[product.pk])
    response = customer_client.post(url, HTTP_HX_REQUEST="true")
    assert 'aria-pressed="true"' in response.content.decode()
    assert Favorite.objects.filter(user=customer, product=product).exists()
    response = customer_client.post(url, HTTP_HX_REQUEST="true")
    assert 'aria-pressed="false"' in response.content.decode()
    assert not Favorite.objects.exists()


def test_toggle_shop_redirects_to_safe_next(customer_client, shop):
    url = reverse("favorites:toggle_shop", args=[shop.pk])
    response = customer_client.post(url, {"next": "https://evil.example/"})
    assert response.url == reverse("favorites:list")
    assert shop.name in customer_client.get(reverse("favorites:list")).content.decode()


def test_anonymous_toggle_goes_to_login(client, product):
    url = reverse("favorites:toggle_product", args=[product.pk])
    response = client.post(url, HTTP_HX_REQUEST="true")
    assert response.headers["HX-Redirect"].startswith(reverse("accounts:login"))


def test_restock_notifies_followers_once(customer, product, django_capture_on_commit_callbacks):
    Favorite.objects.create(user=customer, product=product)
    product.stock = 0
    product.save()
    with django_capture_on_commit_callbacks(execute=True):
        product.stock = 4
        product.save()
        product.stock = 6
        product.save()
    notification = Notification.objects.get(user=customer)
    assert notification.kind == "restock" and product.name in notification.title


def test_notification_list_marks_read(customer_client, customer):
    Notification.objects.create(user=customer, kind="restock", title="Riz disponible")
    page = customer_client.get(reverse("notifications:list")).content.decode()
    assert "Riz disponible" in page
    assert not customer.notifications.filter(read_at__isnull=True).exists()
