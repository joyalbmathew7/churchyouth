
from rest_framework import serializers

from .models import PrayerHouse, PrayerHouseCategory


class PrayerHouseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PrayerHouseCategory
        fields = [
            "id",
            "name",
            "description",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class PrayerHouseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )

    class Meta:
        model = PrayerHouse
        fields = [
            "id",
            "category",
            "category_name",
            "house_name",
            "host_member_name",
            "meeting_date",
            "location_link",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]
