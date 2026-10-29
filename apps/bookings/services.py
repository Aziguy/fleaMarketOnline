"""Règles métier des réservations, partagées par les pages et l'API."""

from django.utils.translation import gettext as _

from .models import Booking


class BookingError(Exception):
    pass


def create_booking(*, form, shop, customer):
    booking = form.save(commit=False)
    booking.shop = shop
    booking.customer = customer
    booking.save()
    return booking


def cancel_by_customer(booking):
    if not booking.customer_can_cancel:
        raise BookingError(_("Cette réservation ne peut plus être annulée."))
    booking.status = Booking.Status.CANCELLED
    booking.save(update_fields=["status"])
    return booking


def change_status(booking, new_status, *, note=""):
    if new_status not in booking.next_statuses():
        raise BookingError(_("Changement de statut impossible."))
    booking.status = new_status
    booking.merchant_note = note or booking.merchant_note
    booking.save(update_fields=["status", "merchant_note"])
    return booking
