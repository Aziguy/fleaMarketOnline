from django.utils.functional import SimpleLazyObject

from . import services


def favorites(request):
    user = getattr(request, "user", None)
    if user is None:
        return {}
    return {"favorite_ids": SimpleLazyObject(lambda: services.ids(user))}
