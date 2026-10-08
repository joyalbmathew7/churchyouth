from django.contrib import admin
from django.http import FileResponse
from django.urls import path, reverse
from django.utils.html import format_html
from django.shortcuts import get_object_or_404
from django.core.exceptions import PermissionDenied

from .models import Donation, DonationPurpose, PrayerArea
from .receipt import create_donation_receipt


@admin.register(DonationPurpose)
class DonationPurposeAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name",)


@admin.register(PrayerArea)
class PrayerAreaAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name",)


@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "phone_number",
        "prayer_area",
        "purpose",
        "amount",
        "payment_status",
        "created_at",
        "download_receipt",
    )

    list_filter = (
        "prayer_area",
        "purpose",
        "payment_status",
        "created_at",
    )

    search_fields = (
        "name",
        "phone_number",
        "transaction_id",
    )

    def get_urls(self):
        urls = super().get_urls()

        custom_urls = [
            path(
                "<int:donation_id>/download-receipt/",
                self.admin_site.admin_view(
                    self.download_receipt_view
                ),
                name="forms_donation_download_receipt",
            ),
        ]

        return custom_urls + urls

    @admin.display(description="Receipt")
    def download_receipt(self, obj):
        if obj.payment_status != "success":
            return "Not paid"

        url = reverse(
            "admin:forms_donation_download_receipt",
            args=[obj.pk],
        )

        return format_html(
            '<a href="{}">Download PDF</a>',
            url,
        )

    def download_receipt_view(self, request, donation_id):
        donation = get_object_or_404(
            Donation,
            pk=donation_id,
            payment_status="success",
        )

        if not self.has_view_permission(request, donation):
            raise PermissionDenied

        pdf = create_donation_receipt(donation)

        return FileResponse(
            pdf,
            content_type="application/pdf",
            as_attachment=True,
            filename=f"donation_receipt_{donation.id}.pdf",
        )