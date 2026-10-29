from dataclasses import dataclass
from datetime import date, datetime, time, timedelta

from django.db.models import Count, F, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone

from apps.bookings.models import Booking
from apps.orders.models import Order, OrderItem, PaymentMethod

PERIODS = (7, 30, 90)


@dataclass
class Day:
    day: date
    revenue: int
    orders: int
    height: float = 0


def _start(day):
    return timezone.make_aware(datetime.combine(day, time.min))


def _trend(current, previous):
    if not previous:
        return None
    return round(100 * (current - previous) / previous)


def shop_stats(shop, days=30):
    """Indicateurs de la boutique sur les `days` derniers jours (commandes remises et payées)."""
    today = timezone.localdate()
    first = today - timedelta(days=days - 1)
    since, before = _start(first), _start(first - timedelta(days=days))
    paid = shop.orders.filter(status=Order.Status.COMPLETED)
    current = paid.filter(paid_at__gte=since)
    totals = current.aggregate(revenue=Sum("total"), count=Count("pk"))
    revenue, count = totals["revenue"] or 0, totals["count"]
    previous = paid.filter(paid_at__gte=before, paid_at__lt=since).aggregate(s=Sum("total"))["s"]

    per_day = {
        row["day"]: row
        for row in current.annotate(day=TruncDate("paid_at"))
        .values("day")
        .annotate(revenue=Sum("total"), orders=Count("pk"))
    }
    series = [
        Day(d, per_day.get(d, {}).get("revenue", 0), per_day.get(d, {}).get("orders", 0))
        for d in (first + timedelta(days=n) for n in range(days))
    ]
    peak = max((d.revenue for d in series), default=0)
    for d in series:
        d.height = round(100 * d.revenue / peak, 1) if peak else 0

    created = shop.orders.filter(created_at__gte=since)
    placed = created.count()
    cancelled = created.filter(status=Order.Status.CANCELLED).count()
    labels = dict(PaymentMethod.choices)
    payments = [
        {"label": str(labels.get(row["paid_with"], row["paid_with"])), **row}
        for row in current.values("paid_with")
        .annotate(revenue=Sum("total"), orders=Count("pk"))
        .order_by("-revenue")
    ]
    for row in payments:
        row["percent"] = round(100 * row["revenue"] / revenue) if revenue else 0

    return {
        "days": days,
        "revenue": revenue,
        "orders": count,
        "basket": revenue // count if count else 0,
        "trend": _trend(revenue, previous or 0),
        "series": series,
        "peak": peak,
        "cancel_rate": round(100 * cancelled / placed) if placed else 0,
        "payments": payments,
        "top_products": OrderItem.objects.filter(order__in=current)
        .values("product_name")
        .annotate(sold=Sum("quantity"), revenue=Sum(F("unit_price") * F("quantity")))
        .order_by("-revenue")[:8],
        "bookings_done": shop.bookings.filter(
            status=Booking.Status.COMPLETED, date__gte=first
        ).count(),
    }


def orders_csv_rows(orders):
    """Lignes d'export comptable : une ligne par commande."""
    yield [
        "Référence",
        "Créée le",
        "Statut",
        "Client",
        "Téléphone",
        "Mode de remise",
        "Paiement prévu",
        "Payé par",
        "Payée le",
        "Articles",
        "Sous-total (FCFA)",
        "Livraison (FCFA)",
        "Total (FCFA)",
    ]
    for order in orders:
        yield [
            order.reference,
            timezone.localtime(order.created_at).strftime("%d/%m/%Y %H:%M"),
            order.get_status_display(),
            order.contact_name,
            order.contact_phone,
            order.get_fulfillment_display(),
            order.get_payment_method_display(),
            order.get_paid_with_display() if order.paid_with else "",
            timezone.localtime(order.paid_at).strftime("%d/%m/%Y %H:%M") if order.paid_at else "",
            " ; ".join(f"{i.quantity} x {i.product_name}" for i in order.items.all()),
            order.subtotal,
            order.delivery_fee,
            order.total,
        ]
