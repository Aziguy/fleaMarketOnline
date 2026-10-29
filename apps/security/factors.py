"""Seconds facteurs : application TOTP, code par e-mail, codes de secours."""

import secrets
import time

import pyotp
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Exists, OuterRef, Q
from django.utils import timezone
from django.utils.translation import gettext as _

from .crypto import decrypt, digest, encrypt
from .models import EmailFactor, Passkey, RecoveryCode, TOTPDevice

RECOVERY_COUNT = 10
EMAIL_CODE_SECONDS = 600


class Level:
    ESSENTIAL, REINFORCED, MAXIMUM = 1, 2, 3


def summary(user):
    """Méthodes actives et niveau de sécurité du compte."""
    totp = TOTPDevice.objects.filter(user=user).exists()
    passkeys = user.passkeys.count()
    email = EmailFactor.objects.filter(user=user).exists() and bool(user.email)
    recovery = user.recovery_codes.filter(used_at__isnull=True).count()
    strong = totp or passkeys > 0
    if strong and recovery:
        level = Level.MAXIMUM
    elif strong or email:
        level = Level.REINFORCED
    else:
        level = Level.ESSENTIAL
    return {
        "totp": totp,
        "passkeys": passkeys,
        "email": email,
        "recovery": recovery,
        "strong": strong,
        "enabled": strong or email,
        "level": level,
    }


def has_second_factor(user):
    """Une seule requête : appelée à chaque connexion et sur le tableau de bord."""
    factor = Q(Exists(TOTPDevice.objects.filter(user=OuterRef("pk")))) | Q(
        Exists(Passkey.objects.filter(user=OuterRef("pk")))
    )
    if user.email:
        factor |= Q(Exists(EmailFactor.objects.filter(user=OuterRef("pk"))))
    return get_user_model().objects.filter(pk=user.pk).filter(factor).exists()


def has_strong_factor(user):
    return TOTPDevice.objects.filter(user=user).exists() or user.passkeys.exists()


# Application d'authentification


def new_totp_secret():
    return pyotp.random_base32()


def totp_uri(user, secret):
    label = user.email or user.phone
    return pyotp.TOTP(secret).provisioning_uri(name=label, issuer_name=settings.SITE_NAME)


def _matching_step(secret, code, last_step=0):
    code = "".join(code.split())
    if not (code.isdigit() and len(code) == 6):
        return None
    totp = pyotp.TOTP(secret)
    now = int(time.time()) // totp.interval
    for step in (now, now - 1, now + 1):
        if step > last_step and secrets.compare_digest(totp.at(step * totp.interval), code):
            return step
    return None


def enable_totp(user, secret, code):
    step = _matching_step(secret, code)
    if step is None:
        return False
    TOTPDevice.objects.update_or_create(
        user=user, defaults={"secret": encrypt(secret), "last_step": step}
    )
    return True


def verify_totp(user, code):
    with transaction.atomic():
        device = TOTPDevice.objects.select_for_update().filter(user=user).first()
        if device is None:
            return False
        step = _matching_step(decrypt(device.secret), code, device.last_step)
        if step is None:
            return False
        device.last_step = step
        device.save(update_fields=["last_step"])
        return True


# Code par e-mail


def _email_key(user):
    return f"mfa:email:{user.pk}"


def send_email_code(user):
    """Envoie un code à 6 chiffres valable 10 minutes. Renvoie False si l'envoi est trop rapproché."""
    if not user.email or not cache.add(f"{_email_key(user)}:sent", 1, 60):
        return False
    code = f"{secrets.randbelow(10**6):06d}"
    cache.set(_email_key(user), digest(code), EMAIL_CODE_SECONDS)
    send_mail(
        _("Votre code de connexion %(site)s") % {"site": settings.SITE_NAME},
        _(
            "Votre code de connexion : %(code)s\n\nIl est valable 10 minutes. "
            "Ne le communiquez à personne, même à l'équipe du mall."
        )
        % {"code": code},
        None,
        [user.email],
    )
    return True


def verify_email_code(user, code):
    expected = cache.get(_email_key(user))
    code = "".join(code.split())
    if expected and secrets.compare_digest(expected, digest(code)):
        cache.delete(_email_key(user))
        return True
    return False


# Codes de secours


def _normalize(code):
    return "".join(ch for ch in code.upper() if ch.isalnum())


def generate_recovery_codes(user):
    """Remplace les codes de secours ; renvoie les codes en clair (affichés une seule fois)."""
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    codes = ["".join(secrets.choice(alphabet) for _ in range(10)) for _ in range(RECOVERY_COUNT)]
    with transaction.atomic():
        user.recovery_codes.all().delete()
        RecoveryCode.objects.bulk_create(
            RecoveryCode(user=user, code_hash=digest(code)) for code in codes
        )
    return [f"{c[:5]}-{c[5:]}" for c in codes]


def use_recovery_code(user, code):
    updated = user.recovery_codes.filter(
        code_hash=digest(_normalize(code)), used_at__isnull=True
    ).update(used_at=timezone.now())
    return bool(updated)


def drop_orphan_recovery_codes(user):
    """Sans méthode active, les codes de secours n'ont plus d'usage."""
    if not has_second_factor(user):
        user.recovery_codes.all().delete()


def verify_code(user, method, code):
    """Vérifie un code saisi selon la méthode choisie."""
    if method == "totp":
        return verify_totp(user, code)
    if method == "email":
        return verify_email_code(user, code)
    if method == "recovery":
        return use_recovery_code(user, code)
    return False


def disable_all(user):
    with transaction.atomic():
        TOTPDevice.objects.filter(user=user).delete()
        EmailFactor.objects.filter(user=user).delete()
        user.passkeys.all().delete()
        user.recovery_codes.all().delete()
