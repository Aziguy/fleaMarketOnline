from django import forms
from django.contrib.auth import forms as auth_forms
from django.utils.translation import gettext_lazy as _

from apps.core.forms import PhoneFormField, StyledFormMixin

from .models import User


class SignupForm(StyledFormMixin, auth_forms.BaseUserCreationForm):
    phone = PhoneFormField(label=_("Téléphone"))

    class Meta:
        model = User
        fields = ("first_name", "last_name", "phone", "email")
        help_texts = {"email": _("Facultatif. Utile pour récupérer votre mot de passe.")}

    def clean_phone(self):
        phone = self.cleaned_data["phone"]
        if User.objects.filter(phone=phone).exists():
            raise forms.ValidationError(_("Ce numéro est déjà utilisé."))
        return phone

    def clean_email(self):
        email = self.cleaned_data.get("email") or None
        if email and User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError(_("Cet e-mail est déjà utilisé."))
        return email


class LoginForm(StyledFormMixin, auth_forms.AuthenticationForm):
    username = forms.CharField(
        label=_("Téléphone ou e-mail"),
        widget=forms.TextInput(attrs={"autofocus": True, "autocomplete": "username"}),
    )
    error_messages = {
        "invalid_login": _("Identifiants incorrects."),
        "inactive": _("Ce compte est désactivé."),
    }


class ProfileForm(StyledFormMixin, forms.ModelForm):
    phone = PhoneFormField(label=_("Téléphone"))

    class Meta:
        model = User
        fields = ("first_name", "last_name", "phone", "email")

    def clean_phone(self):
        phone = self.cleaned_data["phone"]
        if User.objects.filter(phone=phone).exclude(pk=self.instance.pk).exists():
            raise forms.ValidationError(_("Ce numéro est déjà utilisé."))
        return phone

    def clean_email(self):
        email = self.cleaned_data.get("email") or None
        qs = User.objects.filter(email__iexact=email).exclude(pk=self.instance.pk)
        if email and qs.exists():
            raise forms.ValidationError(_("Cet e-mail est déjà utilisé."))
        return email


class PasswordChangeForm(StyledFormMixin, auth_forms.PasswordChangeForm):
    pass


class PasswordResetForm(StyledFormMixin, auth_forms.PasswordResetForm):
    pass


class SetPasswordForm(StyledFormMixin, auth_forms.SetPasswordForm):
    pass
