"""Recherche catalogue partagée par les pages, la palette et l'API."""

from dataclasses import dataclass, field

from django.db.models import Q

from apps.catalog.models import Product
from apps.shops.models import Shop

MIN_LENGTH = 2


@dataclass
class SearchResult:
    query: str
    products: list = field(default_factory=list)
    shops: list = field(default_factory=list)
    terms: list = field(default_factory=list)
    expanded_terms: list = field(default_factory=list)

    def __bool__(self):
        return bool(self.products or self.shops)


def _matches(terms, *fields):
    condition = Q()
    for term in terms:
        for name in fields:
            condition |= Q(**{f"{name}__icontains": term})
    return condition


def search_catalog(query, *, terms=None, products_limit=48, shops_limit=12):
    """Cherche produits et boutiques publics contenant la requête ou l'un des termes."""
    query = (query or "").strip()
    terms = [t for t in (terms or [query]) if len(t) >= MIN_LENGTH]
    if not terms:
        return SearchResult(query=query)
    products = (
        Product.objects.public()
        .filter(_matches(terms, "name", "description", "category__name"))
        .select_related("shop")
        .distinct()[:products_limit]
    )
    shops = (
        Shop.objects.public()
        .filter(_matches(terms, "name", "tagline", "shop_type__name", "shop_type__name_en"))
        .select_related("shop_type")
        .distinct()[:shops_limit]
    )
    return SearchResult(query=query, products=list(products), shops=list(shops), terms=terms)


SMART_THRESHOLD = 3


def smart_search(query, **limits):
    """Recherche classique, élargie par l'assistant IA quand elle trouve peu de produits."""
    from apps.ai import services as ai

    result = search_catalog(query, **limits)
    if len(result.products) >= SMART_THRESHOLD or len(result.query) < 3 or not ai.is_enabled():
        return result
    try:
        extra = ai.expand_search(result.query)
    except ai.AIUnavailable:
        return result
    if not extra:
        return result
    expanded = search_catalog(query, terms=[result.query, *extra], **limits)
    expanded.expanded_terms = extra
    return expanded if expanded else result
