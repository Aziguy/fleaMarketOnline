from django.contrib import admin

from .models import Category, Product, ProductImage, Service


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "shop", "category", "price", "stock", "is_active")
    list_filter = ("is_active", "shop__shop_type", "shop")
    search_fields = ("name", "shop__name")
    inlines = [ProductImageInline]


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "shop", "position")
    list_filter = ("shop",)


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("name", "shop", "price", "duration_minutes", "is_active")
    list_filter = ("shop", "is_active")
