from types import SimpleNamespace
from unittest import mock

import anthropic
import httpx2
import pytest
from django.urls import reverse

from apps.ai import services as ai
from apps.catalog.models import Product


def reply(text, stop_reason="end_turn"):
    return SimpleNamespace(
        content=[SimpleNamespace(type="text", text=text)],
        stop_reason=stop_reason,
        stop_details=SimpleNamespace(category="cyber") if stop_reason == "refusal" else None,
        _request_id="req_test",
    )


@pytest.fixture
def claude(settings):
    settings.ANTHROPIC_API_KEY = "sk-test"
    ai._client.cache_clear()
    client = mock.MagicMock()
    with mock.patch.object(ai, "_client", return_value=client):
        yield client.beta.messages.create
    ai._client.cache_clear()


def test_disabled_without_key(settings):
    settings.ANTHROPIC_API_KEY = ""
    assert not ai.is_enabled()
    with pytest.raises(ai.AIUnavailable):
        ai.describe_product(name="Riz")


def test_describe_product_sends_structured_request(claude):
    claude.return_value = reply('{"description": "Un riz parfumé, idéal au quotidien."}')
    text = ai.describe_product(name="Riz 5 kg", shop_type="Épicerie", price=4500)
    assert text == "Un riz parfumé, idéal au quotidien."
    kwargs = claude.call_args.kwargs
    assert kwargs["model"] == "claude-opus-5-5"
    assert kwargs["output_config"]["format"]["type"] == "json_schema"
    assert kwargs["output_config"]["format"]["schema"]["additionalProperties"] is False
    assert kwargs["fallbacks"] == "default" and ai.FALLBACK_BETA in kwargs["betas"]
    assert "4500 FCFA" in kwargs["messages"][0]["content"][-1]["text"]


@pytest.mark.parametrize(
    "outcome",
    [
        reply("", stop_reason="refusal"),
        reply("pas du json"),
        reply('{"autre": 1}'),
    ],
)
def test_unusable_replies_raise(claude, outcome):
    claude.return_value = outcome
    with pytest.raises(ai.AIUnavailable):
        ai.describe_product(name="Riz")


def test_api_errors_raise(claude):
    request = httpx2.Request("POST", "https://api.anthropic.com/v1/messages")
    claude.side_effect = anthropic.APIConnectionError(request=request)
    with pytest.raises(ai.AIUnavailable):
        ai.describe_product(name="Riz")


def test_expand_search_cleans_and_caches(claude):
    claude.return_value = reply('{"terms": ["Riz", "rice", "rice", "céréale", "x"]}')
    assert ai.expand_search("riz") == ["rice", "céréale"]
    assert ai.expand_search("RIZ ") == ["rice", "céréale"]
    assert claude.call_count == 1


def test_smart_search_expands_when_few_results(client, claude, product):
    Product.objects.create(shop=product.shop, name="Long grain rice", price=3000)
    claude.return_value = reply('{"terms": ["rice"]}')
    result = client.get("/recherche/", {"q": "basmati"}).context["result"]
    assert result.expanded_terms == ["rice"]
    assert [p.name for p in result.products] == ["Long grain rice"]


def test_smart_search_skipped_when_enough_results(client, claude, product):
    for i in range(3):
        Product.objects.create(shop=product.shop, name=f"Riz {i}", price=1000)
    client.get("/recherche/", {"q": "riz"})
    assert claude.call_count == 0


def test_dashboard_ai_description(merchant_client, claude, shop):
    claude.return_value = reply('{"description": "Texte proposé."}')
    url = reverse("dashboard:ai_description")
    response = merchant_client.post(
        url, {"name": "Huile 1 L", "price": "1500"}, HTTP_HX_REQUEST="true"
    )
    assert "Texte proposé." in response.content.decode()
    missing = merchant_client.post(url, {"name": ""}, HTTP_HX_REQUEST="true")
    assert "nom du produit" in missing.content.decode()


def test_dashboard_ai_description_quota(merchant_client, claude, settings):
    settings.AI_DESCRIPTIONS_PER_HOUR = 1
    claude.return_value = reply('{"description": "Texte."}')
    url = reverse("dashboard:ai_description")
    merchant_client.post(url, {"name": "Huile"})
    assert "Limite atteinte" in merchant_client.post(url, {"name": "Huile"}).content.decode()


def test_ai_button_hidden_when_disabled(merchant_client, settings):
    settings.ANTHROPIC_API_KEY = ""
    page = merchant_client.get(reverse("dashboard:product_create")).content.decode()
    assert "dashboard/produits/ia/description" not in page
