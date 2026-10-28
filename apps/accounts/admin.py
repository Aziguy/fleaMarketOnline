from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import BaseUserCreationForm
from django.utils.translation import gettext_lazy as _

from .models import User


class UserCreationForm(BaseUserCreationForm):
    class Meta:
        model = User
        fields = ("phone", "first_name", "role")


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    add_form = UserCreationForm
    ordering = ("-date_joined",)
    list_display = ("phone", "first_name", "last_name", "email", "role", "is_active", "date_joined")
    list_filter = ("role", "is_active", "is_staff")
    search_fields = ("phone", "email", "first_name", "last_name")
    fieldsets = (
        (None, {"fields": ("phone", "password")}),
        (_("Identité"), {"fields": ("first_name", "last_name", "email", "role")}),
        (
            _("Droits"),
            {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
        (_("Dates"), {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("phone", "first_name", "role", "password1", "password2"),
            },
        ),
    )
