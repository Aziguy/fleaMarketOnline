from django.urls import path

from . import views

app_name = "accounts"

urlpatterns = [
    path("inscription/", views.signup, name="signup"),
    path("connexion/", views.LoginView.as_view(), name="login"),
    path("deconnexion/", views.LogoutView.as_view(), name="logout"),
    path("profil/", views.profile, name="profile"),
    path("mot-de-passe/", views.PasswordChangeView.as_view(), name="password_change"),
    path("mot-de-passe/oublie/", views.PasswordResetView.as_view(), name="password_reset"),
    path(
        "mot-de-passe/oublie/envoye/",
        views.PasswordResetDoneView.as_view(),
        name="password_reset_done",
    ),
    path(
        "mot-de-passe/reinitialiser/<uidb64>/<token>/",
        views.PasswordResetConfirmView.as_view(),
        name="password_reset_confirm",
    ),
]
