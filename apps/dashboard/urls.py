from django.urls import path

from . import realtime, views

app_name = "dashboard"

urlpatterns = [
    path("", views.home, name="home"),
    path("flux/", realtime.events, name="events"),
    path("boutique/", views.switch_shop, name="switch_shop"),
    path("informations/", views.shop_settings, name="settings"),
    path("horaires/", views.opening_hours, name="hours"),
    path("rayons/", views.categories, name="categories"),
    path("rayons/<int:pk>/", views.category_edit, name="category_edit"),
    path("rayons/<int:pk>/supprimer/", views.category_delete, name="category_delete"),
    path("produits/", views.products, name="products"),
    path("produits/nouveau/", views.product_form, name="product_create"),
    path("produits/ia/description/", views.ai_description, name="ai_description"),
    path("produits/<int:pk>/", views.product_form, name="product_edit"),
    path("produits/<int:pk>/activer/", views.product_toggle, name="product_toggle"),
    path("produits/<int:pk>/supprimer/", views.product_delete, name="product_delete"),
    path("prestations/", views.services, name="services"),
    path("prestations/nouvelle/", views.service_form, name="service_create"),
    path("prestations/<int:pk>/", views.service_form, name="service_edit"),
    path("prestations/<int:pk>/supprimer/", views.service_delete, name="service_delete"),
    path("commandes/", views.orders, name="orders"),
    path("commandes/<str:reference>/", views.order_detail, name="order_detail"),
    path("commandes/<str:reference>/action/", views.order_action, name="order_action"),
    path("reservations/", views.bookings, name="bookings"),
    path("reservations/<str:reference>/action/", views.booking_action, name="booking_action"),
    path("avis/", views.reviews, name="reviews"),
    path("avis/<int:pk>/repondre/", views.review_reply, name="review_reply"),
]
