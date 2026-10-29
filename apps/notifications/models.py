from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class Notification(models.Model):
    class Kind(models.TextChoices):
        RESTOCK = "restock", _("Retour en stock")
        REVIEW = "review", _("Avis")
        REPLY = "reply", _("Réponse à un avis")
        SECURITY = "security", _("Sécurité")

    ICONS: dict[str, str] = {
        Kind.RESTOCK: "package-check",
        Kind.REVIEW: "star",
        Kind.REPLY: "message-circle",
        Kind.SECURITY: "shield-alert",
    }

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    kind = models.CharField(_("type"), max_length=10, choices=Kind)
    title = models.CharField(_("titre"), max_length=160)
    body = models.CharField(_("message"), max_length=300, blank=True)
    url = models.CharField(_("lien"), max_length=300, blank=True)
    read_at = models.DateTimeField(_("lue le"), null=True, blank=True)
    created_at = models.DateTimeField(_("créée le"), auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [models.Index(fields=("user", "read_at"))]
        verbose_name = _("notification")
        verbose_name_plural = _("notifications")

    def __str__(self):
        return self.title

    @property
    def icon(self):
        return self.ICONS.get(self.kind, "bell")
