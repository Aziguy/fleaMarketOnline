"""Identifiant de requête, logs JSON et sonde de santé."""

import contextvars
import json
import logging
import re
import time
import uuid

from django.conf import settings
from django.core.cache import cache
from django.db import connection
from django.http import JsonResponse
from django.views.decorators.cache import never_cache

request_id_var = contextvars.ContextVar("request_id", default="-")
_VALID_ID = re.compile(r"^[A-Za-z0-9._-]{1,64}$")

logger = logging.getLogger("apps.requests")


class RequestIdMiddleware:
    """Propage X-Request-ID (ou en crée un) et journalise chaque requête."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        incoming = request.headers.get("X-Request-ID", "")
        request.id = incoming if _VALID_ID.match(incoming) else uuid.uuid4().hex
        token = request_id_var.set(request.id)
        start = time.perf_counter()
        try:
            response = self.get_response(request)
        finally:
            request_id_var.reset(token)
        response["X-Request-ID"] = request.id
        logger.info(
            "%s %s %s",
            request.method,
            request.path,
            response.status_code,
            extra={
                "request_id": request.id,
                "status": response.status_code,
                "duration_ms": round((time.perf_counter() - start) * 1000, 1),
            },
        )
        return response


class RequestIdFilter(logging.Filter):
    def filter(self, record):
        if not hasattr(record, "request_id"):
            record.request_id = request_id_var.get()
        return True


class JsonFormatter(logging.Formatter):
    """Une ligne JSON par événement, exploitable par Loki, Datadog, CloudWatch..."""

    EXTRA = ("request_id", "status", "duration_ms")

    def format(self, record):
        data = {
            "time": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        for key in self.EXTRA:
            if hasattr(record, key):
                data[key] = getattr(record, key)
        if record.exc_info:
            data["exception"] = self.formatException(record.exc_info)
        return json.dumps(data, ensure_ascii=False)


def _check(probe):
    try:
        probe()
        return "ok"
    except Exception as exc:
        logging.getLogger(__name__).error("Sonde en échec : %s", exc)
        return "error"


def _database():
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")


def _cache():
    cache.set("healthz", "ok", 5)
    if cache.get("healthz") != "ok":
        raise RuntimeError("cache indisponible")


def run_checks():
    checks = {"database": _check(_database), "cache": _check(_cache)}
    return all(value == "ok" for value in checks.values()), checks


@never_cache
def healthz(request):
    healthy, checks = run_checks()
    return JsonResponse(
        {"status": "ok" if healthy else "error", "version": settings.APP_VERSION, "checks": checks},
        status=200 if healthy else 503,
    )
