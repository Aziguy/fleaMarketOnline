from django.urls import path, include
from . import views

urlpatterns = [
    # path('', views.myAccount),
    path('register-user/', views.registerUser, name='register-user'),
    path('register-vendor/', views.registerVendor, name='register-vendor'),
]