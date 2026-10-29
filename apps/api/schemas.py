"""Schémas d'entrée et de sortie de l'API (Pydantic)."""

from datetime import date, datetime, time

from ninja import Field, Schema


def _url(file):
    return file.url if file else None


class ShopTypeOut(Schema):
    slug: str
    name: str
    name_en: str
    icon: str
    sells_products: bool
    takes_appointments: bool
    takes_table_bookings: bool


class OpeningHourOut(Schema):
    weekday: int
    opens: time | None
    closes: time | None
    closed: bool


class ShopOut(Schema):
    slug: str
    name: str
    tagline: str
    type: str = Field(alias="shop_type.slug")
    level: str
    location: str = Field(alias="location_label")
    unit: str
    phone: str
    whatsapp: str = Field(alias="contact_whatsapp")
    logo: str | None
    banner: str | None
    accepts_cash: bool
    mtn_momo_number: str
    orange_money_number: str
    offers_pickup: bool
    offers_delivery: bool
    delivery_fee: int
    delivery_area: str
    is_open_now: bool | None
    rating: float | None = Field(None, description="Note moyenne des avis publiés")
    reviews_count: int = 0
    url: str

    @staticmethod
    def resolve_logo(obj):
        return _url(obj.logo)

    @staticmethod
    def resolve_banner(obj):
        return _url(obj.banner)

    @staticmethod
    def resolve_is_open_now(obj):
        return obj.is_open_now()

    @staticmethod
    def resolve_rating(obj):
        value = getattr(obj, "rating_avg", None)
        return round(value, 1) if value is not None else None

    @staticmethod
    def resolve_reviews_count(obj):
        return getattr(obj, "rating_count", 0) or 0

    @staticmethod
    def resolve_url(obj):
        return obj.get_absolute_url()


class ShopDetailOut(ShopOut):
    description: str
    opening_hours: list[OpeningHourOut]

    @staticmethod
    def resolve_opening_hours(obj):
        return list(obj.opening_hours.all())


class ProductOut(Schema):
    id: int
    slug: str
    name: str
    description: str
    price: int
    compare_at_price: int | None
    discount_percent: int
    in_stock: bool
    stock: int | None
    image: str | None
    shop: str = Field(alias="shop.slug")
    category: str | None
    url: str

    @staticmethod
    def resolve_image(obj):
        return _url(obj.image)

    @staticmethod
    def resolve_category(obj):
        return obj.category.name if obj.category else None

    @staticmethod
    def resolve_url(obj):
        return obj.get_absolute_url()


class ServiceOut(Schema):
    id: int
    name: str
    description: str
    price: int | None
    duration_minutes: int


class SearchOut(Schema):
    query: str
    expanded_terms: list[str]
    shops: list[ShopOut]
    products: list[ProductOut]


class TokenIn(Schema):
    username: str = Field(description="Téléphone (+237...) ou e-mail")
    password: str
    name: str = Field("", description="Nom de l'appareil ou de l'intégration")
    otp: str = Field(
        "",
        description="Code de l'application d'authentification ou code de secours, "
        "obligatoire si la double authentification est active",
    )


class TokenOut(Schema):
    token: str = Field(description="À conserver : il ne sera plus affiché")
    prefix: str


class MeOut(Schema):
    first_name: str
    last_name: str
    phone: str
    email: str | None
    role: str
    shops: list[str]

    @staticmethod
    def resolve_shops(obj):
        return list(obj.shops.values_list("slug", flat=True))


class OrderItemIn(Schema):
    product_id: int
    quantity: int = Field(ge=1, le=50)


class OrderIn(Schema):
    shop: str = Field(description="Slug de la boutique")
    items: list[OrderItemIn] = Field(min_length=1)
    fulfillment: str = Field(description="pickup ou delivery")
    payment_method: str = Field(description="cash, mtn_momo ou orange_money")
    contact_name: str = ""
    contact_phone: str = ""
    delivery_address: str = ""
    delivery_landmark: str = ""
    note: str = ""


class OrderItemOut(Schema):
    product_id: int | None
    product_name: str
    unit_price: int
    quantity: int
    total: int


class OrderOut(Schema):
    reference: str
    shop: str = Field(alias="shop.slug")
    status: str
    status_label: str = Field(alias="get_status_display")
    fulfillment: str
    payment_method: str
    contact_name: str
    contact_phone: str
    delivery_address: str
    subtotal: int
    delivery_fee: int
    total: int
    pickup_code: str | None
    items: list[OrderItemOut]
    created_at: datetime
    paid_at: datetime | None
    paid_with: str

    @staticmethod
    def resolve_items(obj):
        return list(obj.items.all())

    @staticmethod
    def resolve_pickup_code(obj, context):
        request = context["request"]
        return obj.pickup_code if obj.customer_id == request.user.pk else None


class OrderStatusIn(Schema):
    status: str
    pickup_code: str = ""
    paid_with: str = ""
    reason: str = ""


class BookingIn(Schema):
    shop: str
    kind: str = Field(description="appointment ou table")
    service: int | None = None
    date: date
    time: time
    party_size: int = 1
    contact_phone: str = ""
    note: str = ""


class BookingOut(Schema):
    reference: str
    shop: str = Field(alias="shop.slug")
    kind: str
    service: str | None
    date: date
    time: time
    party_size: int
    status: str
    status_label: str = Field(alias="get_status_display")
    note: str
    merchant_note: str

    @staticmethod
    def resolve_service(obj):
        return obj.service.name if obj.service else None


class BookingStatusIn(Schema):
    status: str
    note: str = ""


class ErrorOut(Schema):
    detail: str | dict


class ReviewIn(Schema):
    rating: int = Field(ge=1, le=5)
    comment: str = Field("", max_length=1000)


class ReviewOut(Schema):
    id: int
    author: str = Field(alias="author_name")
    rating: int
    comment: str
    reply: str
    replied_at: datetime | None
    created_at: datetime


class ReplyIn(Schema):
    reply: str = Field(max_length=1000)


class FavoritesOut(Schema):
    shops: list[ShopOut]
    products: list[ProductOut]


class NotificationOut(Schema):
    id: int
    kind: str
    title: str
    body: str
    url: str
    read_at: datetime | None
    created_at: datetime


class DayOut(Schema):
    day: date
    revenue: int
    orders: int


class TopProductOut(Schema):
    product_name: str
    sold: int
    revenue: int


class PaymentShareOut(Schema):
    paid_with: str
    label: str
    revenue: int
    orders: int
    percent: int


class StatsOut(Schema):
    days: int
    revenue: int
    orders: int
    basket: int
    trend: int | None = Field(
        description="Évolution de l'encaissé en % par rapport à la période précédente"
    )
    cancel_rate: int
    bookings_done: int
    series: list[DayOut]
    top_products: list[TopProductOut]
    payments: list[PaymentShareOut]
