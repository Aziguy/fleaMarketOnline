from django.urls import path

from . import views

app_name = "favorites"

urlpatterns = [
    path("", views.favorite_list, name="list"),
    path("boutique/<int:pk>/", views.toggle_shop, name="toggle_shop"),
    path("produit/<int:pk>/", views.toggle_product, name="toggle_product"),
]
