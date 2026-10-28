from django.db.models import Count, Q
from django.shortcuts import render

from apps.catalog.models import Product
from apps.shops.models import Shop, ShopType


def home(request):
    context = {
        "shop_types": ShopType.objects.annotate(
            n=Count("shops", filter=Q(shops__status=Shop.Status.APPROVED))
        ).order_by("position"),
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
    q = request.GET.get("q", "").strip()
    products, shops = Product.objects.none(), Shop.objects.none()
    if len(q) >= 2:
        products = (
            Product.objects.public()
            .filter(
                Q(name__icontains=q) | Q(description__icontains=q) | Q(category__name__icontains=q)
            )
            .select_related("shop")[:48]
        )
        shops = (
            Shop.objects.public()
            .filter(
                Q(name__icontains=q) | Q(tagline__icontains=q) | Q(shop_type__name__icontains=q)
            )
            .select_related("shop_type")[:12]
        )
    template = "core/_search_suggestions.html" if request.htmx else "core/search.html"
    return render(request, template, {"q": q, "products": products, "shops": shops})


def how_it_works(request):
    return render(request, "core/how_it_works.html")


def merchants(request):
    return render(request, "core/merchants.html")
