from django.utils.translation import gettext as _
from django.utils.translation import override

from apps.notifications.models import Notification
from apps.notifications.services import notify

from .models import Favorite


def toggle(user, *, shop=None, product=None):
    """Ajoute ou retire un favori ; renvoie True s'il est désormais suivi."""
    lookup = {"shop": shop} if shop else {"product": product}
    deleted, _rows = Favorite.objects.filter(user=user, **lookup).delete()
    if deleted:
        return False
    Favorite.objects.create(user=user, **lookup)
    return True


def ids(user):
    """Identifiants des boutiques et produits suivis par l'utilisateur."""
    if not user.is_authenticated:
        return {"shops": set(), "products": set()}
    rows = Favorite.objects.filter(user=user).values_list("shop_id", "product_id")
    return {
        "shops": {shop for shop, _product in rows if shop},
        "products": {product for _shop, product in rows if product},
    }


def notify_restock(product):
    """Prévient les clients qui suivent un produit revenu en stock."""
    with override("fr"):
        title = _("%(product)s est de nouveau disponible") % {"product": product.name}
        body = _("Chez %(shop)s, %(location)s.") % {
            "shop": product.shop.name,
            "location": product.shop.location_label,
        }
    for favorite in product.favorites.select_related("user"):
        notify(
            favorite.user,
            kind=Notification.Kind.RESTOCK,
            title=title,
            body=body,
            url=product.get_absolute_url(),
        )
