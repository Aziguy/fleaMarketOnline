from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import Http404
from django.shortcuts import get_object_or_404, redirect, render
from django.utils.translation import gettext as _
from django.views.decorators.http import require_POST

from apps.shops.models import Shop

from . import services
from .forms import BookingForm
from .models import Booking


def _bookable(shop):
    t = shop.shop_type
    return t.takes_appointments or t.takes_table_bookings


@login_required
def create(request, shop_slug):
    shop = get_object_or_404(Shop.objects.public().select_related("shop_type"), slug=shop_slug)
    if not _bookable(shop):
        raise Http404
    initial = {}
    if service_id := request.GET.get("service"):
        initial = {"service": service_id, "kind": Booking.Kind.APPOINTMENT}
    form = BookingForm(request.POST or None, shop=shop, user=request.user, initial=initial)
    if request.method == "POST" and form.is_valid():
        booking = services.create_booking(form=form, shop=shop, customer=request.user)
        messages.success(request, _("Demande de réservation envoyée. La boutique va la confirmer."))
        return redirect(booking)
    return render(request, "bookings/create.html", {"shop": shop, "form": form})


@login_required
def my_bookings(request):
    bookings = request.user.bookings.select_related("shop", "service").order_by("-date", "-time")
    return render(request, "bookings/my_bookings.html", {"bookings": bookings})


@login_required
def detail(request, reference):
    booking = get_object_or_404(
        Booking.objects.select_related("shop", "service"),
        reference=reference,
        customer=request.user,
    )
    return render(request, "bookings/detail.html", {"booking": booking})


@login_required
@require_POST
def cancel(request, reference):
    booking = get_object_or_404(Booking, reference=reference, customer=request.user)
    try:
        services.cancel_by_customer(booking)
        messages.success(request, _("Réservation annulée."))
    except services.BookingError as exc:
        messages.error(request, str(exc))
    return redirect(booking)
