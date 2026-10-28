from django.urls import path

from . import views

app_name = "cart"

urlpatterns = [
    path("", views.detail, name="detail"),
    path("ajouter/<int:product_id>/", views.add, name="add"),
    path("modifier/<int:product_id>/", views.update, name="update"),
    path("retirer/<int:product_id>/", views.remove, name="remove"),
]
