"""API REST v1 : catalogue public, compte client, espace commerçant.

Documentation interactive : /api/v1/docs  ·  Schéma OpenAPI : /api/v1/openapi.json
"""

from django.conf import settings
from ninja import NinjaAPI
from ninja.throttling import AnonRateThrottle, AuthRateThrottle

from apps.bookings.services import BookingError
from apps.orders.services import OrderError

from .auth import TokenAuth
from .errors import InvalidInput
from .routers import account, catalog, community, merchant

api = NinjaAPI(
    title="Mfoundi Mall API",
    version="1.0.0",
    description=(
        "API de la plateforme des boutiques du Mfoundi Mall (Yaoundé). Montants en FCFA (entiers), "
        "téléphones au format +237XXXXXXXXX. Obtenez un jeton avec `POST /auth/token`, puis "
        "envoyez-le dans l'en-tête `Authorization: Bearer <jeton>`."
    ),
    urls_namespace="api-v1",
    throttle=[AnonRateThrottle(settings.API_ANON_RATE), AuthRateThrottle(settings.API_AUTH_RATE)],
)

api.add_router("/", catalog.router)
api.add_router("/", account.router)
api.add_router("/", community.router)
api.add_router("/merchant", merchant.router, auth=TokenAuth())


@api.exception_handler(OrderError)
@api.exception_handler(BookingError)
def business_error(request, exc):
    return api.create_response(request, {"detail": str(exc)}, status=409)


@api.exception_handler(InvalidInput)
def invalid_input(request, exc):
    return api.create_response(request, {"detail": exc.errors}, status=422)
