from django import forms
from django.utils.translation import gettext_lazy as _

from apps.core.forms import StyledFormMixin

from .models import Review


class ReviewForm(StyledFormMixin, forms.ModelForm):
    rating = forms.TypedChoiceField(
        label=_("Votre note"),
        choices=[(n, n) for n in range(5, 0, -1)],
        coerce=int,
        widget=forms.RadioSelect,
    )

    class Meta:
        model = Review
        fields = ("rating", "comment")
        widgets = {
            "comment": forms.Textarea(
                attrs={"rows": 3, "placeholder": _("Accueil, qualité, rapidité…")}
            )
        }


class ReplyForm(StyledFormMixin, forms.ModelForm):
    class Meta:
        model = Review
        fields = ("reply",)
        widgets = {"reply": forms.Textarea(attrs={"rows": 2})}
        labels = {"reply": _("Votre réponse publique")}
