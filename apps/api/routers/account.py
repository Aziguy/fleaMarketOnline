"""Authentification par jeton et compte client : commandes et réservations."""

from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from ninja import Router, Status
from ninja.errors import HttpError

from apps.bookings import services as booking_services
from apps.bookings.forms import BookingForm
from apps.cart.cart import CartLine
from apps.catalog.models import Product
from apps.orders import services as order_services
from apps.orders.forms import CheckoutForm
from apps.orders.models import Order
from apps.shops.models import Shop

from ..auth import TokenAuth
from ..errors import InvalidInput
from ..models import ApiToken
from ..schemas import BookingIn, BookingOut, ErrorOut, MeOut, OrderIn, OrderOut, TokenIn, TokenOut

router = Router(tags=["Compte"])
auth = TokenAuth()


@router.post("/auth/token", response={201: TokenOut, 401: ErrorOut}, tags=["Authentification"])
def create_token(request, payload: TokenIn):
    user = authenticate(request, username=payload.username, password=payload.password)
    if user is None:
        return Status(401, {"detail": "Identifiants incorrects."})
    token, key = ApiToken.objects.issue(user, payload.name)
    return Status(201, {"token": key, "prefix": token.prefix})


@router.delete("/auth/token", response={204: None}, auth=auth, tags=["Authentification"])
def revoke_token(request):
    request.api_token.delete()
    return Status(204, None)


@router.get("/me", response=MeOut, auth=auth)
def me(request):
    return request.user


def _orders(user):
    return Order.objects.filter(customer=user).select_related("shop").prefetch_related("items")


@router.get("/orders", response=list[OrderOut], auth=auth)
def my_orders(request):
    return _orders(request.user)


@router.get("/orders/{reference}", response=OrderOut, auth=auth)
def my_order(request, reference: str):
    return get_object_or_404(_orders(request.user), reference=reference)


@router.post("/orders", response={201: OrderOut, 409: ErrorOut, 422: ErrorOut}, auth=auth)
def place_order(request, payload: OrderIn):
    """Commande dans une boutique ; paiement sur place au retrait ou à la livraison."""
    shop = get_object_or_404(Shop.objects.public(), slug=payload.shop)
    wanted = {item.product_id: item.quantity for item in payload.items}
    products = {p.pk: p for p in Product.objects.public().filter(shop=shop, pk__in=wanted)}
    missing = set(wanted) - set(products)
    if missing:
        raise HttpError(422, f"Produits introuvables dans cette boutique : {sorted(missing)}")
    data = payload.dict(exclude={"shop", "items"})
    data["contact_name"] = data["contact_name"] or request.user.get_full_name()
    data["contact_phone"] = data["contact_phone"] or request.user.phone
    form = CheckoutForm(data, shop=shop, user=request.user)
    if not form.is_valid():
        raise InvalidInput.from_form(form)
    lines = [CartLine(products[pk], quantity) for pk, quantity in wanted.items()]
    order = order_services.place_order(
        customer=request.user, shop=shop, lines=lines, data=form.cleaned_data
    )
    return Status(201, _orders(request.user).get(pk=order.pk))


@router.post("/orders/{reference}/cancel", response={200: OrderOut, 409: ErrorOut}, auth=auth)
def cancel_order(request, reference: str):
    order = get_object_or_404(_orders(request.user), reference=reference)
    return order_services.cancel_by_customer(order)


@router.get("/bookings", response=list[BookingOut], auth=auth, tags=["Réservations"])
def my_bookings(request):
    return request.user.bookings.select_related("shop", "service").order_by("-date", "-time")


@router.post(
    "/bookings", response={201: BookingOut, 422: ErrorOut}, auth=auth, tags=["Réservations"]
)
def create_booking(request, payload: BookingIn):
    shop = get_object_or_404(Shop.objects.public().select_related("shop_type"), slug=payload.shop)
    data = payload.dict(exclude={"shop"})
    data["contact_phone"] = data["contact_phone"] or request.user.phone
    form = BookingForm(data, shop=shop, user=request.user)
    if not form.is_valid():
        raise InvalidInput.from_form(form)
    return Status(201, booking_services.create_booking(form=form, shop=shop, customer=request.user))


@router.post(
    "/bookings/{reference}/cancel",
    response={200: BookingOut, 409: ErrorOut},
    auth=auth,
    tags=["Réservations"],
)
def cancel_booking(request, reference: str):
    booking = get_object_or_404(request.user.bookings, reference=reference)
    return booking_services.cancel_by_customer(booking)
