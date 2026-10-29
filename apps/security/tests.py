import time
from unittest import mock

import pyotp
import pytest
from django.core import mail
from django.core.cache import cache
from django.urls import reverse

from apps.notifications.models import Notification
from conftest import PASSWORD

from . import factors, flow
from .crypto import decrypt
from .devices import COOKIE, describe
from .models import Device, Passkey, TOTPDevice

LOGIN = reverse("accounts:login")
VERIFY = reverse("security:verify")


def login(client, username="677111111", password=PASSWORD):
    return client.post(LOGIN, {"username": username, "password": password})


def logout(client):
    """Le client de test efface tous ses cookies à la déconnexion, pas un navigateur."""
    device = client.cookies.get(COOKIE)
    client.logout()
    if device:
        client.cookies[COOKIE] = device.value


def confirmed(client):
    session = client.session
    session[flow.CONFIRMED] = time.time()
    session.save()


def enable_totp(user):
    secret = pyotp.random_base32()
    assert factors.enable_totp(user, secret, pyotp.TOTP(secret).now())
    return pyotp.TOTP(secret)


def next_code(totp):
    return totp.at(time.time() + totp.interval)


def test_login_is_locked_after_repeated_failures(client, customer):
    for _ in range(5):
        login(client, password="mauvais")
    response = login(client)
    assert "Trop de tentatives" in response.content.decode()
    assert "_auth_user_id" not in client.session


def test_new_device_triggers_alert(client, customer):
    login(client)
    assert not Notification.objects.filter(kind="security").exists()
    client.logout()
    login(client)
    alert = Notification.objects.get(user=customer, kind="security")
    assert "Nouvelle connexion" in alert.title
    assert customer.devices.count() == 2


def test_known_device_does_not_alert(client, customer):
    login(client)
    logout(client)
    login(client)
    assert not Notification.objects.filter(kind="security").exists()
    assert customer.devices.count() == 1


def test_totp_login_flow_with_replay_protection(client, customer):
    totp = enable_totp(customer)
    assert login(client).url == VERIFY
    assert "_auth_user_id" not in client.session
    response = client.post(VERIFY, {"method": "totp", "code": "000000"})
    assert "Code incorrect" in response.content.decode()
    code = next_code(totp)
    assert client.post(VERIFY, {"method": "totp", "code": code}).status_code == 302
    assert client.session["_auth_user_id"] == str(customer.pk)
    client.logout()
    login(client)
    assert (
        "Code incorrect" in client.post(VERIFY, {"method": "totp", "code": code}).content.decode()
    )


def test_secret_is_encrypted(customer):
    enable_totp(customer)
    stored = TOTPDevice.objects.get(user=customer).secret
    assert len(decrypt(stored)) == 32 and decrypt(stored) not in stored


def test_too_many_wrong_codes_cancel_login(client, customer):
    enable_totp(customer)
    login(client)
    for _ in range(5):
        response = client.post(VERIFY, {"method": "totp", "code": "000000"})
    assert response.url == LOGIN
    assert flow.PENDING not in client.session


def test_trusted_device_skips_second_factor(client, customer):
    totp = enable_totp(customer)
    login(client)
    client.post(VERIFY, {"method": "totp", "code": next_code(totp), "trust": "1"})
    assert Device.objects.get(user=customer).is_trusted
    logout(client)
    assert login(client).url == reverse("core:home")


def test_recovery_code_is_single_use(client, customer):
    enable_totp(customer)
    codes = factors.generate_recovery_codes(customer)
    login(client)
    client.post(VERIFY, {"method": "recovery", "code": codes[0].lower()})
    assert client.session["_auth_user_id"] == str(customer.pk)
    client.logout()
    login(client)
    response = client.post(VERIFY, {"method": "recovery", "code": codes[0]})
    assert "Code incorrect" in response.content.decode()
    assert factors.summary(customer)["recovery"] == 9


def test_email_factor_setup_and_login(client, customer):
    customer.email = "awa@example.cm"
    customer.save()
    client.force_login(customer)
    url = reverse("security:email_setup")
    assert client.get(url).url.startswith(reverse("security:confirm"))
    client.post(reverse("security:confirm"), {"password": PASSWORD, "next": url})
    client.post(url, {"action": "send"})
    code = mail.outbox[-1].body.split(": ")[1][:6]
    response = client.post(url, {"code": code})
    assert response.url == reverse("security:recovery_codes")
    assert len(client.get(response.url).context["codes"]) == 10
    assert factors.summary(customer)["level"] == factors.Level.REINFORCED
    client.logout()
    cache.delete(f"mfa:email:{customer.pk}:sent")
    login(client)
    client.post(VERIFY, {"action": "send"})
    code = mail.outbox[-1].body.split(": ")[1][:6]
    client.post(VERIFY, {"method": "email", "code": code})
    assert client.session["_auth_user_id"] == str(customer.pk)


def test_totp_setup_page_and_maximum_level(client, customer):
    client.force_login(customer)
    confirmed(client)
    url = reverse("security:totp_setup")
    page = client.get(url)
    assert "<svg" in page.content.decode()
    secret = client.session["totp_secret"]
    client.post(url, {"code": pyotp.TOTP(secret).now()})
    summary = factors.summary(customer)
    assert (
        summary["totp"] and summary["recovery"] == 10 and summary["level"] == factors.Level.MAXIMUM
    )


