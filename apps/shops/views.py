from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.db.models import Count, Q
from django.http import Http404
from django.shortcuts import get_object_or_404, redirect, render
from django.utils.translation import gettext as _

from . import services
from .forms import ShopCreateForm
from .models import Shop, ShopType


def shop_list(request):
    shops = Shop.objects.public().select_related("shop_type")
    q = request.GET.get("q", "").strip()
    current_type = None
    if q:
        shops = shops.filter(
            Q(name__icontains=q) | Q(tagline__icontains=q) | Q(description__icontains=q)
        )
    if type_slug := request.GET.get("type"):
        current_type = ShopType.objects.filter(slug=type_slug).first()
        shops = shops.filter(shop_type=current_type)
    if level := request.GET.get("niveau"):
        shops = shops.filter(level=level)
    page = Paginator(shops.order_by("-is_featured", "name"), 24).get_page(request.GET.get("page"))
    context = {
        "page": page,
        "q": q,
        "current_type": current_type,
        "shop_types": ShopType.objects.annotate(
            n=Count("shops", filter=Q(shops__status=Shop.Status.APPROVED))
        ).order_by("position"),
        "levels": Shop.Level.choices,
    }
    template = "shops/_results.html" if request.htmx else "shops/list.html"
    return render(request, template, context)


def shop_detail(request, slug):
    shop = get_object_or_404(
        Shop.objects.select_related("shop_type", "owner").prefetch_related("opening_hours"),
        slug=slug,
    )
    is_owner = request.user.is_authenticated and shop.owner_id == request.user.pk
    if not shop.is_public and not (is_owner or request.user.is_staff):
        raise Http404
    products = shop.products.filter(is_active=True).select_related("category")
    category = None
    if cat_slug := request.GET.get("rayon"):
        category = get_object_or_404(shop.categories, slug=cat_slug)
        products = products.filter(category=category)
    if q := request.GET.get("q", "").strip():
        products = products.filter(name__icontains=q)
    context = {
        "shop": shop,
        "is_owner": is_owner,
        "categories": shop.categories.annotate(
            n=Count("products", filter=Q(products__is_active=True))
        ).filter(n__gt=0),
        "category": category,
        "page": Paginator(products, 24).get_page(request.GET.get("page")),
        "services": shop.services.filter(is_active=True),
        "hours": shop.opening_hours.all(),
    }
    template = "shops/_products.html" if request.htmx else "shops/detail.html"
    return render(request, template, context)


@login_required
def open_shop(request):
    if hasattr(request.user, "shop"):
        return redirect("dashboard:home")
    form = ShopCreateForm(request.POST or None, request.FILES or None)
    if request.method == "POST" and form.is_valid():
        services.create_shop(request.user, form)
        messages.success(
            request,
            _("Boutique créée. Elle sera visible dès sa validation par l'administration du mall."),
        )
        return redirect("dashboard:home")
    return render(request, "shops/open.html", {"form": form})
