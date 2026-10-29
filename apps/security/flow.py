"""Connexion en deux étapes : mot de passe validé, puis second facteur."""

import time
from functools import wraps

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth import login as auth_login
from django.shortcuts import redirect
from django.urls import reverse

from . import devices, factors

PENDING = "mfa_pending"
CONFIRMED = "security_confirmed_at"
PENDING_SECONDS = 600
CONFIRM_SECONDS = 600
PASSWORD_BACKEND = "apps.accounts.backends.EmailOrPhoneBackend"


def needs_second_factor(request, user):
    return factors.has_second_factor(user) and not devices.is_trusted(request, user)


def start(request, user, next_url):
    request.session[PENDING] = {
        "user": user.pk,
        "backend": getattr(user, "backend", PASSWORD_BACKEND),
        "next": next_url,
        "at": time.time(),
        "fails": 0,
    }
    return redirect("security:verify")


def pending(request):
    data = request.session.get(PENDING)
    if not data or time.time() - data["at"] > PENDING_SECONDS:
        request.session.pop(PENDING, None)
        return None, None
    user = get_user_model().objects.filter(pk=data["user"], is_active=True).first()
    if user is None:
        request.session.pop(PENDING, None)
    return user, data


def register_failure(request):
    """Compte un code erroné ; renvoie True si la connexion en attente est annulée."""
    data = request.session.get(PENDING)
    if not data:
        return True
    data["fails"] += 1
    request.session[PENDING] = data
    if data["fails"] >= settings.LOGIN_MAX_ATTEMPTS:
        request.session.pop(PENDING, None)
        return True
    return False


def complete(request, user, next_url, *, backend=PASSWORD_BACKEND, trust=False, response=None):
    """Ouvre la session, enregistre l'appareil (cookie posé sur `response`) et redirige."""
    request.session.pop(PENDING, None)
    auth_login(request, user, backend=backend)
    request.session[CONFIRMED] = time.time()
    response = response or redirect(next_url)
    devices.on_login(request, user, response, trust=trust)
    return response


def recently_confirmed(request):
    return time.time() - request.session.get(CONFIRMED, 0) < CONFIRM_SECONDS


def recent_auth_required(view):
    """Exige une saisie récente du mot de passe pour modifier la sécurité du compte."""

    @wraps(view)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect(f"{reverse('accounts:login')}?next={request.path}")
        if not recently_confirmed(request):
            target = request.path if request.method == "GET" else reverse("security:index")
            return redirect(f"{reverse('security:confirm')}?next={target}")
        return view(request, *args, **kwargs)

    return wrapper
