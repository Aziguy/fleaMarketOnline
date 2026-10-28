import pytest
from django.urls import reverse

from apps.accounts.models import User
from conftest import PASSWORD


@pytest.mark.django_db
def test_signup_normalizes_phone_and_logs_in(client):
    response = client.post(
        reverse("accounts:signup"),
        {
            "first_name": "Awa",
            "last_name": "Mbarga",
            "phone": "6 77 11 22 33",
            "email": "",
            "password1": PASSWORD,
            "password2": PASSWORD,
        },
    )
    assert response.status_code == 302
    user = User.objects.get()
    assert user.phone == "+237677112233"
    assert user.email is None
    assert client.session["_auth_user_id"] == str(user.pk)


def test_signup_rejects_duplicate_phone(client, customer):
    response = client.post(
        reverse("accounts:signup"),
        {"first_name": "X", "phone": "677111111", "password1": PASSWORD, "password2": PASSWORD},
    )
    assert response.status_code == 200
    assert "phone" in response.context["form"].errors


@pytest.mark.parametrize("identifier", ["677111111", "+237 6 77 11 11 11", "awa@example.cm"])
def test_login_with_phone_or_email(client, customer, identifier):
    customer.email = "awa@example.cm"
    customer.save()
    response = client.post(
        reverse("accounts:login"), {"username": identifier, "password": PASSWORD}
    )
    assert response.status_code == 302


def test_login_rejects_wrong_password(client, customer):
    response = client.post(reverse("accounts:login"), {"username": "677111111", "password": "x"})
    assert response.status_code == 200


def test_profile_requires_login(client):
    response = client.get(reverse("accounts:profile"))
    assert response.status_code == 302
