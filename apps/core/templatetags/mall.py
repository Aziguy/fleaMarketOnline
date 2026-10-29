import json
from pathlib import Path

from django import template
from django.utils.html import format_html
from django.utils.http import urlencode
from django.utils.safestring import mark_safe

from apps.core.money import format_fcfa
from apps.core.phone import format_phone, whatsapp_url

register = template.Library()

ICONS = json.loads((Path(__file__).resolve().parent.parent / "icons.json").read_text())
FALLBACK_ICON = "store"


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


@register.simple_tag
def icon(name, label="", **attrs):
    """Icône Lucide (ou de marque) en SVG inline."""
    css = attrs.get("class", "h-5 w-5")
    a11y = (
        format_html('role="img" aria-label="{}"', label)
        if label
        else mark_safe('aria-hidden="true"')
    )
    if body := ICONS["brands"].get(name):
        paint = 'fill="currentColor"'
    else:
        body = ICONS["lucide"].get(name) or ICONS["lucide"][FALLBACK_ICON]
        paint = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
    return format_html(
        '<svg class="{}" viewBox="0 0 24 24" {} {} focusable="false">{}</svg>',
        css,
        mark_safe(paint),
        a11y,
        mark_safe(body),
    )
