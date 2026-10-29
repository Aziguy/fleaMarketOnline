import json
import time

import segno
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils.http import url_has_allowed_host_and_scheme
from django.utils.safestring import mark_safe
from django.utils.translation import gettext as _
from django.views.decorators.http import require_POST

from . import devices, factors, flow, passkeys, throttle
from .forms import CodeForm, ConfirmPasswordForm
from .models import EmailFactor, TOTPDevice

RECOVERY_SESSION = "recovery_codes_display"
TOTP_SESSION = "totp_secret"


def _safe_next(request, default):
    target = request.POST.get("next") or request.GET.get("next")
    if target and url_has_allowed_host_and_scheme(target, {request.get_host()}):
        return target
    return default


def _json_body(request):
    try:
        return json.loads(request.body or b"{}")
    except ValueError:
        return {}


def _after_first_factor(request, user):
    """Génère les codes de secours à l'activation du premier facteur."""
    if not user.recovery_codes.exists():
        request.session[RECOVERY_SESSION] = factors.generate_recovery_codes(user)
        return redirect("security:recovery_codes")
    return redirect("security:index")


# Page « Sécurité du compte »


@login_required
def index(request):
    current = devices.current(request, request.user)
    return render(
        request,
        "security/index.html",
        {
            "summary": factors.summary(request.user),
            "devices": request.user.devices.all(),
            "current_device": current,
            "passkeys": request.user.passkeys.all(),
        },
    )


@login_required
def confirm(request):
    form = ConfirmPasswordForm(request.POST or None, user=request.user)
    if request.method == "POST":
        if throttle.is_locked("confirm", request, request.user.pk):
            form.add_error(None, _("Trop de tentatives. Réessayez dans 15 minutes."))
        elif form.is_valid():
            request.session[flow.CONFIRMED] = time.time()
            return redirect(_safe_next(request, reverse("security:index")))
        else:
            throttle.fail("confirm", request, request.user.pk)
    return render(
        request,
        "security/confirm.html",
        {"form": form, "next": _safe_next(request, reverse("security:index"))},
    )


# Application d'authentification


@flow.recent_auth_required
def totp_setup(request):
    secret = request.session.get(TOTP_SESSION) or factors.new_totp_secret()
    request.session[TOTP_SESSION] = secret
    form = CodeForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        if factors.enable_totp(request.user, secret, form.cleaned_data["code"]):
            request.session.pop(TOTP_SESSION, None)
            messages.success(request, _("Application d'authentification activée."))
            return _after_first_factor(request, request.user)
        form.add_error("code", _("Code incorrect. Vérifiez l'heure de votre téléphone."))
    uri = factors.totp_uri(request.user, secret)
    return render(
        request,
        "security/totp_setup.html",
        {
            "form": form,
            "qr_svg": mark_safe(
                segno.make(uri, error="m").svg_inline(
                    scale=1, border=2, omitsize=True, dark="#052e16", light="#ffffff"
                )
            ),
            "secret": " ".join(secret[i : i + 4] for i in range(0, len(secret), 4)),
        },
    )


@require_POST
@flow.recent_auth_required
def totp_disable(request):
    TOTPDevice.objects.filter(user=request.user).delete()
    messages.success(request, _("Application d'authentification désactivée."))
    return redirect("security:index")


# Code par e-mail


@flow.recent_auth_required
def email_setup(request):
    user = request.user
    form = CodeForm(request.POST or None)
    if not user.email:
        messages.info(request, _("Ajoutez d'abord une adresse e-mail à votre profil."))
        return redirect(f"{reverse('accounts:profile')}")
    if request.method == "POST":
        if request.POST.get("action") == "send":
            if factors.send_email_code(user):
                messages.success(request, _("Code envoyé à %(email)s.") % {"email": user.email})
            else:
                messages.info(request, _("Patientez une minute avant de demander un nouveau code."))
            return redirect("security:email_setup")
        if form.is_valid():
            if factors.verify_email_code(user, form.cleaned_data["code"]):
                EmailFactor.objects.get_or_create(user=user)
                messages.success(request, _("Code par e-mail activé."))
                return _after_first_factor(request, user)
            form.add_error("code", _("Code incorrect ou expiré."))
    return render(request, "security/email_setup.html", {"form": form})


@require_POST
@flow.recent_auth_required
def email_disable(request):
    EmailFactor.objects.filter(user=request.user).delete()
    messages.success(request, _("Code par e-mail désactivé."))
    return redirect("security:index")


# Clés d'accès


@flow.recent_auth_required
def passkey_setup(request):
    suggestion = devices.describe(request.META.get("HTTP_USER_AGENT", ""))
    return render(request, "security/passkey_setup.html", {"suggestion": suggestion})


@require_POST
@flow.recent_auth_required
def passkey_options(request):
    return JsonResponse(passkeys.registration_options(request, request.user))


