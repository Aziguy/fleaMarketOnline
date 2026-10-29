from pathlib import Path
from typing import Any

import environ
from django.contrib.messages import constants as messages
from django.utils.translation import gettext_lazy as _

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("SECRET_KEY", default="insecure-dev-key-change-me")
DEBUG = env.bool("DEBUG", default=False)
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[])

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.humanize",
    "django_htmx",
    "apps.core",
    "apps.accounts",
    "apps.shops",
    "apps.catalog",
    "apps.cart",
    "apps.orders",
    "apps.bookings",
    "apps.dashboard",
    "apps.api",
    "apps.ai",
    "apps.notifications",
    "apps.reviews",
    "apps.favorites",
    "apps.security",
]

MIDDLEWARE = [
    "apps.core.observability.RequestIdMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "apps.security.middleware.StaffMFAMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "django_htmx.middleware.HtmxMiddleware",
    "apps.core.middleware.PrivateCacheMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "apps.core.context_processors.site",
                "apps.cart.context_processors.cart",
                "apps.notifications.context_processors.notifications",
                "apps.favorites.context_processors.favorites",
            ],
            "builtins": ["apps.core.templatetags.mall"],
        },
    },
]

DATABASES = {
    "default": env.db("DATABASE_URL", default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}"),
}
DATABASES["default"]["CONN_MAX_AGE"] = env.int("DB_CONN_MAX_AGE", default=60)

AUTH_USER_MODEL = "accounts.User"
AUTHENTICATION_BACKENDS = ["apps.accounts.backends.EmailOrPhoneBackend"]
LOGIN_URL = "accounts:login"

# Sécurité des comptes
LOGIN_MAX_ATTEMPTS = env.int("LOGIN_MAX_ATTEMPTS", default=5)
LOGIN_LOCKOUT_SECONDS = env.int("LOGIN_LOCKOUT_SECONDS", default=900)
# Élevé : les opérateurs mobiles partagent une même adresse IP entre de nombreux abonnés.
LOGIN_MAX_ATTEMPTS_PER_IP = env.int("LOGIN_MAX_ATTEMPTS_PER_IP", default=100)
# Nombre de proxys devant Django qui ajoutent X-Forwarded-For (Nginx du conteneur : 1).
TRUSTED_PROXY_COUNT = env.int("TRUSTED_PROXY_COUNT", default=0)
MFA_REQUIRED_FOR_STAFF = env.bool("MFA_REQUIRED_FOR_STAFF", default=True)
MFA_TRUSTED_DAYS = env.int("MFA_TRUSTED_DAYS", default=30)
MFA_ENCRYPTION_KEY = env("MFA_ENCRYPTION_KEY", default="")
WEBAUTHN_RP_ID = env("WEBAUTHN_RP_ID", default="")
LOGIN_REDIRECT_URL = "core:home"
LOGOUT_REDIRECT_URL = "core:home"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "fr"
LANGUAGES = [("fr", _("Français")), ("en", _("English"))]
LOCALE_PATHS = [BASE_DIR / "locale"]
TIME_ZONE = "Africa/Douala"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]
MEDIA_URL = "/media/"
MEDIA_ROOT = env.path("MEDIA_ROOT", default=BASE_DIR / "media")
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024

STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

MESSAGE_TAGS = {messages.ERROR: "error"}

EMAIL_BACKEND = env("EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend")
EMAIL_HOST = env("EMAIL_HOST", default="localhost")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="Mfoundi Mall <no-reply@mfoundimall.cm>")

ADMINS = [tuple(a.split(":", 1)) for a in env.list("ADMINS", default=[])]
SERVER_EMAIL = DEFAULT_FROM_EMAIL

SITE_NAME = env("SITE_NAME", default="Mfoundi Mall")
SITE_PHONE = env("SITE_PHONE", default="")
SITE_EMAIL = env("SITE_EMAIL", default="contact@mfoundimall.cm")
MALL_ADDRESS = env("MALL_ADDRESS", default="Marché Mfoundi, Yaoundé, Cameroun")

APP_VERSION = env("APP_VERSION", default="dev")

ANTHROPIC_API_KEY = env("ANTHROPIC_API_KEY", default="")
AI_ENABLED = env.bool("AI_ENABLED", default=True)
AI_MODEL = env("AI_MODEL", default="claude-opus-5-5")
AI_TIMEOUT_SECONDS = env.float("AI_TIMEOUT_SECONDS", default=30)
AI_MAX_RETRIES = env.int("AI_MAX_RETRIES", default=2)
AI_DESCRIPTIONS_PER_HOUR = env.int("AI_DESCRIPTIONS_PER_HOUR", default=30)

API_ANON_RATE = env("API_ANON_RATE", default="120/m")
API_AUTH_RATE = env("API_AUTH_RATE", default="600/m")

REALTIME_POLL_SECONDS = env.float("REALTIME_POLL_SECONDS", default=3)
REALTIME_STREAM_SECONDS = env.int("REALTIME_STREAM_SECONDS", default=300)
REALTIME_RETRY_MS = 3000

CACHES = {"default": env.cache("CACHE_URL", default="locmemcache://")}

LOG_FORMAT = env("LOG_FORMAT", default="text")
LOGGING: dict[str, Any] = {
    "version": 1,
    "disable_existing_loggers": False,
    "filters": {"request_id": {"()": "apps.core.observability.RequestIdFilter"}},
    "formatters": {
        "text": {"format": "%(asctime)s %(levelname)s [%(request_id)s] %(name)s: %(message)s"},
        "json": {"()": "apps.core.observability.JsonFormatter"},
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": LOG_FORMAT,
            "filters": ["request_id"],
        }
    },
    "root": {"handlers": ["console"], "level": env("LOG_LEVEL", default="INFO")},
    "loggers": {
        "apps.requests": {"level": env("REQUEST_LOG_LEVEL", default="INFO")},
        "django.server": {"level": "WARNING"},
    },
}
