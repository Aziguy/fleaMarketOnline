from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.http import require_POST

from apps.catalog.models import Product
from apps.shops.models import Shop

from . import services


@login_required
def favorite_list(request):
    favorites = request.user.favorites.select_related("shop__shop_type", "product__shop__shop_type")
    return render(
        request,
        "favorites/list.html",
        {
            "shops": [f.shop for f in favorites if f.shop and f.shop.is_public],
            "products": [f.product for f in favorites if f.product and f.product.is_active],
        },
    )


def _toggle(request, **target):
    if not request.user.is_authenticated:
        login = f"{reverse('accounts:login')}?next={request.POST.get('next', '/')}"
        if request.htmx:
            return HttpResponse(headers={"HX-Redirect": login})
        return redirect(login)
    active = services.toggle(request.user, **target)
    if request.htmx:
        kind, obj = next(iter(target.items()))
        return render(
            request,
            "favorites/_button.html",
            {
                "kind": kind,
                "obj": obj,
                "state": "on" if active else "off",
                "size": request.POST.get("size"),
            },
        )
    next_url = request.POST.get("next", "")
    if not url_has_allowed_host_and_scheme(next_url, {request.get_host()}):
        next_url = reverse("favorites:list")
    return redirect(next_url)


@require_POST
def toggle_shop(request, pk):
    return _toggle(request, shop=get_object_or_404(Shop.objects.public(), pk=pk))


@require_POST
def toggle_product(request, pk):
    return _toggle(request, product=get_object_or_404(Product.objects.public(), pk=pk))
