from django import forms

from .phone import normalize_phone

_INPUT = "input"
_CHECK = "h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"


class StyledFormMixin:
    """Applique les classes Tailwind aux widgets."""

    fields: dict[str, forms.Field]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            widget = field.widget
            if isinstance(widget, forms.CheckboxInput):
                css = _CHECK
            elif isinstance(widget, (forms.RadioSelect, forms.CheckboxSelectMultiple)):
                css = _CHECK
            else:
                css = _INPUT
            widget.attrs["class"] = f"{css} {widget.attrs.get('class', '')}".strip()


class PhoneFormField(forms.CharField):
    def __init__(self, *args, **kwargs):
        kwargs.setdefault("max_length", 20)
        super().__init__(*args, **kwargs)
        self.widget.attrs.setdefault("inputmode", "tel")
        self.widget.attrs.setdefault("placeholder", "6 77 12 34 56")

    def clean(self, value):
        value = super().clean(value)
        return normalize_phone(value) if value else value
