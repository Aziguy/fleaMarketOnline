"""Clés d'accès (WebAuthn) : enregistrement et vérification."""

import json

from django.conf import settings
from django.utils import timezone
from webauthn import (
    base64url_to_bytes,
    generate_authentication_options,
    generate_registration_options,
    options_to_json,
    verify_authentication_response,
    verify_registration_response,
)
from webauthn.helpers import bytes_to_base64url
from webauthn.helpers.exceptions import InvalidAuthenticationResponse, InvalidRegistrationResponse
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    PublicKeyCredentialDescriptor,
    ResidentKeyRequirement,
    UserVerificationRequirement,
)

from .models import Passkey

SESSION_KEY = "webauthn_challenge"


class PasskeyError(Exception):
    pass


def rp_id(request):
    return settings.WEBAUTHN_RP_ID or request.get_host().split(":")[0]


def origin(request):
    return f"{request.scheme}://{request.get_host()}"


def _remember(request, challenge, purpose):
    request.session[SESSION_KEY] = {"challenge": bytes_to_base64url(challenge), "for": purpose}


def _challenge(request, purpose):
    data = request.session.pop(SESSION_KEY, None)
    if not data or data.get("for") != purpose:
        raise PasskeyError("challenge")
    return base64url_to_bytes(data["challenge"])


def registration_options(request, user):
    options = generate_registration_options(
        rp_id=rp_id(request),
        rp_name=settings.SITE_NAME,
        user_id=str(user.pk).encode(),
        user_name=user.email or user.phone,
        user_display_name=user.get_full_name() or user.first_name,
        authenticator_selection=AuthenticatorSelectionCriteria(
            resident_key=ResidentKeyRequirement.PREFERRED,
            user_verification=UserVerificationRequirement.PREFERRED,
        ),
        exclude_credentials=[
            PublicKeyCredentialDescriptor(id=base64url_to_bytes(p.credential_id))
            for p in user.passkeys.all()
        ],
    )
    _remember(request, options.challenge, "register")
    return json.loads(options_to_json(options))


def register(request, user, credential, name):
    try:
        verified = verify_registration_response(
            credential=credential,
            expected_challenge=_challenge(request, "register"),
            expected_rp_id=rp_id(request),
            expected_origin=origin(request),
        )
    except (InvalidRegistrationResponse, ValueError, KeyError, TypeError) as exc:
        raise PasskeyError(str(exc)) from exc
    return Passkey.objects.create(
        user=user,
        name=name[:80],
        credential_id=bytes_to_base64url(verified.credential_id),
        public_key=verified.credential_public_key,
        sign_count=verified.sign_count,
        transports=credential.get("response", {}).get("transports", []) or [],
    )


def authentication_options(request, user=None):
    """Sans utilisateur : connexion sans mot de passe (clé découvrable, vérification requise)."""
    allow = (
        [
            PublicKeyCredentialDescriptor(id=base64url_to_bytes(p.credential_id))
            for p in user.passkeys.all()
        ]
        if user
        else None
    )
    options = generate_authentication_options(
        rp_id=rp_id(request),
        allow_credentials=allow,
        user_verification=(
            UserVerificationRequirement.PREFERRED if user else UserVerificationRequirement.REQUIRED
        ),
    )
    _remember(request, options.challenge, "login" if user is None else "verify")
    return json.loads(options_to_json(options))


def authenticate(request, credential, user=None):
    """Vérifie une assertion ; renvoie la clé utilisée."""
    purpose = "login" if user is None else "verify"
    challenge = _challenge(request, purpose)
    passkeys = Passkey.objects.select_related("user")
    if user is not None:
        passkeys = passkeys.filter(user=user)
    passkey = passkeys.filter(credential_id=credential.get("id", "")).first()
    if passkey is None or not passkey.user.is_active:
        raise PasskeyError("unknown")
    try:
        verified = verify_authentication_response(
            credential=credential,
            expected_challenge=challenge,
            expected_rp_id=rp_id(request),
            expected_origin=origin(request),
            credential_public_key=bytes(passkey.public_key),
            credential_current_sign_count=passkey.sign_count,
            require_user_verification=user is None,
        )
    except (InvalidAuthenticationResponse, ValueError, KeyError, TypeError) as exc:
        raise PasskeyError(str(exc)) from exc
    passkey.sign_count = verified.new_sign_count
    passkey.last_used_at = timezone.now()
    passkey.save(update_fields=["sign_count", "last_used_at"])
    return passkey
