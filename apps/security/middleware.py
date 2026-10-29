from django.conf import settings
from django.contrib import messages
from django.shortcuts import redirect
from django.urls import reverse
from django.utils.translation import gettext as _

from . import factors


class StaffMFAMiddleware:
    """L'administration du mall exige une application d'authentification ou une clé d'accès."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = getattr(request, "user", None)
        if (
            settings.MFA_REQUIRED_FOR_STAFF
            and user is not None
            and user.is_authenticated
            and user.is_staff
            and request.path.startswith(reverse("admin:index"))
            and not factors.has_strong_factor(user)
        ):
            messages.warning(
                request,
                _(
                    "Pour accéder à l'administration, activez d'abord une application "
                    "d'authentification ou une clé d'accès."
                ),
            )
            return redirect("security:index")
        return self.get_response(request)


def admin_login(request):
    """La connexion à l'administration passe par la connexion du site (et son second facteur)."""
    query = request.META.get("QUERY_STRING", "")
    return redirect(f"{reverse('accounts:login')}{'?' + query if query else ''}")
