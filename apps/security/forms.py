from django import forms
from django.utils.translation import gettext_lazy as _

from apps.core.forms import StyledFormMixin


class CodeForm(StyledFormMixin, forms.Form):
    code = forms.CharField(
        label=_("Code"),
        max_length=20,
        widget=forms.TextInput(
            attrs={
                "autocomplete": "one-time-code",
                "inputmode": "numeric",
                "autofocus": True,
                "class": "text-center font-mono text-lg tracking-[0.3em]",
            }
        ),
    )


class ConfirmPasswordForm(StyledFormMixin, forms.Form):
    password = forms.CharField(
        label=_("Mot de passe actuel"),
        widget=forms.PasswordInput(attrs={"autocomplete": "current-password", "autofocus": True}),
    )

    def __init__(self, *args, user, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = user

    def clean_password(self):
        password = self.cleaned_data["password"]
        if not self.user.check_password(password):
            raise forms.ValidationError(_("Mot de passe incorrect."))
        return password
