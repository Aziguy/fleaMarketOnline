from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class FavoritesConfig(AppConfig):
    name = "apps.favorites"
    verbose_name = _("Favoris")

    def ready(self):
        from . import signals  # noqa: F401
