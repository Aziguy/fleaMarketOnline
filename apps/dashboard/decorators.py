from functools import wraps

from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect


def merchant_required(view):
    """Injecte la boutique du commerçant connecté (request.shop)."""

    @login_required
    @wraps(view)
    def wrapper(request, *args, **kwargs):
        shop = getattr(request.user, "shop", None)
        if shop is None:
            return redirect("shops:open")
        request.shop = shop
        return view(request, *args, **kwargs)

    return wrapper
