from django.utils.cache import patch_cache_control


class PrivateCacheMiddleware:
    """Marque « private » les réponses des utilisateurs connectés (proxys et service worker)."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if getattr(request, "user", None) is not None and request.user.is_authenticated:
            patch_cache_control(response, private=True)
        return response
