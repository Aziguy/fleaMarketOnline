from django.urls import path

from . import views

app_name = "orders"

urlpatterns = [
    path("", views.my_orders, name="list"),
    path("valider/<slug:shop_slug>/", views.checkout, name="checkout"),
    path("<str:reference>/", views.detail, name="detail"),
    path("<str:reference>/annuler/", views.cancel, name="cancel"),
]
