from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class SecurityConfig(AppConfig):
    name = "apps.security"
    verbose_name = _("Sécurité")
