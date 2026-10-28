from .base import *  # noqa: F403

DEBUG = True
ALLOWED_HOSTS = ["*"]
STORAGES["staticfiles"] = {  # noqa: F405
    "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"
}
WHITENOISE_AUTOREFRESH = True
