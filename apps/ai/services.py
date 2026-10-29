"""Assistant IA (API Claude) : descriptions produits et recherche élargie.

Désactivé sans clé `ANTHROPIC_API_KEY` : toutes les fonctions le signalent par
`AIUnavailable` et l'interface masque les boutons correspondants.
"""

import base64
import hashlib
import json
import logging
from functools import cache

import anthropic
from django.conf import settings
from django.core.cache import cache as django_cache
from pydantic import BaseModel, Field, ValidationError

logger = logging.getLogger(__name__)

FALLBACK_BETA = "server-side-fallback-2026-07-01"
IMAGE_TYPES = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}
MAX_IMAGE_BYTES = 4 * 1024 * 1024
SEARCH_CACHE_SECONDS = 24 * 3600


class AIUnavailable(Exception):
    """L'assistant est désactivé, a refusé, ou l'API ne répond pas."""


class ProductCopy(BaseModel):
    description: str = Field(description="Description commerciale en français, 2 à 4 phrases")


class SearchTerms(BaseModel):
    terms: list[str] = Field(description="Mots-clés de recherche, du plus au moins pertinent")


def is_enabled():
    return bool(settings.AI_ENABLED and settings.ANTHROPIC_API_KEY)


@cache
def _client():
    return anthropic.Anthropic(
        api_key=settings.ANTHROPIC_API_KEY,
        timeout=settings.AI_TIMEOUT_SECONDS,
        max_retries=settings.AI_MAX_RETRIES,
    )


def _schema(model):
    """Schéma JSON strict (sans titres) pour `output_config.format`."""
    schema = model.model_json_schema()
    schema.pop("title", None)
    for prop in schema["properties"].values():
        prop.pop("title", None)
    schema["additionalProperties"] = False
    return schema


def _ask(*, system, content, output, max_tokens):
    """Un appel Claude dont la réponse est validée par le modèle Pydantic `output`."""
    if not is_enabled():
        raise AIUnavailable("assistant désactivé")
    try:
        response = _client().beta.messages.create(
            model=settings.AI_MODEL,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": content}],
            output_config={
                "effort": "low",
                "format": {"type": "json_schema", "schema": _schema(output)},
            },
            betas=[FALLBACK_BETA],
            fallbacks="default",
        )
    except anthropic.RateLimitError as exc:
        logger.warning("Claude : limite de débit atteinte (%s)", exc.request_id)
        raise AIUnavailable("limite de débit") from exc
    except anthropic.APIStatusError as exc:
        logger.error("Claude : erreur %s (%s)", exc.status_code, exc.request_id)
        raise AIUnavailable("erreur API") from exc
    except anthropic.APIConnectionError as exc:
        logger.error("Claude : connexion impossible : %s", exc)
        raise AIUnavailable("connexion") from exc

    if response.stop_reason == "refusal":
        category = response.stop_details.category if response.stop_details else None
        logger.warning("Claude : refus (%s), requête %s", category, response._request_id)
        raise AIUnavailable("refus")
    text = next((block.text for block in response.content if block.type == "text"), "")
    try:
        return output.model_validate(json.loads(text))
    except (json.JSONDecodeError, ValidationError) as exc:
        logger.error("Claude : réponse invalide (%s), requête %s", exc, response._request_id)
        raise AIUnavailable("réponse invalide") from exc


def _image_block(image_file):
    """Photo du produit en base64 si son format et sa taille s'y prêtent."""
    if not image_file:
        return None
    media_type = IMAGE_TYPES.get(image_file.name.rsplit(".", 1)[-1].lower())
    if media_type is None or image_file.size > MAX_IMAGE_BYTES:
        return None
    with image_file.open("rb") as handle:
        data = base64.standard_b64encode(handle.read()).decode()
    return {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": data}}


DESCRIPTION_SYSTEM = (
    "Tu rédiges les fiches produits des boutiques du Mfoundi Mall, à Yaoundé (Cameroun). "
    "Écris en français clair et chaleureux, 2 à 4 phrases, sans emoji ni majuscules excessives. "
    "Décris l'usage et les points forts concrets ; n'invente ni caractéristique technique, "
    "ni prix, ni garantie, ni promotion absents des informations fournies. "
    "Les prix sont en FCFA et le paiement se fait sur place : ne parle pas de livraison ni de paiement."
)


def describe_product(*, name, shop_type="", category="", price=None, notes="", image=None):
    lines = [f"Produit : {name}"]
    if shop_type:
        lines.append(f"Type de boutique : {shop_type}")
    if category:
        lines.append(f"Rayon : {category}")
    if price:
        lines.append(f"Prix : {price} FCFA")
    if notes:
        lines.append(f"Notes du commerçant : {notes}")
    content = [{"type": "text", "text": "\n".join(lines)}]
    if block := _image_block(image):
        content.insert(0, block)
    copy = _ask(system=DESCRIPTION_SYSTEM, content=content, output=ProductCopy, max_tokens=2000)
    return copy.description.strip()


SEARCH_SYSTEM = (
    "Tu aides à chercher dans les boutiques d'un centre commercial de Yaoundé (épiceries, "
    "téléphonie, coiffure, restaurants, bars, parfumerie, électroménager...). "
    "À partir de la requête d'un client, propose jusqu'à 8 mots-clés courts pour une recherche "
    "par sous-chaîne : synonymes français et anglais, noms usuels au Cameroun, forme singulier, "
    "catégorie de produit. Pas de phrases, pas de doublons de la requête."
)


def expand_search(query):
    """Mots-clés complémentaires pour une requête (mis en cache 24 h)."""
    query = query.strip().lower()
    key = "ai:search:" + hashlib.sha256(query.encode()).hexdigest()[:32]
    if (terms := django_cache.get(key)) is not None:
        return terms
    result = _ask(
        system=SEARCH_SYSTEM, content=f"Requête : {query}", output=SearchTerms, max_tokens=1000
    )
    terms = []
    for term in result.terms:
        term = term.strip().lower()
        if 2 <= len(term) <= 40 and term != query and term not in terms:
            terms.append(term)
    terms = terms[:8]
    django_cache.set(key, terms, SEARCH_CACHE_SECONDS)
    return terms
