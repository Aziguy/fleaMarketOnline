from django import forms
from django.utils.translation import gettext_lazy as _

from apps.core.forms import PhoneFormField, StyledFormMixin

from .models import OpeningHour, Shop

_PHONE_FIELDS = ("phone", "whatsapp", "mtn_momo_number", "orange_money_number")


class _ShopPhonesMixin:
    def _setup_phones(self):
        for name in _PHONE_FIELDS:
            if name in self.fields:
                old = self.fields[name]
                self.fields[name] = PhoneFormField(
                    label=old.label, required=old.required, help_text=old.help_text
                )
                self.fields[name].widget.attrs["class"] = "input"


class ShopCreateForm(StyledFormMixin, _ShopPhonesMixin, forms.ModelForm):
    class Meta:
        model = Shop
        fields = (
            "name",
            "shop_type",
            "tagline",
            "description",
            "level",
            "unit",
            "phone",
            "whatsapp",
            "email",
            "logo",
        )
        widgets = {"description": forms.Textarea(attrs={"rows": 4})}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._setup_phones()


class ShopSettingsForm(StyledFormMixin, _ShopPhonesMixin, forms.ModelForm):
    class Meta:
        model = Shop
        fields = (
            "name",
            "tagline",
            "description",
            "logo",
            "cover",
            "level",
            "unit",
            "phone",
            "whatsapp",
            "email",
            "accepts_cash",
            "mtn_momo_number",
            "orange_money_number",
            "offers_pickup",
            "offers_delivery",
            "delivery_fee",
            "delivery_area",
        )
        widgets = {"description": forms.Textarea(attrs={"rows": 4})}
        help_texts = {
            "mtn_momo_number": _("Affiché au client pour payer sur place. Vide = non accepté."),
            "orange_money_number": _("Affiché au client pour payer sur place. Vide = non accepté."),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._setup_phones()

    def clean(self):
        data = super().clean()
        if not (data.get("offers_pickup") or data.get("offers_delivery")):
            raise forms.ValidationError(_("Proposez au moins le retrait ou la livraison."))
        if not (
            data.get("accepts_cash")
            or data.get("mtn_momo_number")
            or data.get("orange_money_number")
        ):
            raise forms.ValidationError(_("Acceptez au moins un moyen de paiement."))
        return data


class OpeningHourForm(StyledFormMixin, forms.ModelForm):
    class Meta:
        model = OpeningHour
        fields = ("weekday", "opens", "closes", "closed")
        widgets = {
            "weekday": forms.HiddenInput,
            "opens": forms.TimeInput(attrs={"type": "time"}),
            "closes": forms.TimeInput(attrs={"type": "time"}),
        }


OpeningHourFormSet = forms.inlineformset_factory(
    Shop, OpeningHour, form=OpeningHourForm, extra=0, can_delete=False, max_num=7
)
