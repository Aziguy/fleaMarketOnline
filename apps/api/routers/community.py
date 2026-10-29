"""Avis clients, favoris et notifications."""

from django.shortcuts import get_object_or_404
from ninja import Router, Status
from ninja.pagination import PageNumberPagination, paginate

from apps.catalog.models import Product
from apps.favorites.models import Favorite
from apps.notifications import services as notification_services
from apps.reviews import services as review_services
from apps.shops.models import Shop

from ..auth import TokenAuth
from ..schemas import ErrorOut, FavoritesOut, NotificationOut, ReviewIn, ReviewOut

router = Router()
auth = TokenAuth()


@router.get("/shops/{slug}/reviews", response=list[ReviewOut], tags=["Avis"])
@paginate(PageNumberPagination, page_size=20)
def shop_reviews(request, slug: str):
    shop = get_object_or_404(Shop.objects.public(), slug=slug)
    return shop.reviews.published().select_related("customer")


@router.post(
    "/shops/{slug}/reviews",
    response={201: ReviewOut, 403: ErrorOut},
    auth=auth,
    tags=["Avis"],
)
def post_review(request, slug: str, payload: ReviewIn):
    """Crée ou met à jour l'avis du client (commande remise ou rendez-vous honoré requis)."""
    shop = get_object_or_404(Shop.objects.public(), slug=slug)
    if not review_services.can_review(request.user, shop):
        return Status(403, {"detail": "Réservé aux clients servis par cette boutique."})
    review = review_services.save_review(
        user=request.user, shop=shop, rating=payload.rating, comment=payload.comment
    )
    return Status(201, review)


@router.get("/favorites", response=FavoritesOut, auth=auth, tags=["Favoris"])
def favorites(request):
    rows = request.user.favorites.select_related("shop__shop_type", "product__shop")
    return {
        "shops": [f.shop for f in rows if f.shop and f.shop.is_public],
        "products": [f.product for f in rows if f.product and f.product.is_active],
    }


def _favorite_target(kind, key):
    if kind == "shops":
        return {"shop": get_object_or_404(Shop.objects.public(), slug=key)}
    return {"product": get_object_or_404(Product.objects.public(), pk=key)}


@router.put("/favorites/{kind}/{key}", response={204: None}, auth=auth, tags=["Favoris"])
def add_favorite(request, kind: str, key: str):
    """`kind` : `shops` (clé = slug) ou `products` (clé = identifiant)."""
    Favorite.objects.get_or_create(user=request.user, **_favorite_target(kind, key))
    return Status(204, None)


@router.delete("/favorites/{kind}/{key}", response={204: None}, auth=auth, tags=["Favoris"])
def remove_favorite(request, kind: str, key: str):
    Favorite.objects.filter(user=request.user, **_favorite_target(kind, key)).delete()
    return Status(204, None)


@router.get("/notifications", response=list[NotificationOut], auth=auth, tags=["Notifications"])
@paginate(PageNumberPagination, page_size=30)
def notifications(request):
    return request.user.notifications.all()


@router.post("/notifications/read", response={204: None}, auth=auth, tags=["Notifications"])
def read_notifications(request):
    notification_services.mark_all_read(request.user)
    return Status(204, None)
