from datetime import timedelta

import pytest
from django.utils import timezone

from apps.api.models import ApiToken
from apps.orders.models import Order
from conftest import PASSWORD

API = "/api/v1"


def bearer(user):
    _, key = ApiToken.objects.issue(user, "tests")
    return {"HTTP_AUTHORIZATION": f"Bearer {key}"}


def test_token_lifecycle(client, customer):
    response = client.post(
        f"{API}/auth/token",
        {"username": "677111111", "password": PASSWORD, "name": "app"},
        content_type="application/json",
    )
    assert response.status_code == 201
    key = response.json()["token"]
    assert key.startswith("mm_")
    stored = ApiToken.objects.get()
    assert stored.key_hash != key and key.startswith(stored.prefix)
    headers = {"HTTP_AUTHORIZATION": f"Bearer {key}"}
    assert client.get(f"{API}/me", **headers).json()["phone"] == "+237677111111"
    assert client.delete(f"{API}/auth/token", **headers).status_code == 204
    assert client.get(f"{API}/me", **headers).status_code == 401


def test_token_rejects_bad_credentials(client, customer):
    response = client.post(
        f"{API}/auth/token",
        {"username": "677111111", "password": "x"},
        content_type="application/json",
    )
    assert response.status_code == 401


def test_public_catalog(client, product):
    assert any(t["slug"] == "epicerie" for t in client.get(f"{API}/shop-types").json())
    shops = client.get(f"{API}/shops", {"type": "epicerie"}).json()
    assert shops["count"] == 1 and shops["items"][0]["slug"] == product.shop.slug
    detail = client.get(f"{API}/shops/{product.shop.slug}").json()
    assert len(detail["opening_hours"]) == 7
    products = client.get(f"{API}/shops/{product.shop.slug}/products").json()
    assert products["items"][0]["price"] == 4500
    assert client.get(f"{API}/search", {"q": "riz"}).json()["products"][0]["id"] == product.pk


def test_pending_shop_is_hidden(client, product):
    product.shop.status = "pending"
    product.shop.save()
    assert client.get(f"{API}/shops/{product.shop.slug}").status_code == 404


def test_place_order_reuses_business_rules(client, customer, product):
    headers = bearer(customer)
    payload = {
        "shop": product.shop.slug,
        "items": [{"product_id": product.pk, "quantity": 2}],
        "fulfillment": "pickup",
        "payment_method": "mtn_momo",
    }
    response = client.post(f"{API}/orders", payload, content_type="application/json", **headers)
    assert response.status_code == 201
    data = response.json()
    assert data["total"] == 9000 and len(data["pickup_code"]) == 6
    product.refresh_from_db()
    assert product.stock == 8

    bad = {**payload, "payment_method": "orange_money"}
    response = client.post(f"{API}/orders", bad, content_type="application/json", **headers)
    assert response.status_code == 422 and "payment_method" in response.json()["detail"]

    too_many = {**payload, "items": [{"product_id": product.pk, "quantity": 50}]}
    response = client.post(f"{API}/orders", too_many, content_type="application/json", **headers)
    assert response.status_code == 409


def test_order_requires_token(client, product):
    assert client.get(f"{API}/orders").status_code == 401


def test_customer_cancels_order(client, customer, product):
    headers = bearer(customer)
    order = client.post(
        f"{API}/orders",
        {
            "shop": product.shop.slug,
            "items": [{"product_id": product.pk, "quantity": 1}],
            "fulfillment": "pickup",
            "payment_method": "cash",
        },
        content_type="application/json",
        **headers,
    ).json()
    response = client.post(f"{API}/orders/{order['reference']}/cancel", **headers)
    assert response.json()["status"] == "cancelled"
    response = client.post(f"{API}/orders/{order['reference']}/cancel", **headers)
    assert response.status_code == 409


def test_merchant_order_flow_and_isolation(client, merchant, customer, shop, salon, product):
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
    headers = bearer(merchant)
    base = f"{API}/merchant/shops/{shop.slug}"
    listed = client.get(f"{base}/orders", **headers).json()
    assert listed[0]["reference"] == order.reference and listed[0]["pickup_code"] is None
    for status in ("confirmed", "ready"):
        client.post(
            f"{base}/orders/{order.reference}/status",
            {"status": status},
            content_type="application/json",
            **headers,
        )
    wrong = client.post(
        f"{base}/orders/{order.reference}/status",
        {"status": "completed", "pickup_code": "000000"},
        content_type="application/json",
        **headers,
    )
    assert wrong.status_code == 409
    done = client.post(
        f"{base}/orders/{order.reference}/status",
        {"status": "completed", "pickup_code": order.pickup_code, "paid_with": "cash"},
        content_type="application/json",
        **headers,
    )
    assert done.json()["status"] == "completed"
    assert client.get(f"{API}/merchant/shops/{salon.slug}/orders", **headers).status_code == 404


