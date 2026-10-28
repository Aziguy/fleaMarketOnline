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
        self.fields["fulfillment"].choices = [
            (m.value, m.label) for m in shop.fulfillment_methods()
        ]
        self.fields["payment_method"].choices = [(m.value, m.label) for m in shop.payment_methods()]
        if len(self.fields["fulfillment"].choices) == 1:
            self.fields["fulfillment"].initial = self.fields["fulfillment"].choices[0][0]
        if len(self.fields["payment_method"].choices) == 1:
            self.fields["payment_method"].initial = self.fields["payment_method"].choices[0][0]
        if not self.is_bound:
            self.fields["contact_name"].initial = user.get_full_name()
            self.fields["contact_phone"].initial = user.phone

    def clean(self):
        data = super().clean()
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
