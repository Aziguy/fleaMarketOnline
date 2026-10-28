"""Règles métier des commandes : création, transitions, stock."""

import logging

from django.core.mail import send_mail
from django.db import transaction
from django.db.models import F
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.translation import gettext as _

from apps.catalog.models import Product

from .models import Fulfillment, Order, OrderItem

logger = logging.getLogger(__name__)


class OrderError(Exception):
    pass


@transaction.atomic
def place_order(*, customer, shop, lines, data):
    """Crée la commande d'une boutique à partir des lignes du panier."""
    if not lines:
        raise OrderError(_("Votre panier est vide pour cette boutique."))

    products = {
        p.pk: p
        for p in Product.objects.select_for_update().filter(
            pk__in=[line.product.pk for line in lines], shop=shop, is_active=True
        )
    }
    items = []
    for line in lines:
        product = products.get(line.product.pk)
        if product is None:
            raise OrderError(_("« %(name)s » n'est plus disponible.") % {"name": line.product.name})
        if product.stock is not None and product.stock < line.quantity:
            raise OrderError(
                _("Stock insuffisant pour « %(name)s » (%(stock)s restant(s)).")
                % {"name": product.name, "stock": product.stock}
            )
        items.append((product, line.quantity))

    subtotal = sum(p.price * q for p, q in items)
    delivery = data["fulfillment"] == Fulfillment.DELIVERY
    fee = shop.delivery_fee if delivery else 0

    order = Order.objects.create(
        shop=shop,
        customer=customer,
        fulfillment=data["fulfillment"],
        payment_method=data["payment_method"],
        contact_name=data["contact_name"],
        contact_phone=data["contact_phone"],
        delivery_address=data.get("delivery_address", "") if delivery else "",
        delivery_landmark=data.get("delivery_landmark", "") if delivery else "",
        note=data.get("note", ""),
        subtotal=subtotal,
        delivery_fee=fee,
        total=subtotal + fee,
    )
    OrderItem.objects.bulk_create(
        OrderItem(order=order, product=p, product_name=p.name, unit_price=p.price, quantity=q)
        for p, q in items
    )
    for product, quantity in items:
        if product.stock is not None:
            Product.objects.filter(pk=product.pk).update(stock=F("stock") - quantity)

    transaction.on_commit(lambda: notify_shop_new_order(order))
    return order


def _restock(order):
    for item in order.items.select_related("product"):
        if item.product and item.product.stock is not None:
            Product.objects.filter(pk=item.product.pk).update(stock=F("stock") + item.quantity)


@transaction.atomic
def change_status(order, new_status, *, pickup_code=None, paid_with=None, reason=""):
    if new_status not in order.next_statuses():
        raise OrderError(_("Changement de statut impossible."))

    if new_status == Order.Status.COMPLETED:
        if order.is_pickup and (pickup_code or "").strip() != order.pickup_code:
            raise OrderError(_("Code de retrait incorrect."))
        order.paid_with = paid_with or order.payment_method
        order.paid_at = timezone.now()

    if new_status == Order.Status.CANCELLED:
        order.cancel_reason = reason
        _restock(order)

    order.status = new_status
    order.save()
    return order


def cancel_by_customer(order, reason=""):
    if not order.customer_can_cancel:
        raise OrderError(_("Cette commande ne peut plus être annulée."))
    return change_status(order, Order.Status.CANCELLED, reason=reason or _("Annulée par le client"))


def notify_shop_new_order(order):
    if not order.shop.email:
        return
    try:
        send_mail(
            _("Nouvelle commande %(ref)s") % {"ref": order.reference},
            render_to_string("orders/emails/new_order.txt", {"order": order}),
            None,
            [order.shop.email],
        )
    except Exception:
        logger.exception("Envoi de l'e-mail de commande %s impossible", order.reference)
