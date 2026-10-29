from .services import unread_count


def notifications(request):
    user = getattr(request, "user", None)
    if not (user and user.is_authenticated):
        return {}
    return {"unread_notifications": unread_count(user)}
