from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.core.exceptions import ValidationError

from apps.core.phone import normalize_phone


class EmailOrPhoneBackend(ModelBackend):
    """Connexion avec l'e-mail ou le numéro de téléphone."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        identifier = (username or kwargs.get("phone") or "").strip()
        if not identifier or password is None:
            return None
        User = get_user_model()
        try:
            if "@" in identifier:
                user = User.objects.get(email__iexact=identifier)
            else:
                user = User.objects.get(phone=normalize_phone(identifier))
        except (User.DoesNotExist, ValidationError):
            User().set_password(password)
            return None
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
