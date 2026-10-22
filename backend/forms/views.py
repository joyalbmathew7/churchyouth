
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

            donation.gateway_order_id = order["id"]
            donation.save(update_fields=["gateway_order_id"])

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


class DonationVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        donation_id = request.data.get("donation_id")
        razorpay_order_id = request.data.get("razorpay_order_id")
        razorpay_payment_id = request.data.get("razorpay_payment_id")
        razorpay_signature = request.data.get("razorpay_signature")

        if not all([
            donation_id,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        ]):
            return Response(
                {"error": "Missing payment verification details."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            donation = Donation.objects.get(id=donation_id)
        except Donation.DoesNotExist:
            return Response(
                {"error": "Donation not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Make sure the order belongs to this donation.
        if donation.gateway_order_id != razorpay_order_id:
            return Response(
                {"error": "Order does not match this donation."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Don't verify or process the same donation again.
        if donation.payment_status == "success":
            return Response(
                {"error": "This donation is already marked successful."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            client = razorpay.Client(
                auth=(
                    settings.RAZORPAY_KEY_ID,
                    settings.RAZORPAY_KEY_SECRET,
                )
            )

            client.utility.verify_payment_signature({
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature,
            })

            # Confirm payment status with Razorpay's API as well.
            payment = client.payment.fetch(razorpay_payment_id)

            if (
                payment.get("order_id") != razorpay_order_id
                or payment.get("status") != "captured"
                or int(payment.get("amount", 0)) != int(donation.amount * 100)
                or payment.get("currency") != "INR"
            ):
                return Response(
                    {"error": "Payment is not captured or does not match."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            donation.payment_status = "success"
            donation.transaction_id = razorpay_payment_id
            donation.save(
                update_fields=["payment_status", "transaction_id"]
            )

            return Response({
                "message": "Payment verified successfully.",
                "donation_id": donation.id,
                "payment_status": donation.payment_status,
                "receipt_url": f"/api/v1/forms/donations/{donation.id}/receipt/",
            })

        except razorpay.errors.SignatureVerificationError:
            return Response(
                {"error": "Invalid payment signature."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception:
            logger.exception("Razorpay payment verification failed")
            return Response(
                {"error": "Unable to verify payment. Please contact the church."},
                status=status.HTTP_502_BAD_GATEWAY,
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
