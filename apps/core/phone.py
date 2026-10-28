"""Numéros de téléphone camerounais (+237, 9 chiffres)."""

import re
from urllib.parse import quote

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

COUNTRY_CODE = "237"
_LOCAL = re.compile(r"^[26]\d{8}$")


def normalize_phone(value: str) -> str:
    """Retourne le numéro au format E.164 (+237XXXXXXXXX) ou lève ValidationError."""
    digits = re.sub(r"\D", "", value or "")
    if digits.startswith("00"):
        digits = digits[2:]
    if digits.startswith(COUNTRY_CODE) and len(digits) == 12:
        digits = digits[3:]
    if not _LOCAL.match(digits):
        raise ValidationError(_("Numéro invalide. Exemple : 6 77 12 34 56."), code="invalid_phone")
    return f"+{COUNTRY_CODE}{digits}"


def validate_phone(value: str) -> None:
    normalize_phone(value)


def format_phone(value: str) -> str:
    """+237677123456 -> +237 6 77 12 34 56"""
    if not value or not value.startswith(f"+{COUNTRY_CODE}") or len(value) != 13:
        return value or ""
    n = value[4:]
    return f"+{COUNTRY_CODE} {n[0]} {n[1:3]} {n[3:5]} {n[5:7]} {n[7:9]}"


def whatsapp_url(phone: str, text: str = "") -> str:
    url = f"https://wa.me/{phone.lstrip('+')}"
    return f"{url}?text={quote(text)}" if text else url
