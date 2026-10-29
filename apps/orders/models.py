import secrets

from django.conf import settings
from django.db import models
from django.urls import reverse
from django.utils.translation import gettext_lazy as _

from apps.catalog.models import Product
from apps.core.fields import MoneyField, PhoneField
from apps.shops.models import Shop

_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def new_reference(prefix):
    return f"{prefix}-" + "".join(secrets.choice(_ALPHABET) for _ in range(6))


def new_pickup_code():
    return f"{secrets.randbelow(10**6):06d}"


class PaymentMethod(models.TextChoices):
    CASH = "cash", _("Espèces")
    MTN_MOMO = "mtn_momo", _("MTN Mobile Money")
    ORANGE_MONEY = "orange_money", _("Orange Money")


class Fulfillment(models.TextChoices):
    PICKUP = "pickup", _("Retrait en boutique")
    DELIVERY = "delivery", _("Livraison")


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", _("En attente")
        CONFIRMED = "confirmed", _("Confirmée")
        READY = "ready", _("Prête au retrait")
        SHIPPED = "shipped", _("En livraison")
        COMPLETED = "completed", _("Remise et payée")
        CANCELLED = "cancelled", _("Annulée")

    OPEN_STATUSES = (Status.PENDING, Status.CONFIRMED, Status.READY, Status.SHIPPED)

    reference = models.CharField(_("référence"), max_length=12, unique=True, editable=False)
    shop = models.ForeignKey(Shop, on_delete=models.PROTECT, related_name="orders")
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="orders",
        verbose_name=_("client"),
    )
    status = models.CharField(_("statut"), max_length=10, choices=Status, default=Status.PENDING)
    fulfillment = models.CharField(_("mode de remise"), max_length=10, choices=Fulfillment)
    payment_method = models.CharField(_("paiement prévu"), max_length=15, choices=PaymentMethod)

    contact_name = models.CharField(_("nom du contact"), max_length=120)
    contact_phone = PhoneField(_("téléphone du contact"))
    delivery_address = models.CharField(_("adresse de livraison"), max_length=255, blank=True)
    delivery_landmark = models.CharField(_("point de repère"), max_length=160, blank=True)
    note = models.TextField(_("note pour la boutique"), blank=True)

    subtotal = MoneyField(_("sous-total"))
    delivery_fee = MoneyField(_("frais de livraison"), default=0)
    total = MoneyField(_("total"))

    pickup_code = models.CharField(_("code de retrait"), max_length=6, default=new_pickup_code)
    paid_with = models.CharField(_("payé par"), max_length=15, choices=PaymentMethod, blank=True)
    paid_at = models.DateTimeField(_("payée le"), null=True, blank=True)
    cancel_reason = models.CharField(_("motif d'annulation"), max_length=255, blank=True)

    created_at = models.DateTimeField(_("créée le"), auto_now_add=True)
    updated_at = models.DateTimeField(_("mise à jour le"), auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        verbose_name = _("commande")
        verbose_name_plural = _("commandes")
        indexes = [models.Index(fields=("shop", "status"))]

    def __str__(self):
        return self.reference

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = new_reference("CMD")
            while Order.objects.filter(reference=self.reference).exists():
                self.reference = new_reference("CMD")
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse("orders:detail", args=[self.reference])

    @property
    def is_open(self):
        return self.status in self.OPEN_STATUSES

    @property
    def is_pickup(self):
        return self.fulfillment == Fulfillment.PICKUP

    def next_statuses(self):
        S = self.Status
        flow: dict[str, list[str]] = {
            S.PENDING: [S.CONFIRMED, S.CANCELLED],
            S.CONFIRMED: [S.READY if self.is_pickup else S.SHIPPED, S.CANCELLED],
            S.READY: [S.COMPLETED, S.CANCELLED],
            S.SHIPPED: [S.COMPLETED, S.CANCELLED],
        }
        return flow.get(self.status, [])

    @property
    def customer_can_cancel(self):
        return self.status in (self.Status.PENDING, self.Status.CONFIRMED)

    @property
    def status_badge(self):
        badges: dict[str, str] = {
            self.Status.PENDING: "badge-yellow",
            self.Status.CONFIRMED: "badge-blue",
            self.Status.READY: "badge-green",
            self.Status.SHIPPED: "badge-blue",
            self.Status.COMPLETED: "badge-green",
            self.Status.CANCELLED: "badge-red",
        }
        return badges[self.status]


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, related_name="+")
    product_name = models.CharField(_("produit"), max_length=120)
    unit_price = MoneyField(_("prix unitaire"))
    quantity = models.PositiveIntegerField(_("quantité"))

    class Meta:
        verbose_name = _("article")
        verbose_name_plural = _("articles")

    def __str__(self):
        return f"{self.quantity} x {self.product_name}"

    @property
    def total(self):
        return self.unit_price * self.quantity
