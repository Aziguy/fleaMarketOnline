from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class Device(models.Model):
    """Navigateur reconnu par un cookie : alertes de connexion et appareil de confiance."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="devices"
    )
    key_hash = models.CharField(max_length=64, unique=True)
    label = models.CharField(_("appareil"), max_length=120)
    ip = models.GenericIPAddressField(_("adresse IP"), null=True, blank=True)
    session_key = models.CharField(max_length=40, blank=True)
    trusted_until = models.DateTimeField(_("de confiance jusqu'au"), null=True, blank=True)
    created_at = models.DateTimeField(_("première connexion"), auto_now_add=True)
    last_seen_at = models.DateTimeField(_("dernière connexion"), default=timezone.now)

    class Meta:
        ordering = ("-last_seen_at",)
        verbose_name = _("appareil")
        verbose_name_plural = _("appareils")

    def __str__(self):
        return self.label

    @property
    def is_trusted(self):
        return bool(self.trusted_until and self.trusted_until > timezone.now())


class TOTPDevice(models.Model):
    """Application d'authentification (codes à 6 chiffres, RFC 6238)."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="totp"
    )
    secret = models.TextField()
    last_step = models.BigIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("application d'authentification")
        verbose_name_plural = _("applications d'authentification")

    def __str__(self):
        return str(self.user)


class EmailFactor(models.Model):
    """Code de connexion envoyé par e-mail."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="email_factor"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("code par e-mail")
        verbose_name_plural = _("codes par e-mail")

    def __str__(self):
        return str(self.user)


class Passkey(models.Model):
    """Clé d'accès WebAuthn : empreinte, visage, code de l'appareil ou clé USB."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="passkeys"
    )
    name = models.CharField(_("nom"), max_length=80)
    credential_id = models.CharField(max_length=1400, unique=True)
    public_key = models.BinaryField()
    sign_count = models.PositiveBigIntegerField(default=0)
    transports = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(_("ajoutée le"), auto_now_add=True)
    last_used_at = models.DateTimeField(_("dernière utilisation"), null=True, blank=True)

    class Meta:
        ordering = ("created_at",)
        verbose_name = _("clé d'accès")
        verbose_name_plural = _("clés d'accès")

    def __str__(self):
        return self.name


class RecoveryCode(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="recovery_codes"
    )
    code_hash = models.CharField(max_length=64)
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = _("code de secours")
        verbose_name_plural = _("codes de secours")

    def __str__(self):
        return str(self.user)
