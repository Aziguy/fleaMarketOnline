from functools import wraps

from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect

from apps.shops.views import CURRENT_SHOP_KEY


def merchant_required(view):
    """Injecte la boutique courante du commerçant (request.shop) et ses boutiques (request.shops)."""

    @login_required
    @wraps(view)
    def wrapper(request, *args, **kwargs):
        shops = list(request.user.shops.select_related("shop_type").order_by("name"))
        if not shops:
            return redirect("shops:open")
        current_id = request.session.get(CURRENT_SHOP_KEY)
        request.shop = next((s for s in shops if s.pk == current_id), shops[0])
        request.shops = shops
        return view(request, *args, **kwargs)

    return wrapper
