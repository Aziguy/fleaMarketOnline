from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q
from django.utils.translation import gettext_lazy as _


class ReviewQuerySet(models.QuerySet):
    def published(self):
        return self.filter(is_published=True)


class Review(models.Model):
    """Avis d'un client ayant commandé ou réservé dans la boutique."""

    shop = models.ForeignKey("shops.Shop", on_delete=models.CASCADE, related_name="reviews")
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews"
    )
    rating = models.PositiveSmallIntegerField(
        _("note"), validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(_("commentaire"), max_length=1000, blank=True)
    reply = models.TextField(_("réponse de la boutique"), max_length=1000, blank=True)
    replied_at = models.DateTimeField(_("répondu le"), null=True, blank=True)
    is_published = models.BooleanField(_("publié"), default=True)
    created_at = models.DateTimeField(_("créé le"), auto_now_add=True)
    updated_at = models.DateTimeField(_("modifié le"), auto_now=True)

    objects = ReviewQuerySet.as_manager()

    class Meta:
        ordering = ("-created_at",)
        verbose_name = _("avis")
        verbose_name_plural = _("avis")
        constraints = [
            models.UniqueConstraint(fields=("shop", "customer"), name="unique_review_per_shop"),
            models.CheckConstraint(
                condition=Q(rating__gte=1, rating__lte=5), name="review_rating_1_5"
            ),
        ]

    def __str__(self):
        return f"{self.shop} · {self.rating}/5"

    @property
    def author_name(self):
        last = self.customer.last_name[:1]
        return f"{self.customer.first_name} {last}." if last else self.customer.first_name
