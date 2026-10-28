from django.utils.translation import gettext as _

from apps.core.phone import whatsapp_url


def order_whatsapp_url(order):
    text = _("Bonjour %(shop)s, à propos de ma commande %(ref)s.") % {
        "shop": order.shop.name,
        "ref": order.reference,
    }
    return whatsapp_url(order.shop.contact_whatsapp, text)
