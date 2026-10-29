import pytest
from django.urls import reverse

from apps.notifications.models import Notification
from apps.orders.models import Order

from .models import Review


def _completed_order(shop, customer):
    return Order.objects.create(
        shop=shop,
        customer=customer,
        fulfillment="pickup",
        payment_method="cash",
        contact_name="Awa",
        contact_phone="677111111",
        subtotal=4500,
        total=4500,
        status=Order.Status.COMPLETED,
    )


def test_review_requires_completed_order(customer_client, shop):
    url = reverse("reviews:submit", args=[shop.slug])
    customer_client.post(url, {"rating": 5})
    assert not Review.objects.exists()
    assert "Donner mon avis" not in customer_client.get(shop.get_absolute_url()).content.decode()


def test_verified_customer_reviews_and_merchant_is_notified(customer_client, customer, shop):
    _completed_order(shop, customer)
    page = customer_client.get(shop.get_absolute_url()).content.decode()
    assert "Donner mon avis" in page
    customer_client.post(
        reverse("reviews:submit", args=[shop.slug]), {"rating": 4, "comment": "Très bon accueil"}
    )
    customer_client.post(reverse("reviews:submit", args=[shop.slug]), {"rating": 5})
    review = Review.objects.get()
    assert review.rating == 5 and review.comment == ""
    assert Notification.objects.filter(user=shop.owner, kind="review").count() == 1
    page = customer_client.get(shop.get_absolute_url()).content.decode()
    assert "Client vérifié" in page and "Modifier mon avis" in page


def test_invalid_rating_rejected(customer_client, customer, shop):
    _completed_order(shop, customer)
    response = customer_client.post(
        reverse("reviews:submit", args=[shop.slug]), {"rating": 9}, HTTP_HX_REQUEST="true"
    )
    assert response.context["review_form"].errors
    assert not Review.objects.exists()


def test_owner_cannot_review_own_shop(merchant_client, merchant, shop):
    _completed_order(shop, merchant)
    merchant_client.post(reverse("reviews:submit", args=[shop.slug]), {"rating": 5})
    assert not Review.objects.exists()


@pytest.mark.django_db
def test_hidden_reviews_excluded_from_rating(shop, customer):
    from apps.shops.models import Shop

    Review.objects.create(shop=shop, customer=customer, rating=1, is_published=False)
    rated = Shop.objects.with_rating().get(pk=shop.pk)
    assert rated.rating_count == 0 and rated.rating_avg is None


def test_merchant_reply_notifies_customer(merchant_client, shop, customer):
    review = Review.objects.create(shop=shop, customer=customer, rating=4)
    merchant_client.post(reverse("dashboard:review_reply", args=[review.pk]), {"reply": "Merci !"})
    merchant_client.post(
        reverse("dashboard:review_reply", args=[review.pk]), {"reply": "Merci Awa"}
    )
    review.refresh_from_db()
    assert review.reply == "Merci Awa" and review.replied_at
    assert Notification.objects.filter(user=customer, kind="reply").count() == 1
    assert "Merci Awa" in merchant_client.get(reverse("dashboard:reviews")).content.decode()


def test_merchant_cannot_reply_to_other_shop(merchant_client, salon, customer):
    review = Review.objects.create(shop=salon, customer=customer, rating=4)
    response = merchant_client.post(
        reverse("dashboard:review_reply", args=[review.pk]), {"reply": "x"}
    )
    assert response.status_code == 404
