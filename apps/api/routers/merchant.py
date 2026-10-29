"""Espace commerçant : boutiques, commandes et réservations reçues."""

from django.shortcuts import get_object_or_404
from ninja import Router, Status

from apps.bookings import services as booking_services
from apps.dashboard import stats
from apps.orders import services as order_services
from apps.reviews import services as review_services

from ..schemas import (
    BookingOut,
    BookingStatusIn,
    ErrorOut,
    OrderOut,
    OrderStatusIn,
    ReplyIn,
    ReviewOut,
    ShopOut,
    StatsOut,
)

router = Router(tags=["Commerçant"])


def _shop(request, slug):
    return get_object_or_404(request.user.shops.select_related("shop_type"), slug=slug)


@router.get("/shops", response=list[ShopOut])
def my_shops(request):
    return request.user.shops.select_related("shop_type").prefetch_related("opening_hours")


@router.get("/shops/{slug}/orders", response=list[OrderOut])
def shop_orders(request, slug: str, status: str = ""):
    qs = _shop(request, slug).orders.select_related("shop").prefetch_related("items")
    return qs.filter(status=status) if status else qs


@router.post("/shops/{slug}/orders/{reference}/status", response={200: OrderOut, 409: ErrorOut})
def update_order_status(request, slug: str, reference: str, payload: OrderStatusIn):
    """Transitions : confirmed, ready (retrait), shipped (livraison), completed, cancelled.

    `completed` exige `pickup_code` pour un retrait et accepte `paid_with`."""
    order = get_object_or_404(_shop(request, slug).orders, reference=reference)
    return order_services.change_status(
        order,
        payload.status,
        pickup_code=payload.pickup_code,
        paid_with=payload.paid_with or None,
        reason=payload.reason,
    )


@router.get("/shops/{slug}/bookings", response=list[BookingOut])
def shop_bookings(request, slug: str, status: str = ""):
    qs = _shop(request, slug).bookings.select_related("shop", "service")
    return qs.filter(status=status) if status else qs


@router.post("/shops/{slug}/bookings/{reference}/status", response={200: BookingOut, 409: ErrorOut})
def update_booking_status(request, slug: str, reference: str, payload: BookingStatusIn):
    booking = get_object_or_404(_shop(request, slug).bookings, reference=reference)
    return booking_services.change_status(booking, payload.status, note=payload.note)


@router.get("/shops/{slug}/stats", response={200: StatsOut, 422: ErrorOut})
def shop_stats(request, slug: str, days: int = 30):
    """Encaissé, commandes, panier moyen et meilleures ventes (7, 30 ou 90 jours)."""
    if days not in stats.PERIODS:
        return Status(422, {"detail": "days doit valoir 7, 30 ou 90."})
    data = stats.shop_stats(_shop(request, slug), days)
    return {**data, "top_products": list(data["top_products"])}


@router.get("/shops/{slug}/reviews", response=list[ReviewOut])
def shop_reviews(request, slug: str):
    return _shop(request, slug).reviews.select_related("customer")


@router.post("/shops/{slug}/reviews/{review_id}/reply", response=ReviewOut)
def reply_review(request, slug: str, review_id: int, payload: ReplyIn):
    review = get_object_or_404(
        _shop(request, slug).reviews.select_related("customer"), pk=review_id
    )
    return review_services.reply(review, payload.reply.strip())
