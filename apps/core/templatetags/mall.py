from django import template
from django.utils.http import urlencode

from apps.core.money import format_fcfa
from apps.core.phone import format_phone, whatsapp_url

register = template.Library()


@register.filter
def fcfa(value):
    return format_fcfa(value)


@register.filter
def phone(value):
    return format_phone(value)


@register.simple_tag
def whatsapp(number, text=""):
    return whatsapp_url(number, text)


@register.simple_tag(takes_context=True)
def query(context, **kwargs):
    """Conserve les paramètres GET courants en remplaçant ceux fournis."""
    params = context["request"].GET.copy()
    for key, value in kwargs.items():
        if value in (None, ""):
            params.pop(key, None)
        else:
            params[key] = value
    return f"?{urlencode(params, doseq=True)}" if params else "?"
