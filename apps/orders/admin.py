from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product", "product_name", "unit_price", "quantity")
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("reference", "shop", "customer", "status", "fulfillment", "total", "created_at")
    list_filter = ("status", "fulfillment", "payment_method", "shop")
    search_fields = ("reference", "contact_name", "contact_phone", "customer__phone")
    readonly_fields = ("reference", "pickup_code", "created_at", "updated_at")
    date_hierarchy = "created_at"
    inlines = [OrderItemInline]
