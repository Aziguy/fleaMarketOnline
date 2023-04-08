from django.contrib import admin
from .models import Category, Items
from django.utils.html import format_html


class CategoryAdmin(admin.ModelAdmin):
    prepopulated_fields = {"slug": ("category_name",)}
    list_display = ("category_name", "vendor", "updated_at")
    search_fields = ("category_name", "vendor__vendor_name")


class ItemsAdmin(admin.ModelAdmin):
    def thumbnail(self, object):
        return format_html(
            '<img src="{}" width="40" style="border-radius: 50px;" />'.format(
                object.image_1.url
            )
        )

    prepopulated_fields = {"slug": ("item_title",)}
    thumbnail.short_description = "Image"
    list_display = (
        "thumbnail",
        "item_title",
        "category",
        "vendor",
        "price",
        "is_available",
        "updated_at",
    )
    search_fields = (
        "item_title",
        "category__category_name",
        "vendor__vendor_name",
        "price",
    )
    list_filter = ("is_available",)


admin.site.register(Category, CategoryAdmin)
admin.site.register(Items, ItemsAdmin)
