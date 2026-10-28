from django.urls import path

from . import views

app_name = "catalog"

urlpatterns = [
    path("<slug:shop_slug>/<slug:slug>/", views.product_detail, name="product"),
]
