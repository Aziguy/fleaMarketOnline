"""Panier stocké en session : {"<product_id>": quantité}."""

from dataclasses import dataclass, field

from django.utils.translation import gettext as _

from apps.catalog.models import Product
from apps.core.money import format_fcfa
from apps.core.phone import whatsapp_url

SESSION_KEY = "cart"


@dataclass
class CartLine:
    product: Product
    quantity: int

    @property
    def total(self):
        return self.product.price * self.quantity


@dataclass
class ShopGroup:
    shop: object
    lines: list[CartLine] = field(default_factory=list)

    @property
    def subtotal(self):
        return sum(line.total for line in self.lines)

    @property
    def count(self):
        return sum(line.quantity for line in self.lines)

    def whatsapp_message(self):
        rows = [_("Bonjour %(shop)s, je souhaite commander :") % {"shop": self.shop.name}]
        rows += [
            f"- {line.quantity} x {line.product.name} ({format_fcfa(line.total)})"
            for line in self.lines
        ]
        rows.append(_("Total : %(total)s") % {"total": format_fcfa(self.subtotal)})
        return "\n".join(rows)

    @property
    def whatsapp_url(self):
        return whatsapp_url(self.shop.contact_whatsapp, self.whatsapp_message())


class Cart:
    def __init__(self, session):
        self.session = session
        self.data = {str(k): int(v) for k, v in session.get(SESSION_KEY, {}).items()}

    def _save(self):
        self.session[SESSION_KEY] = self.data
        self.session.modified = True

    def quantity_of(self, product):
        return self.data.get(str(product.pk), 0)

    def add(self, product, quantity=1):
        self.set(product, self.quantity_of(product) + quantity)

    def set(self, product, quantity):
        quantity = max(0, min(int(quantity), product.max_quantity()))
        if quantity:
            self.data[str(product.pk)] = quantity
        else:
            self.data.pop(str(product.pk), None)
        self._save()

    def remove(self, product_id):
        self.data.pop(str(product_id), None)
        self._save()

    def clear(self, product_ids=None):
        if product_ids is None:
            self.data = {}
        else:
            for pk in product_ids:
                self.data.pop(str(pk), None)
        self._save()

    def __len__(self):
        return sum(self.data.values())

    def lines(self):
        products = Product.objects.public().select_related("shop").filter(pk__in=self.data)
        found = {str(p.pk): p for p in products}
        if set(found) != set(self.data):
            self.data = {k: v for k, v in self.data.items() if k in found}
            self._save()
        return [CartLine(found[pk], qty) for pk, qty in self.data.items()]

    def groups(self):
        groups: dict[int, ShopGroup] = {}
        for line in self.lines():
            shop = line.product.shop
            groups.setdefault(shop.pk, ShopGroup(shop)).lines.append(line)
        return list(groups.values())

    def group_for(self, shop):
        return next((g for g in self.groups() if g.shop.pk == shop.pk), None)

    @property
    def total(self):
        return sum(line.total for line in self.lines())
