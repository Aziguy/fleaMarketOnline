from django.urls import path

from . import pwa, views

app_name = "core"

urlpatterns = [
    path("", views.home, name="home"),
    path("recherche/", views.search, name="search"),
    path("recherche/palette/", views.palette, name="palette"),
    path("comment-ca-marche/", views.how_it_works, name="how_it_works"),
    path("commercants/", views.merchants, name="merchants"),
    path("hors-ligne/", pwa.offline, name="offline"),
    path("manifest.webmanifest", pwa.manifest, name="manifest"),
    path("sw.js", pwa.service_worker, name="service_worker"),
]
