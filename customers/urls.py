from django.urls import path
from accounts import views as AccountViews
from . import views


urlpatterns = [
    path("", AccountViews.cust_dashboard, name="customer"),
    path("profile/", views.c_profile, name="c-profile"),
    path("my-orders/", views.my_orders, name="customer-my-orders"),
    path("order-detail/<int:order_number>/", views.order_detail, name="order-detail"),
]
