from django.urls import path

from . import views

app_name = "core"

urlpatterns = [
    path("", views.home, name="home"),
    path("recherche/", views.search, name="search"),
    path("comment-ca-marche/", views.how_it_works, name="how_it_works"),
    path("commercants/", views.merchants, name="merchants"),
]
