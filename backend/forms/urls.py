from django.urls import path

from .views import (
    DonationPurposeListView,
    PrayerAreaListView,
    DonationCreateView,
    PaymentVerificationView,DonationReceiptView,
)


urlpatterns = [
    path(
        "purposes/",
        DonationPurposeListView.as_view(),
        name="donation-purposes",
    ),

    path(
        "prayer-areas/",
        PrayerAreaListView.as_view(),
        name="prayer-areas",
    ),

    path(
        "donations/",
        DonationCreateView.as_view(),
        name="create-donation",
    ),
    path(
    "payments/verify/",
    PaymentVerificationView.as_view(),
    name="verify-payment",
),
path(
    "donations/<int:donation_id>/receipt/",
    DonationReceiptView.as_view(),
    name="donation-receipt",
),
]