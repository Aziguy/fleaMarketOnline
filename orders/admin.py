# Register your models here.
from django.contrib import admin
from .models import Payment, Order, OrderedItem


class OrderedItemsInline(admin.TabularInline):
    model = OrderedItem
    readonly_fields = (
        "order",
        "payment",
        "user",
        "item",
        "quantity",
        "price",
        "amount",
    )
    extra = 0


class OrderAdmin(admin.ModelAdmin):
    list_display = [
        "order_number",
        "name",
        "phone",
        "email",
        "total",
        "payment_method",
        "status",
        "order_placed_to",
        "is_ordered",
    ]
    inlines = [OrderedItemsInline]


admin.site.register(Payment)
admin.site.register(Order, OrderAdmin)
admin.site.register(OrderedItem)
