from typing import cast

from django import forms
from django.utils.translation import gettext_lazy as _

from apps.core.forms import PhoneFormField, StyledFormMixin

from .models import Fulfillment, PaymentMethod


class CheckoutForm(StyledFormMixin, forms.Form):
    fulfillment = forms.ChoiceField(label=_("Mode de remise"), widget=forms.RadioSelect)
    payment_method = forms.ChoiceField(
        label=_("Je paierai sur place par"), widget=forms.RadioSelect
    )
    contact_name = forms.CharField(label=_("Nom complet"), max_length=120)
    contact_phone = PhoneFormField(label=_("Téléphone"))
    delivery_address = forms.CharField(
        label=_("Adresse de livraison"),
        max_length=255,
        required=False,
        widget=forms.TextInput(attrs={"placeholder": _("Quartier, rue")}),
    )
    delivery_landmark = forms.CharField(
        label=_("Point de repère"),
        max_length=160,
        required=False,
        widget=forms.TextInput(attrs={"placeholder": _("Ex. : face pharmacie du Soleil")}),
    )
    note = forms.CharField(
        label=_("Note pour la boutique"),
        required=False,
        widget=forms.Textarea(attrs={"rows": 3}),
    )

    def __init__(self, *args, shop, user, **kwargs):
        super().__init__(*args, **kwargs)
        self.shop = shop
        for name, methods in (
            ("fulfillment", shop.fulfillment_methods()),
            ("payment_method", shop.payment_methods()),
        ):
            field = cast(forms.ChoiceField, self.fields[name])
            field.choices = [(m.value, m.label) for m in methods]
            if len(methods) == 1:
                field.initial = methods[0].value
        if not self.is_bound:
            self.fields["contact_name"].initial = user.get_full_name()
            self.fields["contact_phone"].initial = user.phone

    def clean(self):
        super().clean()
        data = self.cleaned_data
        if data.get("fulfillment") == Fulfillment.DELIVERY and not data.get("delivery_address"):
            self.add_error("delivery_address", _("Indiquez l'adresse de livraison."))
        return data


class CancelForm(StyledFormMixin, forms.Form):
    reason = forms.CharField(label=_("Motif"), max_length=255, required=False)


class CompleteOrderForm(StyledFormMixin, forms.Form):
    pickup_code = forms.CharField(
        label=_("Code de retrait du client"),
        max_length=6,
        required=False,
        widget=forms.TextInput(attrs={"inputmode": "numeric", "autocomplete": "off"}),
    )
    paid_with = forms.ChoiceField(label=_("Paiement reçu par"), choices=PaymentMethod.choices)
