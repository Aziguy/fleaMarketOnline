from django.conf import settings

from apps.ai.services import is_enabled as ai_enabled


def site(request):
    return {
        "SITE_NAME": settings.SITE_NAME,
        "SITE_PHONE": settings.SITE_PHONE,
        "SITE_EMAIL": settings.SITE_EMAIL,
        "MALL_ADDRESS": settings.MALL_ADDRESS,
        "AI_ENABLED": ai_enabled(),
    }
