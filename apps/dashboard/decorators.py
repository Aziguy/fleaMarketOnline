from functools import wraps

from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect

from apps.shops.views import CURRENT_SHOP_KEY


def current_shop(request):
    """Boutique courante du commerçant et liste de ses boutiques, ou (None, [])."""
    shops = list(request.user.shops.select_related("shop_type").order_by("name"))
    if not shops:
        return None, []
    current_id = request.session.get(CURRENT_SHOP_KEY)
    return next((s for s in shops if s.pk == current_id), shops[0]), shops


def merchant_required(view):
    """Injecte la boutique courante du commerçant (request.shop) et ses boutiques (request.shops)."""

    @login_required
    @wraps(view)
    def wrapper(request, *args, **kwargs):
        shop, shops = current_shop(request)
        if shop is None:
            return redirect("shops:open")
        request.shop, request.shops = shop, shops
        request.pending = {
            "orders": shop.orders.filter(status="pending").count(),
            "bookings": shop.bookings.filter(status="pending").count(),
        }
        return view(request, *args, **kwargs)

    return wrapper
