from django.db import transaction
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from apps.catalog.models import Product

from . import services


@receiver(pre_save, sender=Product)
def _remember_stock(sender, instance, **kwargs):
    if instance.pk:
        previous = sender.objects.filter(pk=instance.pk).values_list("stock", flat=True).first()
        instance._was_out_of_stock = previous == 0


@receiver(post_save, sender=Product)
def _alert_restock(sender, instance, created, **kwargs):
    if getattr(instance, "_was_out_of_stock", False) and instance.is_available:
        transaction.on_commit(lambda: services.notify_restock(instance))
