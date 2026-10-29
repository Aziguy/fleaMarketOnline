"""Limitation des tentatives (mot de passe, codes) par identifiant et par adresse IP."""

from django.conf import settings
from django.core.cache import cache

from .crypto import digest


def client_ip(request):
    """Adresse du visiteur ; derrière N proxys de confiance, lue dans X-Forwarded-For."""
    if request is None:
        return ""
    count = settings.TRUSTED_PROXY_COUNT
    forwarded = [
        ip.strip() for ip in request.META.get("HTTP_X_FORWARDED_FOR", "").split(",") if ip.strip()
    ]
    if count and len(forwarded) >= count:
        return forwarded[-count]
    return request.META.get("REMOTE_ADDR", "")


def _keys(scope, request, identifier):
    keys = [f"throttle:{scope}:ip:{digest(client_ip(request))}"]
    if identifier:
        keys.append(f"throttle:{scope}:id:{digest(str(identifier).lower())}")
    return keys


def is_locked(scope, request, identifier=""):
    limit = settings.LOGIN_MAX_ATTEMPTS
    counts = [cache.get(key, 0) for key in _keys(scope, request, identifier)]
    ip_count, *id_count = counts
    return ip_count >= settings.LOGIN_MAX_ATTEMPTS_PER_IP or any(c >= limit for c in id_count)


def fail(scope, request, identifier=""):
    for key in _keys(scope, request, identifier):
        cache.add(key, 0, settings.LOGIN_LOCKOUT_SECONDS)
        try:
            cache.incr(key)
        except ValueError:
            cache.set(key, 1, settings.LOGIN_LOCKOUT_SECONDS)


def reset(scope, request, identifier=""):
    cache.delete_many(_keys(scope, request, identifier)[1:])
