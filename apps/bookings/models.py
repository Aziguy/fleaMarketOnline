from datetime import datetime, timedelta

from django.conf import settings
from django.db import models
from django.urls import reverse
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.catalog.models import Service
from apps.core.fields import PhoneField
from apps.orders.models import new_reference
from apps.shops.models import Shop


class Booking(models.Model):
    class Kind(models.TextChoices):
        APPOINTMENT = "appointment", _("Rendez-vous")
        TABLE = "table", _("Réservation de table")

    class Status(models.TextChoices):
        PENDING = "pending", _("En attente")
        CONFIRMED = "confirmed", _("Confirmée")
        DECLINED = "declined", _("Refusée")
        CANCELLED = "cancelled", _("Annulée")
        COMPLETED = "completed", _("Honorée")
        NO_SHOW = "no_show", _("Absent")

    reference = models.CharField(_("référence"), max_length=12, unique=True, editable=False)
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="bookings")
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bookings",
        verbose_name=_("client"),
    )
    kind = models.CharField(_("type"), max_length=12, choices=Kind)
    service = models.ForeignKey(
        Service, on_delete=models.SET_NULL, null=True, blank=True, verbose_name=_("prestation")
    )
    date = models.DateField(_("date"))
    time = models.TimeField(_("heure"))
    party_size = models.PositiveSmallIntegerField(_("nombre de personnes"), default=1)
    contact_phone = PhoneField(_("téléphone"))
    note = models.TextField(_("message"), blank=True)
    status = models.CharField(_("statut"), max_length=10, choices=Status, default=Status.PENDING)
    merchant_note = models.CharField(_("réponse de la boutique"), max_length=255, blank=True)
    created_at = models.DateTimeField(_("créée le"), auto_now_add=True)

    class Meta:
        ordering = ("date", "time")
        verbose_name = _("réservation")
        verbose_name_plural = _("réservations")

    def __str__(self):
        return self.reference

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = new_reference("RES")
            while Booking.objects.filter(reference=self.reference).exists():
                self.reference = new_reference("RES")
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse("bookings:detail", args=[self.reference])

    @property
    def starts_at(self):
        return timezone.make_aware(datetime.combine(self.date, self.time))

    @property
    def ends_at(self):
        minutes = self.service.duration_minutes if self.service else 90
        return self.starts_at + timedelta(minutes=minutes)

    @property
    def is_upcoming(self):
        return self.starts_at >= timezone.now()

    @property
    def customer_can_cancel(self):
        return self.status in (self.Status.PENDING, self.Status.CONFIRMED) and self.is_upcoming

    def next_statuses(self):
        S = self.Status
        return {
            S.PENDING: [S.CONFIRMED, S.DECLINED],
            S.CONFIRMED: [S.COMPLETED, S.NO_SHOW, S.CANCELLED],
        }.get(self.status, [])

    @property
    def status_badge(self):
        return {
            self.Status.PENDING: "badge-yellow",
            self.Status.CONFIRMED: "badge-green",
            self.Status.COMPLETED: "badge-green",
            self.Status.DECLINED: "badge-red",
            self.Status.CANCELLED: "badge-red",
            self.Status.NO_SHOW: "badge-gray",
        }[self.status]
