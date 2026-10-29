from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.utils.translation import gettext_lazy as _

from apps.api.api import api
from apps.core.observability import healthz

admin.site.site_header = _("Administration Mfoundi Mall")
admin.site.site_title = _("Mfoundi Mall")
admin.site.index_title = _("Gestion du mall")

urlpatterns = [
    path("healthz", healthz, name="healthz"),
    path("admin/", admin.site.urls),
    path("api/v1/", api.urls),
    path("i18n/", include("django.conf.urls.i18n")),
    path("", include("apps.core.urls")),
    path("compte/", include("apps.accounts.urls")),
    path("boutiques/", include("apps.shops.urls")),
    path("produits/", include("apps.catalog.urls")),
    path("panier/", include("apps.cart.urls")),
    path("commandes/", include("apps.orders.urls")),
    path("reservations/", include("apps.bookings.urls")),
    path("espace-boutique/", include("apps.dashboard.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
