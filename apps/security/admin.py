from django.contrib import admin

from .models import Device, Passkey


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ("user", "label", "ip", "last_seen_at", "trusted_until")
    search_fields = ("user__phone", "user__email", "label", "ip")
    readonly_fields = (
        "user",
        "key_hash",
        "label",
        "ip",
        "session_key",
        "created_at",
        "last_seen_at",
    )
    exclude = ("trusted_until",)


@admin.register(Passkey)
class PasskeyAdmin(admin.ModelAdmin):
    list_display = ("user", "name", "created_at", "last_used_at")
    search_fields = ("user__phone", "user__email", "name")
    fields = ("user", "name", "created_at", "last_used_at")
    readonly_fields = ("user", "created_at", "last_used_at")

    def has_add_permission(self, request):
        return False
