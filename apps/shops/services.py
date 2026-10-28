from datetime import time

from django.conf import settings
from django.core.mail import mail_admins, send_mail
from django.db import transaction
from django.utils.translation import gettext as _

from .models import OpeningHour, Shop

DEFAULT_OPENS, DEFAULT_CLOSES = time(8, 0), time(19, 0)


def ensure_opening_hours(shop):
    existing = set(shop.opening_hours.values_list("weekday", flat=True))
    OpeningHour.objects.bulk_create(
        OpeningHour(
            shop=shop,
            weekday=day,
            opens=DEFAULT_OPENS,
            closes=DEFAULT_CLOSES,
            closed=day == OpeningHour.Weekday.SUNDAY,
        )
        for day in OpeningHour.Weekday.values
        if day not in existing
    )


@transaction.atomic
def create_shop(owner, form):
    shop = form.save(commit=False)
    shop.owner = owner
    shop.save()
    ensure_opening_hours(shop)
    owner.role = owner.Role.MERCHANT
    owner.save(update_fields=["role"])
    transaction.on_commit(
        lambda: mail_admins(
            _("Nouvelle boutique à valider : %(name)s") % {"name": shop.name},
            _("Boutique créée par %(owner)s (%(phone)s).") % {"owner": owner, "phone": owner.phone},
            fail_silently=True,
        )
    )
    return shop


def set_status(shop, status):
    shop.status = status
    shop.save(update_fields=["status", "updated_at"])
    email = shop.email or shop.owner.email
    if not email:
        return
    subject = {
        Shop.Status.APPROVED: _("Votre boutique %(name)s est en ligne"),
        Shop.Status.SUSPENDED: _("Votre boutique %(name)s est suspendue"),
    }.get(status)
    if subject:
        send_mail(
            subject % {"name": shop.name},
            _("Bonjour, le statut de votre boutique sur %(site)s est : %(status)s.")
            % {"site": settings.SITE_NAME, "status": shop.get_status_display()},
            None,
            [email],
            fail_silently=True,
        )
