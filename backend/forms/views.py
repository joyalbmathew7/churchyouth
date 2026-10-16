
from urllib.parse import urlencode

from django.conf import settings
from django.http import FileResponse

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

        upi_id = getattr(
            settings,
            "CHURCH_UPI_ID",
            "replace-with-church-upi-id",
        )

        upi_parameters = urlencode({
            "pa": upi_id,
            "pn": "St. Stephens CSI Church Puthuval",
            "am": f"{donation.amount:.2f}",
            "cu": "INR",
            "tn": f"Church donation {donation.id}",
        })

        upi_payment_url = f"upi://pay?{upi_parameters}"

        return Response(
            {
                "donation_id": donation.id,
                "amount": str(donation.amount),
                "currency": "INR",
                "payment_status": donation.payment_status,
                "upi_payment_url": upi_payment_url,
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
                {
                    "error": "Successful donation not found."
                },
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
