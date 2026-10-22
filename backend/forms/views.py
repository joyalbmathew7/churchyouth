
from django.conf import settings
from django.http import FileResponse

import razorpay
import logging

logger = logging.getLogger(__name__)
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Donation, DonationPurpose, PrayerArea
from .serializers import (
    DonationSerializer,
    DonationPurposeSerializer,
    PrayerAreaSerializer,
)
from .receipt import create_donation_receipt


class DonationPurposeListView(generics.ListAPIView):
    queryset = DonationPurpose.objects.filter(is_active=True)
    serializer_class = DonationPurposeSerializer
    permission_classes = [AllowAny]


class PrayerAreaListView(generics.ListAPIView):
    queryset = PrayerArea.objects.filter(is_active=True)
    serializer_class = PrayerAreaSerializer
    permission_classes = [AllowAny]


class DonationCreateView(generics.CreateAPIView):
    queryset = Donation.objects.all()
    serializer_class = DonationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        donation = serializer.save(payment_status="pending")

        try:
            client = razorpay.Client(
                auth=(
                    settings.RAZORPAY_KEY_ID,
                    settings.RAZORPAY_KEY_SECRET,
                )
            )

            order = client.order.create(
                data={
                    "amount": int(donation.amount * 100),
                    "currency": "INR",
                    "receipt": f"donation_{donation.id}",
                }
            )

            donation.razorpay_order_id = order["id"]
            donation.save(update_fields=["razorpay_order_id"])

        except Exception:
            logger.exception("Failed to create Razorpay order")

            donation.delete()

            return Response(
                {"error": "Unable to create payment order. Please try again."},
                status=status.HTTP_502_BAD_GATEWAY,
        )

        return Response(
            {
                "donation_id": donation.id,
                "amount": str(donation.amount),
                "currency": "INR",
                "payment_status": donation.payment_status,
                "razorpay_order_id": order["id"],
                "razorpay_key_id": settings.RAZORPAY_KEY_ID,
            },
            status=status.HTTP_201_CREATED,
        )


class DonationReceiptView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, donation_id):
        try:
            donation = Donation.objects.get(
                id=donation_id,
                payment_status="success",
            )
        except Donation.DoesNotExist:
            return Response(
                {"error": "Successful donation not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        pdf = create_donation_receipt(donation)

        response = FileResponse(
            pdf,
            content_type="application/pdf",
        )

        response["Content-Disposition"] = (
            f'attachment; filename="donation_receipt_{donation.id}.pdf"'
        )

        return response
