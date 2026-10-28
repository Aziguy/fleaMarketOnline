from django.http import Http404
from django.shortcuts import get_object_or_404, render

from apps.cart.cart import Cart

from .models import Product


def product_detail(request, shop_slug, slug):
    product = get_object_or_404(
        Product.objects.select_related("shop", "category").prefetch_related("images"),
        shop__slug=shop_slug,
        slug=slug,
    )
    is_owner = request.user.is_authenticated and product.shop.owner_id == request.user.pk
    if not (product.is_active and product.shop.is_public) and not (
        is_owner or request.user.is_staff
    ):
        raise Http404
    related = (
        Product.objects.public()
        .filter(shop=product.shop)
        .exclude(pk=product.pk)
        .select_related("shop")[:4]
    )
    return render(
        request,
        "catalog/product_detail.html",
        {
            "product": product,
            "related": related,
            "in_cart": Cart(request.session).quantity_of(product),
        },
    )
