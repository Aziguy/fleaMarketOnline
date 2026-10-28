from django.contrib import admin

from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("reference", "shop", "customer", "kind", "date", "time", "status")
    list_filter = ("status", "kind", "shop")
    search_fields = ("reference", "customer__phone", "contact_phone")
    date_hierarchy = "date"
