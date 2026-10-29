"""Application installable : manifeste, service worker, page hors ligne."""

import hashlib

from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import render
from django.templatetags.static import static
from django.urls import reverse
from django.utils.translation import gettext as _
from django.views.decorators.cache import cache_control

# Préfixes jamais mis en cache par le service worker (données personnelles ou actions).
PRIVATE_PREFIXES = (
    "/admin/",
    "/api/",
    "/compte/",
    "/commandes/",
    "/espace-boutique/",
    "/i18n/",
    "/panier/",
    "/reservations/",
)
PRECACHE_STATIC = (
    "css/app.css",
    "js/app.js",
    "js/htmx.min.js",
    "img/logo-mark.svg",
    "img/placeholder.svg",
    "img/icons/icon-192.png",
)


def precache_urls():
    return [reverse("core:offline"), *(static(path) for path in PRECACHE_STATIC)]


def cache_version():
    digest = hashlib.sha256("|".join(precache_urls()).encode()).hexdigest()
    return digest[:12]


@cache_control(max_age=86400, public=True)
def manifest(request):
    data = {
        "name": settings.SITE_NAME,
        "short_name": "Mfoundi Mall",
        "description": _(
            "Toutes les boutiques du Mfoundi Mall en ligne : commandez, réservez et payez sur place."
        ),
        "lang": request.LANGUAGE_CODE,
        "start_url": "/?source=pwa",
        "scope": "/",
        "display": "standalone",
        "background_color": "#060d09",
        "theme_color": "#0a3d23",
        "categories": ["shopping", "food", "lifestyle"],
        "icons": [
            {"src": static("img/icons/icon-192.png"), "sizes": "192x192", "type": "image/png"},
            {"src": static("img/icons/icon-512.png"), "sizes": "512x512", "type": "image/png"},
            {
                "src": static("img/icons/maskable-512.png"),
                "sizes": "512x512",
                "type": "image/png",
                "purpose": "maskable",
            },
        ],
        "shortcuts": [
            {"name": _("Boutiques"), "url": reverse("shops:list")},
            {"name": _("Mon panier"), "url": reverse("cart:detail")},
            {"name": _("Mes commandes"), "url": reverse("orders:list")},
        ],
    }
    return JsonResponse(
        data, content_type="application/manifest+json", json_dumps_params={"ensure_ascii": False}
    )


@cache_control(no_cache=True)
def service_worker(request):
    response = render(
        request,
        "core/sw.js",
        {
            "version": cache_version(),
            "precache": precache_urls(),
            "offline_url": reverse("core:offline"),
            "private_prefixes": PRIVATE_PREFIXES,
        },
        content_type="application/javascript",
    )
    response["Service-Worker-Allowed"] = "/"
    return response


def offline(request):
    return render(request, "core/offline.html")
