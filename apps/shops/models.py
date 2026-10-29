from django.conf import settings
from django.db import models
from django.urls import reverse
from django.utils import timezone
from django.utils.text import slugify
from django.utils.translation import get_language
from django.utils.translation import gettext_lazy as _

from apps.core.fields import MoneyField, PhoneField
from apps.core.images import cleanup_files


def unique_slug(instance, value, field="slug"):
    base = slugify(value)[:50] or "item"
    slug, n = base, 2
    model = type(instance)
    while model.objects.filter(**{field: slug}).exclude(pk=instance.pk).exists():
        slug = f"{base}-{n}"
        n += 1
    return slug


class ShopType(models.Model):
    """Famille de boutique et fonctionnalités associées."""

    name = models.CharField(_("nom"), max_length=60)
    name_en = models.CharField(_("nom (anglais)"), max_length=60, blank=True)
    slug = models.SlugField(unique=True)
    icon = models.CharField(_("icône"), max_length=40, default="store", help_text=_("Icône Lucide"))
    sells_products = models.BooleanField(_("vend des produits"), default=True)
    takes_appointments = models.BooleanField(_("prend des rendez-vous"), default=False)
    takes_table_bookings = models.BooleanField(_("réserve des tables"), default=False)
    position = models.PositiveSmallIntegerField(_("ordre"), default=0)

    class Meta:
        ordering = ("position", "name")
        verbose_name = _("type de boutique")
        verbose_name_plural = _("types de boutique")

    def __str__(self):
        return self.label

    @property
    def label(self):
        if get_language() == "en" and self.name_en:
            return self.name_en
        return self.name


class ShopQuerySet(models.QuerySet):
    def public(self):
        return self.filter(status=Shop.Status.APPROVED)


@cleanup_files
class Shop(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", _("En attente de validation")
        APPROVED = "approved", _("Validée")
        SUSPENDED = "suspended", _("Suspendue")

    class Level(models.TextChoices):
        BASEMENT = "b1", _("Sous-sol")
        GROUND = "rdc", _("Rez-de-chaussée")
        FIRST = "1", _("1er étage")
        SECOND = "2", _("2e étage")
        THIRD = "3", _("3e étage")
        OUTSIDE = "ext", _("Extérieur")

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="shops",
        verbose_name=_("propriétaire"),
    )
    shop_type = models.ForeignKey(
        ShopType, on_delete=models.PROTECT, related_name="shops", verbose_name=_("type")
    )
    name = models.CharField(_("nom de la boutique"), max_length=80)
    slug = models.SlugField(unique=True, max_length=60)
    tagline = models.CharField(_("slogan"), max_length=120, blank=True)
    description = models.TextField(_("description"), blank=True)
    logo = models.ImageField(_("logo"), upload_to="shops/logos/", blank=True)
    banner = models.ImageField(_("bannière"), upload_to="shops/banners/", blank=True)

    level = models.CharField(_("niveau"), max_length=4, choices=Level, default=Level.GROUND)
    unit = models.CharField(
        _("numéro de local"), max_length=20, blank=True, help_text=_("Ex. : B12")
    )

    phone = PhoneField(_("téléphone"))
    whatsapp = PhoneField(_("WhatsApp"), blank=True)
    email = models.EmailField(_("e-mail"), blank=True)

    accepts_cash = models.BooleanField(_("espèces"), default=True)
    mtn_momo_number = PhoneField(_("numéro MTN Mobile Money"), blank=True)
    orange_money_number = PhoneField(_("numéro Orange Money"), blank=True)

    offers_pickup = models.BooleanField(_("retrait en boutique"), default=True)
    offers_delivery = models.BooleanField(_("livraison"), default=False)
    delivery_fee = MoneyField(_("frais de livraison (FCFA)"), default=0)
    delivery_area = models.CharField(
        _("zone de livraison"), max_length=160, blank=True, help_text=_("Ex. : Yaoundé centre")
    )

    status = models.CharField(_("statut"), max_length=10, choices=Status, default=Status.PENDING)
    is_featured = models.BooleanField(_("mise en avant"), default=False)
    created_at = models.DateTimeField(_("créée le"), auto_now_add=True)
    updated_at = models.DateTimeField(_("modifiée le"), auto_now=True)

    objects = ShopQuerySet.as_manager()

    class Meta:
        ordering = ("name",)
        verbose_name = _("boutique")
        verbose_name_plural = _("boutiques")

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slug(self, self.name)
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse("shops:detail", args=[self.slug])

    @property
    def is_public(self):
        return self.status == self.Status.APPROVED

    @property
    def location_label(self):
        parts = [self.get_level_display()]
        if self.unit:
            parts.append(_("local %(unit)s") % {"unit": self.unit})
        return ", ".join(str(p) for p in parts)

    @property
    def contact_whatsapp(self):
        return self.whatsapp or self.phone

    def payment_methods(self):
        from apps.orders.models import PaymentMethod

        methods = []
        if self.accepts_cash:
            methods.append(PaymentMethod.CASH)
        if self.mtn_momo_number:
            methods.append(PaymentMethod.MTN_MOMO)
        if self.orange_money_number:
            methods.append(PaymentMethod.ORANGE_MONEY)
        return methods

    def fulfillment_methods(self):
        from apps.orders.models import Fulfillment

        methods = []
        if self.offers_pickup:
            methods.append(Fulfillment.PICKUP)
        if self.offers_delivery:
            methods.append(Fulfillment.DELIVERY)
        return methods

    def hours_for(self, weekday):
        return [h for h in self.opening_hours.all() if h.weekday == weekday]

    def is_open_at(self, moment):
        moment = timezone.localtime(moment)
        slots = self.hours_for(moment.weekday())
        if not slots:
            return None
        t = moment.time()
        return any(not s.closed and s.opens <= t < s.closes for s in slots)

    def is_open_now(self):
        return self.is_open_at(timezone.now())


class OpeningHour(models.Model):
    class Weekday(models.IntegerChoices):
        MONDAY = 0, _("Lundi")
        TUESDAY = 1, _("Mardi")
        WEDNESDAY = 2, _("Mercredi")
        THURSDAY = 3, _("Jeudi")
        FRIDAY = 4, _("Vendredi")
        SATURDAY = 5, _("Samedi")
        SUNDAY = 6, _("Dimanche")

    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="opening_hours")
    weekday = models.PositiveSmallIntegerField(_("jour"), choices=Weekday)
    opens = models.TimeField(_("ouverture"), null=True, blank=True)
    closes = models.TimeField(_("fermeture"), null=True, blank=True)
    closed = models.BooleanField(_("fermé"), default=False)

    class Meta:
        ordering = ("weekday", "opens")
        unique_together = ("shop", "weekday")
        verbose_name = _("horaire")
        verbose_name_plural = _("horaires")

    def __str__(self):
        return self.get_weekday_display()

    def clean(self):
        from django.core.exceptions import ValidationError

        if not self.closed:
            if not self.opens or not self.closes:
                raise ValidationError(_("Indiquez les heures d'ouverture et de fermeture."))
            if self.opens >= self.closes:
                raise ValidationError(_("La fermeture doit être après l'ouverture."))
