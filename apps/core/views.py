from django.core.cache import cache
from django.db.models import Count, Q
from django.shortcuts import render

from apps.catalog.models import Product
from apps.shops.models import Shop, ShopType

from .search import search_catalog

HOME_CACHE_SECONDS = 120


def _home_overview():
    """Types de boutique et compteurs de l'accueil (mis en cache, peu volatils)."""
    return {
        "shop_types": list(
            ShopType.objects.annotate(
                n=Count("shops", filter=Q(shops__status=Shop.Status.APPROVED))
            ).order_by("position")
        ),
        "stats": {
            "shops": Shop.objects.public().count(),
            "products": Product.objects.public().count(),
        },
    }


def home(request):
    context = {
        **(cache.get_or_set("home:overview", _home_overview, HOME_CACHE_SECONDS) or {}),
        "featured_shops": Shop.objects.public()
        .select_related("shop_type")
        .order_by("-is_featured", "-created_at")[:8],
        "latest_products": Product.objects.public().select_related("shop")[:12],
        "deals": Product.objects.public()
        .filter(compare_at_price__isnull=False)
        .select_related("shop")[:4],
    }
    return render(request, "core/home.html", context)


def search(request):
    result = search_catalog(request.GET.get("q"))
    return render(request, "core/search.html", {"q": result.query, "result": result})


def palette(request):
    """Résultats de la palette de recherche (fragment HTMX)."""
    q = (request.GET.get("q") or "").strip()
    result = search_catalog(q, products_limit=6, shops_limit=4)
    return render(request, "core/_palette_results.html", {"q": q, "result": result})


def how_it_works(request):
    return render(request, "core/how_it_works.html")


def merchants(request):
    return render(request, "core/merchants.html")