def test_booking_via_api(client, customer, salon):
    headers = bearer(customer)
    day = timezone.localdate() + timedelta(days=(7 - timezone.localdate().weekday()) or 7)
    payload = {
        "shop": salon.slug,
        "kind": "appointment",
        "service": salon.services.get().pk,
        "date": day.isoformat(),
        "time": "10:00:00",
    }
    response = client.post(f"{API}/bookings", payload, content_type="application/json", **headers)
    assert response.status_code == 201
    late = {**payload, "time": "22:00:00"}
    response = client.post(f"{API}/bookings", late, content_type="application/json", **headers)
    assert response.status_code == 422


def test_openapi_schema_and_docs(client, db):
    schema = client.get(f"{API}/openapi.json").json()
    assert schema["info"]["title"] == "Mfoundi Mall API"
    assert "/api/v1/orders" in schema["paths"]
    assert client.get(f"{API}/docs").status_code == 200


@pytest.mark.parametrize("url", ["/shops", "/shop-types"])
def test_api_responses_are_not_cached_by_service_worker(client, db, url):
    from apps.core.pwa import PRIVATE_PREFIXES

    assert "/api/" in PRIVATE_PREFIXES


def _complete(shop, customer):
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
        paid_with="cash",
        paid_at=timezone.now(),
    )


def test_reviews_via_api(client, customer, merchant, shop):
    url = f"{API}/shops/{shop.slug}/reviews"
    payload = {"rating": 4, "comment": "Rapide"}
    headers = bearer(customer)
    assert client.post(url, payload, content_type="application/json", **headers).status_code == 403
    _complete(shop, customer)
    bad = client.post(url, {"rating": 6}, content_type="application/json", **headers)
    assert bad.status_code == 422
    created = client.post(url, payload, content_type="application/json", **headers)
    assert created.status_code == 201 and created.json()["author"] == "Awa"
    review_id = created.json()["id"]
    assert client.get(url).json()["items"][0]["rating"] == 4
    assert client.get(f"{API}/shops/{shop.slug}").json()["reviews_count"] == 1
    reply = client.post(
        f"{API}/merchant/shops/{shop.slug}/reviews/{review_id}/reply",
        {"reply": "Merci"},
        content_type="application/json",
        **bearer(merchant),
    )
    assert reply.json()["reply"] == "Merci"
    notifications = client.get(f"{API}/notifications", **headers).json()
    assert notifications["items"][0]["kind"] == "reply"
    assert client.post(f"{API}/notifications/read", **headers).status_code == 204


def test_favorites_via_api(client, customer, product):
    headers = bearer(customer)
    shop_url = f"{API}/favorites/shops/{product.shop.slug}"
    assert client.put(shop_url, **headers).status_code == 204
    assert client.put(shop_url, **headers).status_code == 204
    assert client.put(f"{API}/favorites/products/{product.pk}", **headers).status_code == 204
    data = client.get(f"{API}/favorites", **headers).json()
    assert [s["slug"] for s in data["shops"]] == [product.shop.slug]
    assert [p["id"] for p in data["products"]] == [product.pk]
    assert client.delete(shop_url, **headers).status_code == 204
    assert client.get(f"{API}/favorites", **headers).json()["shops"] == []
    assert client.put(f"{API}/favorites/products/999", **headers).status_code == 404


def test_merchant_stats_via_api(client, merchant, customer, shop):
    _complete(shop, customer)
    url = f"{API}/merchant/shops/{shop.slug}/stats"
    data = client.get(url, {"days": 7}, **bearer(merchant)).json()
    assert data["revenue"] == 4500 and len(data["series"]) == 7
    assert data["payments"][0]["paid_with"] == "cash"
    assert client.get(url, {"days": 12}, **bearer(merchant)).status_code == 422
    assert client.get(url, **bearer(customer)).status_code == 404
