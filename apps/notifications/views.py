from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.shortcuts import render

from . import services


@login_required
def notification_list(request):
    page = Paginator(request.user.notifications.all(), 30).get_page(request.GET.get("page"))
    response = render(request, "notifications/list.html", {"page": page})
    services.mark_all_read(request.user)
    return response
