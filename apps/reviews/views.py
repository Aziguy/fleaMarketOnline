from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render
from django.utils.translation import gettext as _
from django.views.decorators.http import require_POST

from apps.shops.models import Shop

from . import services
from .forms import ReviewForm


def review_context(request, shop, form=None):
    eligible = services.can_review(request.user, shop)
    mine = shop.reviews.filter(customer=request.user).first() if eligible else None
    return {
        "shop": shop,
        "reviews": shop.reviews.published().select_related("customer")[:10],
        "reviews_summary": services.summary(shop),
        "can_review": eligible,
        "my_review": mine,
        "review_form": form or (ReviewForm(instance=mine) if eligible else None),
    }


@login_required
@require_POST
def submit(request, slug):
    shop = get_object_or_404(Shop.objects.public(), slug=slug)
    if not services.can_review(request.user, shop):
        messages.error(
            request, _("Seuls les clients servis par cette boutique peuvent laisser un avis.")
        )
        return redirect(shop)
    form = ReviewForm(request.POST)
    valid = form.is_valid()
    if valid:
        services.save_review(user=request.user, shop=shop, **form.cleaned_data)
    if not request.htmx:
        if valid:
            messages.success(request, _("Merci pour votre avis."))
        else:
            messages.error(request, _("Choisissez une note de 1 à 5."))
        return redirect(f"{shop.get_absolute_url()}#avis")
    context = review_context(request, shop, None if valid else form)
    if valid:
        context["review_form"] = None
    return render(request, "reviews/_section.html", context)
