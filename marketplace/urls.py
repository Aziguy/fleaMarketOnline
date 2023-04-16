from django.urls import path
from . import views

urlpatterns = [
    path("", views.marketplace, name="marketplace"),
    path("<slug:vendor_slug>/", views.vendor_detail, name="vendor-detail"),
    # ADD TO CART
    path("add-to-cart/<int:item_id>/", views.add_to_cart, name="add-to-cart"),
    # DECREASE CART
    path("decrease-cart/<int:item_id>/", views.decrease_cart, name="decrease-cart"),
    # DELETE CART ITEM
    path("delete-cart/<int:cart_id>/", views.delete_cart, name="delete-cart"),
]
