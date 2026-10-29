from django.contrib import admin

from .models import ApiToken


@admin.register(ApiToken)
class ApiTokenAdmin(admin.ModelAdmin):
    list_display = ("prefix", "user", "name", "created_at", "last_used_at")
    search_fields = ("prefix", "user__phone", "user__email", "name")
    readonly_fields = ("prefix", "created_at", "last_used_at")

    def has_add_permission(self, request):
        return False
