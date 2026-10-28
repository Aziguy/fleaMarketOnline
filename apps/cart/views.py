from django.shortcuts import get_object_or_404, redirect, render
from django.utils.http import url_has_allowed_host_and_scheme
from django.utils.translation import gettext as _
from django.views.decorators.http import require_POST
from django_htmx.http import trigger_client_event

from apps.catalog.models import Product

from .cart import Cart


def detail(request):
    cart = Cart(request.session)
    return render(request, "cart/detail.html", {"groups": cart.groups()})


def _quantity(request, default=1):
    try:
        return int(request.POST.get("quantity", default))
    except (TypeError, ValueError):
        return default


@require_POST
def add(request, product_id):
    product = get_object_or_404(Product.objects.public(), pk=product_id)
    cart = Cart(request.session)
    if product.in_stock:
        cart.add(product, max(1, _quantity(request)))
    if request.htmx:
        response = render(request, "cart/_counter.html", {"cart_count": len(cart)})
        message = _("Ajouté au panier") if product.in_stock else _("Produit épuisé")
        return trigger_client_event(response, "toast", {"value": message})
    target = request.POST.get("next", "")
    if url_has_allowed_host_and_scheme(target, {request.get_host()}, request.is_secure()):
        return redirect(target)
    return redirect("cart:detail")


@require_POST
def update(request, product_id):
    product = get_object_or_404(Product.objects.public(), pk=product_id)
    cart = Cart(request.session)
    cart.set(product, _quantity(request, 0))
    if request.htmx:
        return render(
            request, "cart/_content.html", {"groups": cart.groups(), "cart_count": len(cart)}
        )
    return redirect("cart:detail")


@require_POST
def remove(request, product_id):
    cart = Cart(request.session)
    cart.remove(product_id)
    if request.htmx:
        return render(
            request, "cart/_content.html", {"groups": cart.groups(), "cart_count": len(cart)}
        )
    return redirect("cart:detail")
