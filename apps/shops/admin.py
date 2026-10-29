from django import forms
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from apps.core.templatetags.mall import ICONS

from . import services
from .models import OpeningHour, Shop, ShopType


class ShopTypeForm(forms.ModelForm):
    icon = forms.ChoiceField(
        label=_("icône"), choices=[(name, name) for name in sorted(ICONS["lucide"])]
    )

    class Meta:
        model = ShopType
        fields = (
            "name",
            "name_en",
            "slug",
            "icon",
            "sells_products",
            "takes_appointments",
            "takes_table_bookings",
            "position",
        )


@admin.register(ShopType)
class ShopTypeAdmin(admin.ModelAdmin):
    form = ShopTypeForm
    list_display = (
        "name",
        "icon",
        "sells_products",
        "takes_appointments",
        "takes_table_bookings",
        "position",
    )
    list_editable = ("position",)
    prepopulated_fields = {"slug": ("name",)}


class OpeningHourInline(admin.TabularInline):
    model = OpeningHour
    extra = 0


@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "shop_type",
        "owner",
        "level",
        "unit",
        "status",
        "is_featured",
        "created_at",
    )
    list_filter = ("status", "shop_type", "level", "is_featured")
    search_fields = ("name", "unit", "owner__phone", "owner__first_name", "phone")
    list_editable = ("is_featured",)
    readonly_fields = ("created_at", "updated_at")
    autocomplete_fields = ("owner",)
    inlines = [OpeningHourInline]
    actions = ("approve", "suspend")

    @admin.action(description=_("Valider les boutiques sélectionnées"))
    def approve(self, request, queryset):
        for shop in queryset:
            services.set_status(shop, Shop.Status.APPROVED)

    @admin.action(description=_("Suspendre les boutiques sélectionnées"))
    def suspend(self, request, queryset):
        for shop in queryset:
            services.set_status(shop, Shop.Status.SUSPENDED)
