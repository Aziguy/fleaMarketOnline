from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils.translation import gettext_lazy as _


class Favorite(models.Model):
    """Boutique ou produit suivi par un client."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="favorites"
    )
    shop = models.ForeignKey(
        "shops.Shop", on_delete=models.CASCADE, null=True, blank=True, related_name="favorites"
    )
    product = models.ForeignKey(
        "catalog.Product",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="favorites",
    )
    created_at = models.DateTimeField(_("ajouté le"), auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        verbose_name = _("favori")
        verbose_name_plural = _("favoris")
        constraints = [
            models.CheckConstraint(
                condition=Q(shop__isnull=False, product__isnull=True)
                | Q(shop__isnull=True, product__isnull=False),
                name="favorite_shop_xor_product",
            ),
            models.UniqueConstraint(
                fields=("user", "shop"),
                condition=Q(shop__isnull=False),
                name="unique_favorite_shop",
            ),
            models.UniqueConstraint(
                fields=("user", "product"),
                condition=Q(product__isnull=False),
                name="unique_favorite_product",
            ),
        ]

    def __str__(self):
        return str(self.shop or self.product)
