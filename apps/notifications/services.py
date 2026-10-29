import logging

from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

from .models import Notification

logger = logging.getLogger(__name__)


def notify(user, *, kind, title, body="", url="", email=True):
    """Crée une notification et l'envoie par e-mail si l'utilisateur en a un."""
    notification = Notification.objects.create(
        user=user, kind=kind, title=title, body=body, url=url
    )
    if email and user.email:
        transaction.on_commit(lambda: _send(notification))
    return notification


def _send(notification):
    try:
        send_mail(notification.title, notification.body, None, [notification.user.email])
    except Exception:
        logger.exception("Envoi de la notification %s impossible", notification.pk)


def unread_count(user):
    return user.notifications.filter(read_at__isnull=True).count()


def mark_all_read(user):
    return user.notifications.filter(read_at__isnull=True).update(read_at=timezone.now())
