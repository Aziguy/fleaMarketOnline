from datetime import timedelta
from typing import Any

from django.conf import settings
from django.contrib import messages
from django.core.cache import cache
from django.core.paginator import Paginator
from django.db.models import Q, Sum
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.utils.translation import gettext as _
from django.views.decorators.http import require_POST

from apps.ai import services as ai
from apps.bookings import services as booking_services
from apps.bookings.forms import MerchantBookingForm
from apps.bookings.models import Booking
from apps.orders import services as order_services
from apps.orders.forms import CancelForm, CompleteOrderForm
from apps.orders.models import Order
from apps.shops.forms import OpeningHourFormSet, ShopSettingsForm
from apps.shops.services import ensure_opening_hours
from apps.shops.views import CURRENT_SHOP_KEY

from .decorators import merchant_required
from .forms import CategoryForm, ProductForm, ProductImageFormSet, ServiceForm

LOW_STOCK = 3


@merchant_required
def home(request):
    shop = request.shop
    now = timezone.localtime()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    orders = shop.orders.all()
    context = {
        "pending_orders": orders.filter(status=Order.Status.PENDING).count(),
        "open_orders": orders.filter(status__in=Order.OPEN_STATUSES).count(),
        "month_revenue": orders.filter(
            status=Order.Status.COMPLETED, paid_at__gte=month_start
        ).aggregate(s=Sum("total"))["s"]
        or 0,
        "recent_orders": orders.select_related("customer")[:5],
        "upcoming_bookings": shop.bookings.filter(
            date__gte=now.date(),
            date__lte=now.date() + timedelta(days=7),
            status__in=[Booking.Status.PENDING, Booking.Status.CONFIRMED],
        ).select_related("customer", "service")[:6],
        "low_stock": shop.products.filter(is_active=True, stock__lte=LOW_STOCK),
        "product_count": shop.products.count(),
    }
    return render(request, "dashboard/home.html", context)


@merchant_required
@require_POST
def switch_shop(request):
    shop = get_object_or_404(request.user.shops, pk=request.POST.get("shop"))
    request.session[CURRENT_SHOP_KEY] = shop.pk
    return redirect("dashboard:home")


@merchant_required
def shop_settings(request):
    instance = type(request.shop).objects.get(pk=request.shop.pk)
    form = ShopSettingsForm(request.POST or None, request.FILES or None, instance=instance)
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, _("Informations enregistrées."))
        return redirect("dashboard:settings")
    return render(request, "dashboard/settings.html", {"form": form})


@merchant_required
def opening_hours(request):
    ensure_opening_hours(request.shop)
    formset = OpeningHourFormSet(request.POST or None, instance=request.shop)
    if request.method == "POST" and formset.is_valid():
        formset.save()
        messages.success(request, _("Horaires enregistrés."))
        return redirect("dashboard:hours")
    return render(request, "dashboard/hours.html", {"formset": formset})


def _edit(request, form, template, success_url, extra=None):
    """Gère un formulaire de création / modification simple."""
    if request.method == "POST" and form.is_valid():
        obj = form.save(commit=False)
        obj.shop = request.shop
        obj.save()
        form.save_m2m()
        messages.success(request, _("Enregistré."))
        return redirect(success_url)
    return render(request, template, {"form": form, **(extra or {})})


@merchant_required
def categories(request):
    form = CategoryForm(request.POST or None)
    return _edit(
        request,
        form,
        "dashboard/categories.html",
        "dashboard:categories",
        {"categories": request.shop.categories.all()},
    )


@merchant_required
def category_edit(request, pk):
    category = get_object_or_404(request.shop.categories, pk=pk)
    form = CategoryForm(request.POST or None, instance=category)
    return _edit(
        request,
        form,
        "dashboard/category_form.html",
        "dashboard:categories",
        {"category": category},
    )


@merchant_required
@require_POST
def category_delete(request, pk):
    get_object_or_404(request.shop.categories, pk=pk).delete()
    messages.success(request, _("Rayon supprimé. Ses produits restent en ligne sans rayon."))
    return redirect("dashboard:categories")


@merchant_required
def products(request):
    qs = request.shop.products.select_related("category")
    if q := request.GET.get("q", "").strip():
        qs = qs.filter(Q(name__icontains=q) | Q(description__icontains=q))
    if request.GET.get("filtre") == "stock":
        qs = qs.filter(stock__lte=LOW_STOCK)
    elif request.GET.get("filtre") == "hors-ligne":
        qs = qs.filter(is_active=False)
    page = Paginator(qs, 30).get_page(request.GET.get("page"))
    return render(request, "dashboard/products.html", {"page": page, "q": q})


@merchant_required
def product_form(request, pk=None):
    product = get_object_or_404(request.shop.products, pk=pk) if pk else None
    form = ProductForm(
        request.POST or None, request.FILES or None, instance=product, shop=request.shop
    )
    formset = ProductImageFormSet(request.POST or None, request.FILES or None, instance=product)
    if request.method == "POST" and form.is_valid() and formset.is_valid():
        product = form.save(commit=False)
        product.shop = request.shop
        product.save()
        formset.instance = product
        formset.save()
        messages.success(request, _("Produit enregistré."))
        return redirect("dashboard:products")
    return render(
        request,
        "dashboard/product_form.html",
        {"form": form, "formset": formset, "product": product},
    )


@merchant_required
@require_POST
def product_toggle(request, pk):
    product = get_object_or_404(request.shop.products, pk=pk)
    product.is_active = not product.is_active
    product.save(update_fields=["is_active", "updated_at"])
    if request.htmx:
        return render(request, "dashboard/_product_row.html", {"product": product})
    return redirect("dashboard:products")


