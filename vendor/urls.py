from django.urls import path, include
from . import views
from accounts import views as accountViews

urlpatterns = [
    path("", accountViews.vendor_dashboard, name="vendor"),
    path("profile/", views.v_profile, name="v-profile"),
    path("shelve-builder/", views.shelve_builder, name="shelve-builder"),
    path(
        "shelve-builder/category/<int:pk>/",
        views.items_by_category,
        name="items-by-category",
    ),
    # Category CRUD
    path("shelve-builder/category/add/", views.add_category, name="add-category"),
    path(
        "shelve-builder/category/edit/<int:pk>/",
        views.edit_category,
        name="edit-category",
    ),
    path(
        "shelve-builder/category/delete/<int:pk>/",
        views.delete_category,
        name="delete-category",
    ),
    # FoodItem CRUD
    path("shelve-builder/item/add/", views.add_item, name="add-item"),
    path("shelve-builder/item/edit/<int:pk>/", views.edit_item, name="edit-item"),
    path("shelve-builder/item/delete/<int:pk>/", views.delete_item, name="delete-item"),
    # Opening Hour CRUD
    # path('opening-hours/', views.opening_hours, name='opening_hours'),
    # path('opening-hours/add/', views.add_opening_hours, name='add_opening_hours'),
    # path('opening-hours/remove/<int:pk>/', views.remove_opening_hours, name='remove_opening_hours'),
    #
    # path('order_detail/<int:order_number>/', views.order_detail, name='vendor_order_detail'),
    # path('my_orders/', views.my_orders, name='vendor_my_orders'),
]
