from datetime import datetime, timedelta

from django import forms
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.core.forms import PhoneFormField, StyledFormMixin

from .models import Booking

MAX_DAYS_AHEAD = 60
MAX_PARTY = 30


class BookingForm(StyledFormMixin, forms.ModelForm):
    contact_phone = PhoneFormField(label=_("Téléphone"))

    class Meta:
        model = Booking
        fields = ("kind", "service", "date", "time", "party_size", "contact_phone", "note")
        widgets = {
            "kind": forms.RadioSelect,
            "date": forms.DateInput(attrs={"type": "date"}),
            "time": forms.TimeInput(attrs={"type": "time", "step": 900}),
            "note": forms.Textarea(attrs={"rows": 3}),
        }

    def __init__(self, *args, shop, user, **kwargs):
        super().__init__(*args, **kwargs)
        self.shop = shop
        kinds = []
        if shop.shop_type.takes_appointments:
            kinds.append(Booking.Kind.APPOINTMENT)
        if shop.shop_type.takes_table_bookings:
            kinds.append(Booking.Kind.TABLE)
        self.fields["kind"].choices = [(k.value, k.label) for k in kinds]
        if len(kinds) == 1:
            self.fields["kind"].initial = kinds[0].value
        self.fields["service"].queryset = shop.services.filter(is_active=True)
        self.fields["service"].required = False
        self.fields["party_size"].widget.attrs.update(min=1, max=MAX_PARTY)
        if not self.is_bound:
            self.fields["contact_phone"].initial = user.phone
            self.fields["date"].initial = timezone.localdate()

    def clean(self):
        data = super().clean()
        kind, date, time = data.get("kind"), data.get("date"), data.get("time")
        if kind == Booking.Kind.APPOINTMENT and not data.get("service"):
            self.add_error("service", _("Choisissez une prestation."))
        if kind == Booking.Kind.TABLE:
            data["service"] = None
            size = data.get("party_size") or 0
            if not 1 <= size <= MAX_PARTY:
                self.add_error(
                    "party_size", _("Entre 1 et %(max)s personnes.") % {"max": MAX_PARTY}
                )
        else:
            data["party_size"] = 1
        if date and time:
            moment = timezone.make_aware(datetime.combine(date, time))
            now = timezone.now()
            if moment < now + timedelta(minutes=30):
                self.add_error("time", _("Choisissez un créneau au moins 30 minutes à l'avance."))
            elif moment > now + timedelta(days=MAX_DAYS_AHEAD):
                self.add_error(
                    "date", _("Réservation possible jusqu'à %(n)s jours.") % {"n": MAX_DAYS_AHEAD}
                )
            elif self.shop.is_open_at(moment) is False:
                self.add_error("time", _("La boutique est fermée à ce moment."))
        return data


class MerchantBookingForm(StyledFormMixin, forms.Form):
    merchant_note = forms.CharField(label=_("Message au client"), max_length=255, required=False)
