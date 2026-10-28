from django.urls import path

from . import views

app_name = "bookings"

urlpatterns = [
    path("", views.my_bookings, name="list"),
    path("nouvelle/<slug:shop_slug>/", views.create, name="create"),
    path("<str:reference>/", views.detail, name="detail"),
    path("<str:reference>/annuler/", views.cancel, name="cancel"),
]