@require_POST
@flow.recent_auth_required
def passkey_register(request):
    data = _json_body(request)
    name = (data.get("name") or "").strip() or devices.describe(
        request.META.get("HTTP_USER_AGENT", "")
    )
    try:
        passkeys.register(request, request.user, data.get("credential") or {}, name)
    except passkeys.PasskeyError:
        return JsonResponse({"error": _("La clé d'accès n'a pas pu être enregistrée.")}, status=400)
    messages.success(request, _("Clé d'accès ajoutée."))
    first = request.user.passkeys.count() == 1 and not request.user.recovery_codes.exists()
    if first:
        request.session[RECOVERY_SESSION] = factors.generate_recovery_codes(request.user)
        return JsonResponse({"redirect": reverse("security:recovery_codes")})
    return JsonResponse({"redirect": reverse("security:index")})


@require_POST
@flow.recent_auth_required
def passkey_delete(request, pk):
    get_object_or_404(request.user.passkeys, pk=pk).delete()
    messages.success(request, _("Clé d'accès supprimée."))
    return redirect("security:index")


# Codes de secours


@login_required
def recovery_codes(request):
    codes = request.session.pop(RECOVERY_SESSION, None)
    if not codes:
        return redirect("security:index")
    return render(request, "security/recovery_codes.html", {"codes": codes})


@require_POST
@flow.recent_auth_required
def recovery_regenerate(request):
    request.session[RECOVERY_SESSION] = factors.generate_recovery_codes(request.user)
    return redirect("security:recovery_codes")


# Appareils


@require_POST
@login_required
def device_revoke(request, pk):
    device = get_object_or_404(request.user.devices, pk=pk)
    is_current = device.session_key == request.session.session_key
    devices.revoke(device)
    if is_current:
        return redirect("core:home")
    messages.success(request, _("Appareil déconnecté."))
    return redirect("security:index")


@require_POST
@login_required
def device_untrust(request, pk):
    request.user.devices.filter(pk=pk).update(trusted_until=None)
    messages.success(request, _("Cet appareil demandera à nouveau la double authentification."))
    return redirect("security:index")


@require_POST
@login_required
def devices_logout_others(request):
    current = request.session.session_key
    for device in request.user.devices.exclude(session_key=current):
        devices.revoke(device)
    messages.success(request, _("Tous les autres appareils sont déconnectés."))
    return redirect("security:index")


# Vérification à la connexion


def verify(request):
    user, data = flow.pending(request)
    if user is None:
        messages.info(request, _("Session expirée, reconnectez-vous."))
        return redirect("accounts:login")
    summary = factors.summary(user)
    method = (
        request.POST.get("method")
        or request.GET.get("methode")
        or ("totp" if summary["totp"] else "email" if summary["email"] else "recovery")
    )
    form = CodeForm(request.POST or None)
    if request.method == "POST" and request.POST.get("action") == "send":
        if summary["email"] and factors.send_email_code(user):
            messages.success(request, _("Code envoyé par e-mail."))
        else:
            messages.info(request, _("Patientez une minute avant de demander un nouveau code."))
        return redirect(f"{reverse('security:verify')}?methode=email")
    if request.method == "POST" and form.is_valid():
        if factors.verify_code(user, method, form.cleaned_data["code"]):
            return flow.complete(
                request,
                user,
                data["next"],
                backend=data["backend"],
                trust=bool(request.POST.get("trust")),
            )
        if flow.register_failure(request):
            messages.error(request, _("Trop de codes erronés. Reconnectez-vous."))
            return redirect("accounts:login")
        form.add_error("code", _("Code incorrect."))
    return render(
        request,
        "security/verify.html",
        {"form": form, "summary": summary, "method": method, "pending_user": user},
    )


@require_POST
def verify_passkey_options(request):
    user, _data = flow.pending(request)
    if user is None:
        return JsonResponse({"error": "expired"}, status=400)
    return JsonResponse(passkeys.authentication_options(request, user))


@require_POST
def verify_passkey(request):
    user, data = flow.pending(request)
    if user is None:
        return JsonResponse({"error": _("Session expirée, reconnectez-vous.")}, status=400)
    body = _json_body(request)
    try:
        passkeys.authenticate(request, body.get("credential") or {}, user=user)
    except passkeys.PasskeyError:
        flow.register_failure(request)
        return JsonResponse({"error": _("Clé d'accès non reconnue.")}, status=400)
    return flow.complete(
        request,
        user,
        data["next"],
        backend=data["backend"],
        trust=bool(body.get("trust")),
        response=JsonResponse({"redirect": data["next"]}),
    )


# Connexion sans mot de passe


@require_POST
def passkey_login_options(request):
    return JsonResponse(passkeys.authentication_options(request))


@require_POST
def passkey_login(request):
    if throttle.is_locked("passkey", request):
        return JsonResponse(
            {"error": _("Trop de tentatives. Réessayez dans 15 minutes.")}, status=429
        )
    body = _json_body(request)
    try:
        passkey = passkeys.authenticate(request, body.get("credential") or {})
    except passkeys.PasskeyError:
        throttle.fail("passkey", request)
        return JsonResponse({"error": _("Clé d'accès non reconnue sur ce site.")}, status=400)
    next_url = _safe_next(request, reverse("core:home"))
    return flow.complete(
        request, passkey.user, next_url, response=JsonResponse({"redirect": next_url})
    )
