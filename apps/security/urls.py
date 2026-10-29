from django.urls import path

from . import views

app_name = "security"

urlpatterns = [
    path("", views.index, name="index"),
    path("confirmer/", views.confirm, name="confirm"),
    path("application/", views.totp_setup, name="totp_setup"),
    path("application/desactiver/", views.totp_disable, name="totp_disable"),
    path("e-mail/", views.email_setup, name="email_setup"),
    path("e-mail/desactiver/", views.email_disable, name="email_disable"),
    path("cles/", views.passkey_setup, name="passkey_setup"),
    path("cles/options/", views.passkey_options, name="passkey_options"),
    path("cles/enregistrer/", views.passkey_register, name="passkey_register"),
    path("cles/<int:pk>/supprimer/", views.passkey_delete, name="passkey_delete"),
    path("codes-de-secours/", views.recovery_codes, name="recovery_codes"),
    path("codes-de-secours/regenerer/", views.recovery_regenerate, name="recovery_regenerate"),
    path("appareils/<int:pk>/deconnecter/", views.device_revoke, name="device_revoke"),
    path("appareils/<int:pk>/oublier/", views.device_untrust, name="device_untrust"),
    path("appareils/deconnecter-autres/", views.devices_logout_others, name="logout_others"),
    path("verification/", views.verify, name="verify"),
    path("verification/cle/options/", views.verify_passkey_options, name="verify_passkey_options"),
    path("verification/cle/", views.verify_passkey, name="verify_passkey"),
    path("connexion-cle/options/", views.passkey_login_options, name="passkey_login_options"),
    path("connexion-cle/", views.passkey_login, name="passkey_login"),
]
