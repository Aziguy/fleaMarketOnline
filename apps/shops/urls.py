from django.urls import path

from . import views

app_name = "shops"

urlpatterns = [
    path("", views.shop_list, name="list"),
    path("ouvrir/", views.open_shop, name="open"),
    path("<slug:slug>/", views.shop_detail, name="detail"),
]
