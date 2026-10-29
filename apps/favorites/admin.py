from django.contrib import admin

from .models import Favorite


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ("user", "shop", "product", "created_at")
    raw_id_fields = ("user", "shop", "product")
