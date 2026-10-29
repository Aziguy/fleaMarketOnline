"""Flux temps réel de l'espace commerçant (Server-Sent Events).

Le flux interroge la base à intervalle court : aucune infrastructure supplémentaire.
Sous ASGI (Uvicorn) il ne bloque aucun worker ; sous WSGI (runserver) il occupe un thread.
"""

import asyncio
import json
import time
from dataclasses import dataclass

from asgiref.sync import sync_to_async
from django.conf import settings
from django.core.handlers.asgi import ASGIRequest
from django.db.models import Max
from django.http import HttpResponse, StreamingHttpResponse
from django.urls import reverse
from django.utils.translation import gettext as _

from apps.bookings.models import Booking
from apps.core.money import format_fcfa
from apps.orders.models import Order

from .decorators import current_shop


@dataclass(frozen=True)
class Cursor:
    """Derniers identifiants déjà envoyés (commandes, réservations)."""

    order: int = 0
    booking: int = 0

    def __str__(self):
        return f"{self.order}:{self.booking}"

    @classmethod
    def parse(cls, value):
        try:
            order, booking = (int(part) for part in value.split(":"))
            return cls(order, booking)
        except (AttributeError, ValueError):
            return None

    @classmethod
    def latest(cls, shop_id):
        return cls(
            Order.objects.filter(shop_id=shop_id).aggregate(m=Max("id"))["m"] or 0,
            Booking.objects.filter(shop_id=shop_id).aggregate(m=Max("id"))["m"] or 0,
        )


def collect(shop_id, cursor):
    """Nouvelles commandes et réservations depuis le curseur : [(événement, curseur), ...]."""
    events = []
    orders = Order.objects.filter(shop_id=shop_id, id__gt=cursor.order).order_by("id")
    for order in orders:
        cursor = Cursor(order.id, cursor.booking)
        events.append(
            (
                {
                    "type": "order",
                    "reference": order.reference,
                    "title": _("Nouvelle commande %(ref)s") % {"ref": order.reference},
                    "body": f"{order.contact_name} · {format_fcfa(order.total)} · {order.get_fulfillment_display()}",
                    "url": reverse("dashboard:order_detail", args=[order.reference]),
                },
                cursor,
            )
        )
    bookings = Booking.objects.filter(shop_id=shop_id, id__gt=cursor.booking).select_related(
        "service"
    )
    for booking in bookings.order_by("id"):
        what = booking.service.name if booking.service else booking.get_kind_display()
        cursor = Cursor(cursor.order, booking.id)
        events.append(
            (
                {
                    "type": "booking",
                    "reference": booking.reference,
                    "title": _("Nouvelle réservation %(ref)s") % {"ref": booking.reference},
                    "body": f"{what} · {booking.date:%d/%m} {booking.time:%H:%M}",
                    "url": reverse("dashboard:bookings"),
                },
                cursor,
            )
        )
    return events, cursor


def encode(event, cursor):
    data = json.dumps(event, ensure_ascii=False)
    return f"id: {cursor}\nevent: {event['type']}\ndata: {data}\n\n"


def _start(request):
    shop, _shops = current_shop(request)
    if shop is None:
        return None, None
    cursor = Cursor.parse(request.headers.get("Last-Event-ID")) or Cursor.latest(shop.pk)
    return shop.pk, cursor


def _response(stream):
    response = StreamingHttpResponse(stream, content_type="text/event-stream")
    response["Cache-Control"] = "no-cache"
    response["X-Accel-Buffering"] = "no"
    return response


async def events(request):
    user = await request.auser()
    if not user.is_authenticated:
        return HttpResponse(status=401)
    shop_id, cursor = await sync_to_async(_start)(request)
    if shop_id is None:
        return HttpResponse(status=403)
    duration = settings.REALTIME_STREAM_SECONDS
    poll = settings.REALTIME_POLL_SECONDS

    async def async_stream(cursor):
        yield f"retry: {settings.REALTIME_RETRY_MS}\n\n"
        deadline = time.monotonic() + duration
        while time.monotonic() < deadline:
            batch, cursor = await sync_to_async(collect)(shop_id, cursor)
            for event, event_cursor in batch:
                yield encode(event, event_cursor)
            yield ": ping\n\n"
            await asyncio.sleep(poll)

    def sync_stream(cursor):
        yield f"retry: {settings.REALTIME_RETRY_MS}\n\n"
        deadline = time.monotonic() + duration
        while time.monotonic() < deadline:
            batch, cursor = collect(shop_id, cursor)
            for event, event_cursor in batch:
                yield encode(event, event_cursor)
            yield ": ping\n\n"
            time.sleep(poll)

    if isinstance(request, ASGIRequest):
        return _response(async_stream(cursor))
    return _response(sync_stream(cursor))
