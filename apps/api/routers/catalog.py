"""Catalogue public : types, boutiques, produits, prestations, recherche."""

from django.db.models import Q
from django.shortcuts import get_object_or_404
from ninja import Router
from ninja.pagination import PageNumberPagination, paginate

from apps.catalog.models import Product
from apps.core.search import search_catalog, smart_search
from apps.shops.models import Shop, ShopType

from ..schemas import ProductOut, SearchOut, ServiceOut, ShopDetailOut, ShopOut, ShopTypeOut

router = Router(tags=["Catalogue"])


def _shops():
    return (
        Shop.objects.public()
        .with_rating()
        .select_related("shop_type")
        .prefetch_related("opening_hours")
    )


@router.get("/shop-types", response=list[ShopTypeOut])
def shop_types(request):
    return ShopType.objects.all()


@router.get("/shops", response=list[ShopOut])
@paginate(PageNumberPagination, page_size=24)
def shops(request, type: str = "", q: str = "", level: str = ""):
    qs = _shops().order_by("-is_featured", "name")
    if type:
        qs = qs.filter(shop_type__slug=type)
    if level:
        qs = qs.filter(level=level)
    if q:
        qs = qs.filter(Q(name__icontains=q) | Q(tagline__icontains=q))
    return qs


@router.get("/shops/{slug}", response=ShopDetailOut)
def shop(request, slug: str):
    return get_object_or_404(_shops(), slug=slug)


@router.get("/shops/{slug}/products", response=list[ProductOut])
@paginate(PageNumberPagination, page_size=48)
def shop_products(request, slug: str, category: str = "", q: str = ""):
    shop = get_object_or_404(Shop.objects.public(), slug=slug)
    qs = Product.objects.public().filter(shop=shop).select_related("shop", "category")
    if category:
        qs = qs.filter(category__slug=category)
    if q:
        qs = qs.filter(name__icontains=q)
    return qs


@router.get("/shops/{slug}/services", response=list[ServiceOut])
def shop_services(request, slug: str):
    shop = get_object_or_404(Shop.objects.public(), slug=slug)
    return shop.services.filter(is_active=True)


@router.get("/products/{shop_slug}/{slug}", response=ProductOut)
def product(request, shop_slug: str, slug: str):
    return get_object_or_404(
        Product.objects.public().select_related("shop", "category"), shop__slug=shop_slug, slug=slug
    )


@router.get("/search", response=SearchOut)
def search(request, q: str, smart: bool = False):
    """`smart=true` élargit la recherche avec l'assistant IA quand elle trouve peu de produits."""
    run = smart_search if smart else search_catalog
    return run(q, products_limit=24, shops_limit=8)
