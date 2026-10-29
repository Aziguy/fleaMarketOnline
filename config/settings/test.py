from .base import *  # noqa: F403

SECRET_KEY = "test"
DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}}
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
STORAGES["staticfiles"] = {  # noqa: F405
    "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"
}
MEDIA_ROOT = BASE_DIR / ".test-media"  # noqa: F405
LANGUAGE_CODE = "fr"
WHITENOISE_AUTOREFRESH = True
CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
LOGGING["loggers"]["apps.requests"]["level"] = "WARNING"  # noqa: F405
REALTIME_POLL_SECONDS = 0
ANTHROPIC_API_KEY = ""
REALTIME_STREAM_SECONDS = 0.05
