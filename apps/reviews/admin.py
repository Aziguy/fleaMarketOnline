from django.contrib import admin

from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("shop", "customer", "rating", "is_published", "created_at", "replied_at")
    list_filter = ("is_published", "rating")
    list_editable = ("is_published",)
    search_fields = ("shop__name", "comment", "customer__phone")
    raw_id_fields = ("shop", "customer")
