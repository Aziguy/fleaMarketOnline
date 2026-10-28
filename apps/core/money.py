"""Montants en Franc CFA (XAF), stockés en entiers sans décimales."""

CURRENCY = "FCFA"


def format_fcfa(amount) -> str:
    try:
        value = int(amount)
    except (TypeError, ValueError):
        return ""
    return f"{value:,}".replace(",", " ") + f" {CURRENCY}"
