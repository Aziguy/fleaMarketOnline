from django.db import models
from django.urls import reverse
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _

from apps.core.fields import MoneyField
from apps.shops.models import Shop

MAX_EXTRA_IMAGES = 4


def _slug_for(instance, value):
    base = slugify(value)[:60] or "produit"
    slug, n = base, 2
    qs = type(instance).objects.filter(shop=instance.shop).exclude(pk=instance.pk)
    while qs.filter(slug=slug).exists():
        slug = f"{base}-{n}"
        n += 1
    return slug


class Category(models.Model):
    """Rayon propre à une boutique."""

    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="categories")
    name = models.CharField(_("nom"), max_length=60)
    slug = models.SlugField(max_length=70)
    position = models.PositiveSmallIntegerField(_("ordre"), default=0)

    class Meta:
        ordering = ("position", "name")
        unique_together = ("shop", "slug")
        verbose_name = _("rayon")
        verbose_name_plural = _("rayons")

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = _slug_for(self, self.name)
        super().save(*args, **kwargs)


class ProductQuerySet(models.QuerySet):
    def public(self):
        return self.filter(is_active=True, shop__status=Shop.Status.APPROVED)


class Product(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="products")
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
        verbose_name=_("rayon"),
    )
    name = models.CharField(_("nom"), max_length=120)
    slug = models.SlugField(max_length=70)
    description = models.TextField(_("description"), blank=True)
    price = MoneyField(_("prix (FCFA)"))
    compare_at_price = MoneyField(
        _("ancien prix (FCFA)"),
        null=True,
        blank=True,
        help_text=_("Affiché barré pour une promotion."),
    )
    stock = models.PositiveIntegerField(
        _("stock"), null=True, blank=True, help_text=_("Laisser vide si le stock n'est pas suivi.")
    )
    image = models.ImageField(_("photo principale"), upload_to="products/", blank=True)
    is_active = models.BooleanField(_("en ligne"), default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = ProductQuerySet.as_manager()

    class Meta:
        ordering = ("-created_at",)
        unique_together = ("shop", "slug")
        verbose_name = _("produit")
        verbose_name_plural = _("produits")

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = _slug_for(self, self.name)
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse("catalog:product", args=[self.shop.slug, self.slug])

    @property
    def in_stock(self):
        return self.stock is None or self.stock > 0

    @property
    def is_available(self):
        return self.is_active and self.in_stock and self.shop.is_public

    @property
    def discount_percent(self):
        if self.compare_at_price and self.compare_at_price > self.price:
            return round(100 * (self.compare_at_price - self.price) / self.compare_at_price)
        return 0

    def max_quantity(self, limit=50):
        return limit if self.stock is None else min(self.stock, limit)


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(_("photo"), upload_to="products/")
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ("position", "id")
        verbose_name = _("photo")
        verbose_name_plural = _("photos")

    def __str__(self):
        return f"{self.product} #{self.position}"


class Service(models.Model):
    """Prestation réservable (coupe, soin, table, etc.)."""

    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="services")
    name = models.CharField(_("nom"), max_length=120)
    description = models.TextField(_("description"), blank=True)
    price = MoneyField(_("prix (FCFA)"), null=True, blank=True, help_text=_("Vide = sur devis."))
    duration_minutes = models.PositiveSmallIntegerField(_("durée (minutes)"), default=30)
    is_active = models.BooleanField(_("en ligne"), default=True)
    position = models.PositiveSmallIntegerField(_("ordre"), default=0)

    class Meta:
        ordering = ("position", "name")
        verbose_name = _("prestation")
        verbose_name_plural = _("prestations")

    def __str__(self):
        return self.name
