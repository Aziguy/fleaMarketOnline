import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

PREFIX = "mm_"


def _digest(key):
    return hashlib.sha256(key.encode()).hexdigest()


class ApiTokenManager(models.Manager["ApiToken"]):
    def issue(self, user, name=""):
        """Crée un jeton et renvoie (jeton, clé en clair). La clé n'est plus récupérable ensuite."""
        key = PREFIX + secrets.token_urlsafe(32)
        token = self.create(user=user, name=name[:60], prefix=key[:10], key_hash=_digest(key))
        return token, key

    def authenticate(self, key):
        if not key or not key.startswith(PREFIX):
            return None
        token = (
            self.select_related("user").filter(key_hash=_digest(key), user__is_active=True).first()
        )
        if token and (
            token.last_used_at is None or timezone.now() - token.last_used_at > token.TOUCH_EVERY
        ):
            token.last_used_at = timezone.now()
            token.save(update_fields=["last_used_at"])
        return token


class ApiToken(models.Model):
    TOUCH_EVERY = timedelta(minutes=5)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="api_tokens",
        verbose_name=_("utilisateur"),
    )
    name = models.CharField(_("nom"), max_length=60, blank=True)
    prefix = models.CharField(_("préfixe"), max_length=10, editable=False)
    key_hash = models.CharField(max_length=64, unique=True, editable=False)
    created_at = models.DateTimeField(_("créé le"), auto_now_add=True)
    last_used_at = models.DateTimeField(_("dernière utilisation"), null=True, blank=True)

    objects = ApiTokenManager()

    class Meta:
        ordering = ("-created_at",)
        verbose_name = _("jeton d'API")
        verbose_name_plural = _("jetons d'API")

    def __str__(self):
        return f"{self.prefix}… ({self.user})"
