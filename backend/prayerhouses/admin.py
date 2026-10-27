from django.contrib import admin
from .models import PrayerHouse, PrayerHouseCategory


@admin.register(PrayerHouseCategory)
class PrayerHouseCategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "description", "created_at")
    search_fields = ("name",)


@admin.register(PrayerHouse)
class PrayerHouseAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "house_name",
        "category",
        "host_member_name",
        "meeting_date",
        "created_at",
    )
    list_filter = ("category", "meeting_date", "created_at")
    search_fields = ("house_name", "host_member_name")
    date_hierarchy = "meeting_date"
    ordering = ("-created_at",)