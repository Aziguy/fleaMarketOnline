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