@merchant_required
@require_POST
def product_delete(request, pk):
    get_object_or_404(request.shop.products, pk=pk).delete()
    messages.success(request, _("Produit supprimé."))
    return redirect("dashboard:products")


@merchant_required
def services(request):
    return render(request, "dashboard/services.html", {"services": request.shop.services.all()})


@merchant_required
def service_form(request, pk=None):
    service = get_object_or_404(request.shop.services, pk=pk) if pk else None
    form = ServiceForm(request.POST or None, instance=service)
    return _edit(
        request, form, "dashboard/service_form.html", "dashboard:services", {"service": service}
    )


@merchant_required
@require_POST
def service_delete(request, pk):
    get_object_or_404(request.shop.services, pk=pk).delete()
    messages.success(request, _("Prestation supprimée."))
    return redirect("dashboard:services")


@merchant_required
def orders(request):
    qs = request.shop.orders.select_related("customer")
    status = request.GET.get("statut", "open")
    if status == "open":
        qs = qs.filter(status__in=Order.OPEN_STATUSES)
    elif status in Order.Status.values:
        qs = qs.filter(status=status)
    if q := request.GET.get("q", "").strip():
        qs = qs.filter(
            Q(reference__icontains=q) | Q(contact_name__icontains=q) | Q(contact_phone__icontains=q)
        )
    page = Paginator(qs, 30).get_page(request.GET.get("page"))
    return render(
        request,
        "dashboard/orders.html",
        {"page": page, "status": status, "statuses": Order.Status.choices, "q": q},
    )


def _order_context(order, **forms):
    return {
        "order": order,
        "complete_form": forms.get("complete_form")
        or CompleteOrderForm(initial={"paid_with": order.payment_method}),
        "cancel_form": forms.get("cancel_form") or CancelForm(),
    }


@merchant_required
def order_detail(request, reference):
    order = get_object_or_404(
        request.shop.orders.select_related("customer").prefetch_related("items"),
        reference=reference,
    )
    return render(request, "dashboard/order_detail.html", _order_context(order))


@merchant_required
@require_POST
def order_action(request, reference):
    order = get_object_or_404(request.shop.orders, reference=reference)
    target = request.POST.get("status")
    forms: dict[str, Any] = {}
    try:
        if target == Order.Status.COMPLETED:
            forms["complete_form"] = complete = CompleteOrderForm(request.POST)
            if not complete.is_valid():
                raise order_services.OrderError(_("Formulaire incomplet."))
            order_services.change_status(order, target, **complete.cleaned_data)
        elif target == Order.Status.CANCELLED:
            forms["cancel_form"] = cancel = CancelForm(request.POST)
            cancel.is_valid()
            order_services.change_status(
                order, target, reason=cancel.cleaned_data.get("reason", "")
            )
        else:
            order_services.change_status(order, target)
        messages.success(
            request, _("Commande : %(status)s.") % {"status": order.get_status_display()}
        )
    except order_services.OrderError as exc:
        messages.error(request, str(exc))
    if request.htmx:
        return render(request, "dashboard/_order_actions.html", _order_context(order, **forms))
    return redirect("dashboard:order_detail", reference=order.reference)


@merchant_required
def bookings(request):
    today = timezone.localdate()
    period = request.GET.get("periode", "a-venir")
    qs = request.shop.bookings.select_related("customer", "service")
    if period == "passees":
        qs = qs.filter(date__lt=today).order_by("-date", "-time")
    else:
        qs = qs.filter(date__gte=today)
    if status := request.GET.get("statut"):
        qs = qs.filter(status=status)
    page = Paginator(qs, 30).get_page(request.GET.get("page"))
    return render(
        request,
        "dashboard/bookings.html",
        {
            "page": page,
            "period": period,
            "statuses": Booking.Status.choices,
            "form": MerchantBookingForm(),
        },
    )


@merchant_required
@require_POST
def booking_action(request, reference):
    booking = get_object_or_404(request.shop.bookings, reference=reference)
    form = MerchantBookingForm(request.POST)
    form.is_valid()
    try:
        booking_services.change_status(
            booking, request.POST.get("status"), note=form.cleaned_data.get("merchant_note", "")
        )
        messages.success(request, _("Réservation : %(s)s.") % {"s": booking.get_status_display()})
    except booking_services.BookingError as exc:
        messages.error(request, str(exc))
    if request.htmx:
        return render(
            request,
            "dashboard/_booking_row.html",
            {"booking": booking, "form": MerchantBookingForm()},
        )
    return redirect("dashboard:bookings")


@merchant_required
@require_POST
def ai_description(request):
    """Brouillon de description produit rédigé par l'assistant IA (fragment HTMX)."""
    shop = request.shop
    product = shop.products.filter(pk=request.POST.get("product") or None).first()
    category = shop.categories.filter(pk=request.POST.get("category") or None).first()
    error = ""
    description = request.POST.get("description", "")
    key = f"ai:quota:{request.user.pk}"
    used = cache.get(key, 0)
    if not request.POST.get("name", "").strip():
        error = _("Indiquez d'abord le nom du produit.")
    elif used >= settings.AI_DESCRIPTIONS_PER_HOUR:
        error = _("Limite atteinte. Réessayez dans une heure.")
    else:
        cache.set(key, used + 1, 3600)
        try:
            description = ai.describe_product(
                name=request.POST["name"].strip()[:120],
                shop_type=shop.shop_type.name,
                category=category.name if category else "",
                price=request.POST.get("price") or None,
                notes=description[:500],
                image=product.image if product else None,
            )
        except ai.AIUnavailable:
            error = _("L'assistant n'est pas disponible pour le moment.")
    return render(
        request, "dashboard/_ai_description.html", {"description": description, "error": error}
    )
