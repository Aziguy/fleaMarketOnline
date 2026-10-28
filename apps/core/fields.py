from django.core.exceptions import ValidationError
from django.db import models

from .phone import normalize_phone, validate_phone


class PhoneField(models.CharField):
    """Numéro camerounais normalisé en +237XXXXXXXXX."""

    default_validators = [validate_phone]

    def __init__(self, *args, **kwargs):
        kwargs.setdefault("max_length", 13)
        super().__init__(*args, **kwargs)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        kwargs.pop("max_length", None)
        return name, "apps.core.fields.PhoneField", args, kwargs

    def pre_save(self, model_instance, add):
        value = getattr(model_instance, self.attname)
        if value:
            try:
                value = normalize_phone(value)
            except ValidationError:
                return value
            setattr(model_instance, self.attname, value)
        return value


class MoneyField(models.PositiveIntegerField):
    """Montant en FCFA (entier)."""
