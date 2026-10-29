"""Limitation des tentatives (mot de passe, codes) par identifiant et par adresse IP."""

from django.conf import settings
from django.core.cache import cache

from .crypto import digest


def client_ip(request):
    return request.META.get("REMOTE_ADDR", "") if request else ""


def _keys(scope, request, identifier):
    keys = [f"throttle:{scope}:ip:{digest(client_ip(request))}"]
    if identifier:
        keys.append(f"throttle:{scope}:id:{digest(str(identifier).lower())}")
    return keys


def is_locked(scope, request, identifier=""):
    limit = settings.LOGIN_MAX_ATTEMPTS
    counts = [cache.get(key, 0) for key in _keys(scope, request, identifier)]
    ip_count, *id_count = counts
    return ip_count >= limit * 4 or any(c >= limit for c in id_count)


def fail(scope, request, identifier=""):
    for key in _keys(scope, request, identifier):
        cache.add(key, 0, settings.LOGIN_LOCKOUT_SECONDS)
        try:
            cache.incr(key)
        except ValueError:
            cache.set(key, 1, settings.LOGIN_LOCKOUT_SECONDS)


def reset(scope, request, identifier=""):
    cache.delete_many(_keys(scope, request, identifier)[1:])
