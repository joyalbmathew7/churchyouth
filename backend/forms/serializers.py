from rest_framework import serializers

from .models import Donation, DonationPurpose, PrayerArea


class DonationPurposeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonationPurpose
        fields = ["id", "name"]


class PrayerAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrayerArea
        fields = ["id", "name"]


class DonationSerializer(serializers.ModelSerializer):

    class Meta:
        model = Donation

        fields = [
            "id",
            "name",
            "phone_number",
            "area_place",
            "prayer_area",
            "purpose",
            "amount",
            "payment_status",
            "gateway_order_id",
            "transaction_id",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "payment_status",
            "gateway_order_id",
            "transaction_id",
            "created_at",
        ]

    def validate_area_place(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "Area / Place is required."
            )

        return value

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Amount must be greater than zero."
            )

        return value