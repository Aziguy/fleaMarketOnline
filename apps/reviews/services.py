from django.db.models import Avg, Count
from django.urls import reverse
from django.utils import timezone
from django.utils.translation import gettext as _
from django.utils.translation import override

from apps.bookings.models import Booking
from apps.notifications.models import Notification
from apps.notifications.services import notify
from apps.orders.models import Order

from .models import Review


def can_review(user, shop):
    """Seuls les clients avec une commande remise ou un rendez-vous honoré peuvent noter."""
    if not user.is_authenticated or shop.owner_id == user.pk:
        return False
    return (
        Order.objects.filter(shop=shop, customer=user, status=Order.Status.COMPLETED).exists()
        or Booking.objects.filter(
            shop=shop, customer=user, status=Booking.Status.COMPLETED
        ).exists()
    )


def summary(shop):
    """Note moyenne, nombre d'avis et répartition par étoile."""
    reviews = shop.reviews.published()
    stats = reviews.aggregate(average=Avg("rating"), count=Count("pk"))
    counts = dict(reviews.values_list("rating").annotate(n=Count("pk")))
    total = stats["count"] or 1
    stats["bars"] = [
        {"stars": n, "count": counts.get(n, 0), "percent": round(100 * counts.get(n, 0) / total)}
        for n in range(5, 0, -1)
    ]
    return stats


def save_review(*, user, shop, rating, comment):
    review, created = Review.objects.update_or_create(
        shop=shop, customer=user, defaults={"rating": rating, "comment": comment}
    )
    if created:
        with override("fr"):
            title = _("Nouvel avis %(rating)s/5 pour %(shop)s") % {
                "rating": rating,
                "shop": shop.name,
            }
        notify(
            shop.owner,
            kind=Notification.Kind.REVIEW,
            title=title,
            body=comment[:280],
            url=reverse("dashboard:reviews"),
        )
    return review


def reply(review, text):
    first = review.replied_at is None
    review.reply = text
    review.replied_at = timezone.now() if text else None
    review.save(update_fields=["reply", "replied_at", "updated_at"])
    if first and text:
        with override("fr"):
            title = _("%(shop)s a répondu à votre avis") % {"shop": review.shop.name}
        notify(
            review.customer,
            kind=Notification.Kind.REPLY,
            title=title,
            body=text[:280],
            url=f"{review.shop.get_absolute_url()}#avis",
        )
    return review
