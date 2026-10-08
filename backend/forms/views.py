from django.conf import settings
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
from .payment import create_razorpay_order, verify_payment

from django.http import FileResponse
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

        donation = serializer.save()

        order = create_razorpay_order(
            donation.amount,
            f"donation_{donation.id}",
        )

        donation.gateway_order_id = order["id"]
        donation.save(update_fields=["gateway_order_id"])

        return Response(
            {
                "donation_id": donation.id,
                "razorpay_order_id": order["id"],
                "razorpay_key_id": settings.RAZORPAY_KEY_ID,
                "amount": order["amount"],
                "currency": order["currency"],
            },
            status=status.HTTP_201_CREATED,
        )


class PaymentVerificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        donation_id = request.data.get("donation_id")

        razorpay_payment_id = request.data.get(
            "razorpay_payment_id"
        )

        razorpay_order_id = request.data.get(
            "razorpay_order_id"
        )

        razorpay_signature = request.data.get(
            "razorpay_signature"
        )

        if not all(
            [
                donation_id,
                razorpay_payment_id,
                razorpay_order_id,
                razorpay_signature,
            ]
        ):
            return Response(
                {"error": "Payment information is incomplete."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            donation = Donation.objects.get(
                id=donation_id
            )
        except Donation.DoesNotExist:
            return Response(
                {"error": "Donation not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if donation.gateway_order_id != razorpay_order_id:
            return Response(
                {"error": "Invalid payment order."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment_data = {
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_order_id": razorpay_order_id,
            "razorpay_signature": razorpay_signature,
        }

        try:
            verify_payment(payment_data)

        except Exception:
            donation.payment_status = "failed"
            donation.save(update_fields=["payment_status"])

            return Response(
                {"error": "Payment verification failed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        donation.payment_status = "success"
        donation.transaction_id = razorpay_payment_id

        donation.save(
            update_fields=[
                "payment_status",
                "transaction_id",
            ]
        )

        return Response(
            {
                "message": "Payment verified successfully.",
                "donation_id": donation.id,
                "payment_status": donation.payment_status,
                "transaction_id": donation.transaction_id,
            },
            status=status.HTTP_200_OK,
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

        response[
            "Content-Disposition"
        ] = (
            f'attachment; '
            f'filename="donation_receipt_{donation.id}.pdf"'
        )

        return response