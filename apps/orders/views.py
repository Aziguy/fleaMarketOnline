from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render
from django.utils.translation import gettext as _
from django.views.decorators.http import require_POST

from apps.cart.cart import Cart
from apps.shops.models import Shop

from . import services
from .forms import CancelForm, CheckoutForm
from .models import Order
from .whatsapp import order_whatsapp_url


@login_required
def checkout(request, shop_slug):
    shop = get_object_or_404(Shop.objects.public(), slug=shop_slug)
    cart = Cart(request.session)
    group = cart.group_for(shop)
    if not group:
        messages.info(request, _("Votre panier est vide pour cette boutique."))
        return redirect("cart:detail")
    if not shop.fulfillment_methods() or not shop.payment_methods():
        messages.error(request, _("Cette boutique ne prend pas encore de commandes en ligne."))
        return redirect("cart:detail")

    form = CheckoutForm(request.POST or None, shop=shop, user=request.user)
    if request.method == "POST" and form.is_valid():
        try:
            order = services.place_order(
                customer=request.user, shop=shop, lines=group.lines, data=form.cleaned_data
            )
        except services.OrderError as exc:
            messages.error(request, str(exc))
            return redirect("cart:detail")
        cart.clear([line.product.pk for line in group.lines])
        messages.success(
            request, _("Commande %(ref)s envoyée à la boutique.") % {"ref": order.reference}
        )
        return redirect(order)
    return render(request, "orders/checkout.html", {"shop": shop, "group": group, "form": form})


@login_required
def my_orders(request):
    orders = request.user.orders.select_related("shop").prefetch_related("items")
    return render(request, "orders/my_orders.html", {"orders": orders})


@login_required
def detail(request, reference):
    order = get_object_or_404(
        Order.objects.select_related("shop").prefetch_related("items"),
        reference=reference,
        customer=request.user,
    )
    return render(
        request,
        "orders/detail.html",
        {"order": order, "cancel_form": CancelForm(), "whatsapp_url": order_whatsapp_url(order)},
    )


@login_required
@require_POST
def cancel(request, reference):
    order = get_object_or_404(Order, reference=reference, customer=request.user)
    form = CancelForm(request.POST)
    form.is_valid()
    try:
        services.cancel_by_customer(order, form.cleaned_data.get("reason", ""))
        messages.success(request, _("Commande annulée."))
    except services.OrderError as exc:
        messages.error(request, str(exc))
    return redirect(order)
