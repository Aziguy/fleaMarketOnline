import pytest
from django.core.exceptions import ValidationError

from apps.core.money import format_fcfa
from apps.core.phone import format_phone, normalize_phone, whatsapp_url


@pytest.mark.parametrize(
    "raw",
    ["677123456", "6 77 12 34 56", "+237 677 12 34 56", "00237677123456", "237677123456"],
)
def test_normalize_phone_accepts_common_formats(raw):
    assert normalize_phone(raw) == "+237677123456"


@pytest.mark.parametrize("raw", ["", "12345", "577123456", "+33612345678"])
def test_normalize_phone_rejects_invalid(raw):
    with pytest.raises(ValidationError):
        normalize_phone(raw)


def test_format_phone():
    assert format_phone("+237677123456") == "+237 6 77 12 34 56"


def test_whatsapp_url_encodes_text():
    assert whatsapp_url("+237677123456", "Bonjour à tous") == (
        "https://wa.me/237677123456?text=Bonjour%20%C3%A0%20tous"
    )


def test_format_fcfa():
    assert format_fcfa(125000) == "125 000 FCFA"
    assert format_fcfa(None) == ""


def test_home_and_search(client, product):
    assert client.get("/").status_code == 200
    response = client.get("/recherche/", {"q": "riz"})
    assert product in response.context["result"].products


def test_search_hides_pending_shops(client, product):
    product.shop.status = "pending"
    product.shop.save()
    response = client.get("/recherche/", {"q": "riz"})
    assert response.context["result"].products == []


def test_english_translation(client, db):
    client.cookies["django_language"] = "en"
    content = client.get("/").content.decode()
    assert "Every shop in the mall," in content


def test_search_catalog_matches_terms_and_shop_type(product):
    from apps.core.search import search_catalog

    assert search_catalog("x").products == []
    assert product in search_catalog("inconnu", terms=["riz", "huile"]).products
    assert product.shop in search_catalog("Grocery").shops


def test_palette_shortcuts_and_results(client, product):
    empty = client.get("/recherche/palette/", HTTP_HX_REQUEST="true").content.decode()
    assert "Toutes les boutiques" in empty
    found = client.get("/recherche/palette/", {"q": "riz"}, HTTP_HX_REQUEST="true").content.decode()
    assert product.get_absolute_url() in found
    missing = client.get("/recherche/palette/", {"q": "zzzz"}).content.decode()
    assert "Aucun résultat" in missing


def test_manifest_is_valid(client, db):
    response = client.get("/manifest.webmanifest")
    assert response["Content-Type"] == "application/manifest+json"
    data = response.json()
    assert data["display"] == "standalone"
    assert any(icon.get("purpose") == "maskable" for icon in data["icons"])


def test_service_worker_scope_and_private_prefixes(client, db):
    response = client.get("/sw.js")
    assert response["Content-Type"].startswith("application/javascript")
    assert response["Service-Worker-Allowed"] == "/"
    body = response.content.decode()
    assert '"/espace-boutique/"' in body and "/hors-ligne/" in body


def test_offline_page(client, db):
    assert client.get("/hors-ligne/").status_code == 200


def test_authenticated_pages_are_private(client, customer):
    assert "private" not in client.get("/").get("Cache-Control", "")
    client.force_login(customer)
    assert "private" in client.get("/")["Cache-Control"]


def test_healthz(client, db):
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json()["checks"] == {"database": "ok", "cache": "ok"}


def test_request_id_is_generated_and_propagated(client, db):
    generated = client.get("/healthz")["X-Request-ID"]
    assert len(generated) == 32
    assert client.get("/healthz", HTTP_X_REQUEST_ID="abc-123")["X-Request-ID"] == "abc-123"
    assert client.get("/healthz", HTTP_X_REQUEST_ID="bad id!")["X-Request-ID"] != "bad id!"


def test_json_formatter_includes_request_id():
    import json
    import logging

    from apps.core.observability import JsonFormatter

    record = logging.LogRecord("x", logging.INFO, __file__, 1, "bonjour %s", ("mall",), None)
    record.request_id = "r1"
    data = json.loads(JsonFormatter().format(record))
    assert data["message"] == "bonjour mall" and data["request_id"] == "r1"


@pytest.mark.parametrize("url", ["/", "/boutiques/", "/recherche/?q=riz"])
def test_public_pages_query_count_is_bounded(client, product, django_assert_max_num_queries, url):
    from apps.catalog.models import Product

    for i in range(15):
        Product.objects.create(shop=product.shop, name=f"Article {i}", price=100, stock=3)
    with django_assert_max_num_queries(8):
        client.get(url)


def test_healthcheck_command(db, capsys):
    from django.core.management import call_command

    call_command("healthcheck")
    assert '"database": "ok"' in capsys.readouterr().out


def test_icon_tag_renders_lucide_and_brand():
    from django.template import Context, Template

    html = Template(
        '{% icon "search" class="h-4 w-4" %}{% icon "whatsapp" label="WhatsApp" %}'
    ).render(Context())
    assert 'class="h-4 w-4"' in html and 'stroke="currentColor"' in html
    assert 'fill="currentColor" role="img" aria-label="WhatsApp"' in html


def test_icon_tag_falls_back_on_unknown_name():
    from apps.core.templatetags.mall import icon

    assert icon("inconnue") == icon("store")


@pytest.mark.django_db
def test_shop_types_use_bundled_icons():
    from apps.core.templatetags.mall import ICONS
    from apps.shops.models import ShopType

    assert set(ShopType.objects.values_list("icon", flat=True)) <= set(ICONS["lucide"])