def test_confirm_rejects_wrong_password(client, customer):
    client.force_login(customer)
    response = client.post(reverse("security:confirm"), {"password": "x"})
    assert response.context["form"].errors
    assert not flow.recently_confirmed(client)


def test_device_revoke_ends_its_session(client, customer):
    from django.test import Client

    other = Client()
    login(other)
    login(client)
    assert customer.devices.count() == 2
    first = Device.objects.get(session_key=other.session.session_key)
    client.post(reverse("security:device_revoke", args=[first.pk]))
    assert other.get(reverse("security:index")).status_code == 302
    client.post(reverse("security:logout_others"))
    assert customer.devices.count() == 1


def test_staff_needs_strong_factor_for_admin(client, customer):
    customer.is_staff = True
    customer.save()
    client.force_login(customer)
    assert client.get(reverse("admin:index")).url == reverse("security:index")
    enable_totp(customer)
    assert client.get(reverse("admin:index")).status_code == 200
    assert client.get("/admin/login/?next=/admin/").url == f"{LOGIN}?next=/admin/"


def test_passkey_registration_and_passwordless_login(client, customer):
    client.force_login(customer)
    confirmed(client)
    options = client.post(reverse("security:passkey_options")).json()
    assert options["rp"]["id"] == "testserver" and options["challenge"]
    verified = mock.Mock(credential_id=b"cred-1", credential_public_key=b"pk", sign_count=0)
    with mock.patch("apps.security.passkeys.verify_registration_response", return_value=verified):
        response = client.post(
            reverse("security:passkey_register"),
            {"credential": {"response": {"transports": ["internal"]}}, "name": "Téléphone"},
            content_type="application/json",
        )
    assert response.json()["redirect"] == reverse("security:recovery_codes")
    passkey = Passkey.objects.get(user=customer)
    assert passkey.name == "Téléphone" and passkey.transports == ["internal"]
    client.logout()

    client.post(reverse("security:passkey_login_options"))
    with mock.patch(
        "apps.security.passkeys.verify_authentication_response",
        return_value=mock.Mock(new_sign_count=3),
    ):
        response = client.post(
            reverse("security:passkey_login") + "?next=/favoris/",
            {"credential": {"id": passkey.credential_id}},
            content_type="application/json",
        )
    assert response.json()["redirect"] == "/favoris/"
    assert client.session["_auth_user_id"] == str(customer.pk)
    assert COOKIE in response.cookies
    passkey.refresh_from_db()
    assert passkey.sign_count == 3 and passkey.last_used_at


def test_passkey_login_rejects_unknown_credential(client, customer):
    client.post(reverse("security:passkey_login_options"))
    response = client.post(
        reverse("security:passkey_login"),
        {"credential": {"id": "x"}},
        content_type="application/json",
    )
    assert response.status_code == 400 and "_auth_user_id" not in client.session


def test_passkey_as_second_factor(client, customer):
    Passkey.objects.create(user=customer, name="Clé", credential_id="abc", public_key=b"pk")
    assert login(client).url == VERIFY
    client.post(reverse("security:verify_passkey_options"))
    with mock.patch(
        "apps.security.passkeys.verify_authentication_response",
        return_value=mock.Mock(new_sign_count=1),
    ):
        response = client.post(
            reverse("security:verify_passkey"),
            {"credential": {"id": "abc"}, "trust": "1"},
            content_type="application/json",
        )
    assert response.json()["redirect"] == reverse("core:home")
    assert Device.objects.get(user=customer).is_trusted


def test_api_token_requires_otp(client, customer):
    totp = enable_totp(customer)
    url = "/api/v1/auth/token"
    payload = {"username": "677111111", "password": PASSWORD}
    response = client.post(url, payload, content_type="application/json")
    assert response.status_code == 401 and "otp" in response.json()["detail"]
    payload["otp"] = next_code(totp)
    assert client.post(url, payload, content_type="application/json").status_code == 201


@pytest.mark.parametrize(
    ("agent", "label"),
    [
        (
            "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0 Mobile",
            "Chrome sur Android",
        ),
        (
            "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/130.0 Edg/130.0",
            "Edge sur Windows",
        ),
        (
            "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) AppleWebKit/605 Version/18 Safari/604",
            "Safari sur iPhone",
        ),
    ],
)
def test_describe_user_agent(agent, label):
    assert describe(agent) == label


def test_code_guessing_is_limited_across_logins(client, customer):
    totp = enable_totp(customer)
    for _ in range(5):
        login(client)
        client.post(VERIFY, {"method": "totp", "code": "000000"})
    login(client)
    response = client.post(VERIFY, {"method": "totp", "code": next_code(totp)})
    assert response.url == LOGIN and "_auth_user_id" not in client.session


def test_disabling_last_factor_drops_recovery_codes(client, customer):
    enable_totp(customer)
    factors.generate_recovery_codes(customer)
    client.force_login(customer)
    confirmed(client)
    client.post(reverse("security:totp_disable"))
    assert not customer.recovery_codes.exists()
    assert factors.summary(customer)["level"] == factors.Level.ESSENTIAL
