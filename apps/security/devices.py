"""Appareils reconnus : cookie longue durée, alerte de nouvelle connexion, confiance 30 jours."""

import re
from datetime import timedelta
from importlib import import_module

from django.conf import settings
from django.utils import timezone
from django.utils.translation import gettext as _
from django.utils.translation import override

from apps.notifications.models import Notification
from apps.notifications.services import notify

from .crypto import digest, token
from .models import Device
from .throttle import client_ip

COOKIE = "mm_device"
COOKIE_AGE = 2 * 365 * 24 * 3600
BROWSERS = (
    ("Edg/", "Edge"),
    ("OPR/", "Opera"),
    ("SamsungBrowser", "Samsung Internet"),
    ("Firefox/", "Firefox"),
    ("Chrome/", "Chrome"),
    ("Safari/", "Safari"),
)
SYSTEMS = (
    ("Android", "Android"),
    ("iPhone", "iPhone"),
    ("iPad", "iPad"),
    ("Windows", "Windows"),
    ("Mac OS X", "macOS"),
    ("CrOS", "ChromeOS"),
    ("Linux", "Linux"),
)


def describe(user_agent):
    browser = next((name for marker, name in BROWSERS if marker in user_agent), "")
    system = next((name for marker, name in SYSTEMS if marker in user_agent), "")
    if browser and system:
        return _("%(browser)s sur %(system)s") % {"browser": browser, "system": system}
    return browser or system or re.sub(r"\s+", " ", user_agent)[:60] or _("Appareil inconnu")


def current(request, user):
    key = request.COOKIES.get(COOKIE)
    if not key:
        return None
    return Device.objects.filter(user=user, key_hash=digest(key)).first()


def is_trusted(request, user):
    device = current(request, user)
    return bool(device and device.is_trusted)


def on_login(request, user, response, *, trust=False):
    """Enregistre l'appareil après connexion et prévient d'une connexion inconnue."""
    device = current(request, user)
    now = timezone.now()
    if device is None:
        key = token()
        known = user.devices.exists()
        device = Device(user=user, key_hash=digest(key))
        response.set_cookie(
            COOKIE,
            key,
            max_age=COOKIE_AGE,
            httponly=True,
            secure=settings.SESSION_COOKIE_SECURE,
            samesite="Lax",
        )
        if known:
            _alert(request, user)
    device.label = describe(request.META.get("HTTP_USER_AGENT", ""))
    device.ip = client_ip(request) or None
    device.session_key = request.session.session_key or ""
    device.last_seen_at = now
    if trust:
        device.trusted_until = now + timedelta(days=settings.MFA_TRUSTED_DAYS)
    device.save()
    return device


def _alert(request, user):
    from django.urls import reverse

    with override("fr"):
        title = _("Nouvelle connexion à votre compte")
        body = _(
            "%(device)s, adresse %(ip)s. Si ce n'est pas vous, changez votre mot de passe "
            "et déconnectez cet appareil depuis Sécurité du compte."
        ) % {
            "device": describe(request.META.get("HTTP_USER_AGENT", "")),
            "ip": client_ip(request) or "?",
        }
    notify(
        user, kind=Notification.Kind.SECURITY, title=title, body=body, url=reverse("security:index")
    )


def end_session(session_key):
    if session_key:
        import_module(settings.SESSION_ENGINE).SessionStore(session_key=session_key).delete()


def revoke(device):
    end_session(device.session_key)
    device.delete()
