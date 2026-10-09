from decimal import Decimal
from html import escape
from io import BytesIO

from django.contrib import admin
from django.http import FileResponse, HttpResponseBadRequest
from django.urls import path, reverse
from django.utils.html import format_html
from django.shortcuts import get_object_or_404
from django.core.exceptions import PermissionDenied
from django.template.response import TemplateResponse
from django.utils import timezone
from django.utils.dateparse import parse_date
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import LongTable, Paragraph, SimpleDocTemplate, Spacer, TableStyle

from .models import Donation, DonationPurpose, PrayerArea
from .receipt import create_donation_receipt


admin.site.site_header = "St. Stephen's C.S.I Church, Puthuval"
admin.site.site_title = "Church Administration"
admin.site.index_title = "Church administration"


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
        "id",
        "name",
        "phone_number",
        "area_place",
        "prayer_area",
        "purpose",
        "amount",
        "payment_status",
        "transaction_id",
        "created_at",
        "download_receipt",
    )

    list_filter = (
        "prayer_area",
        "purpose",
        "payment_status",
        "created_at",
    )

    list_per_page = 25
    ordering = ("-created_at", "-id")

    search_fields = (
        "=id",
        "name",
        "phone_number",
        "transaction_id",
    )

    change_list_template = "admin/forms/donation/change_list.html"
    readonly_fields = (
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
    )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def get_urls(self):
        urls = super().get_urls()

        custom_urls = [
            path(
                "reports/",
                self.admin_site.admin_view(self.donation_report_filters),
                name="forms_donation_report_filters",
            ),
            path(
                "reports/pdf/",
                self.admin_site.admin_view(self.download_donation_report),
                name="forms_donation_report_pdf",
            ),
            path(
                "<int:donation_id>/download-receipt/",
                self.admin_site.admin_view(
                    self.download_receipt_view
                ),
                name="forms_donation_download_receipt",
            ),
        ]

        return custom_urls + urls

    def donation_report_filters(self, request):
        if not self.has_view_permission(request):
            raise PermissionDenied
        context = {
            **self.admin_site.each_context(request),
            "opts": self.model._meta,
            "prayer_areas": PrayerArea.objects.order_by("name"),
            "purposes": DonationPurpose.objects.order_by("name"),
            "payment_statuses": Donation._meta.get_field(
                "payment_status"
            ).choices,
            "title": "Donation report",
        }
        return TemplateResponse(
            request,
            "admin/forms/donation/report_filters.html",
            context,
        )

    def download_donation_report(self, request):
        if not self.has_view_permission(request):
            raise PermissionDenied
        start_date = self._report_date(request, "date_from")
        end_date = self._report_date(request, "date_to")
        if isinstance(start_date, HttpResponseBadRequest):
            return start_date
        if isinstance(end_date, HttpResponseBadRequest):
            return end_date
        if start_date and end_date and start_date > end_date:
            return HttpResponseBadRequest(
                "The start date must not be after the end date."
            )

        queryset = Donation.objects.select_related(
            "prayer_area", "purpose"
        )

        prayer_area = request.GET.get("prayer_area", "").strip()
        if prayer_area:
            if not prayer_area.isdecimal():
                return HttpResponseBadRequest("Invalid prayer area filter.")
            queryset = queryset.filter(prayer_area_id=int(prayer_area))

        purpose = request.GET.get("purpose", "").strip()
        if purpose:
            if not purpose.isdecimal():
                return HttpResponseBadRequest("Invalid purpose filter.")
            queryset = queryset.filter(purpose_id=int(purpose))

        status_filter = request.GET.get("payment_status", "").strip()
        valid_statuses = {
            choice[0]
            for choice in Donation._meta.get_field("payment_status").choices
        }
        if status_filter and status_filter not in valid_statuses:
            return HttpResponseBadRequest("Invalid payment status filter.")
        if status_filter:
            queryset = queryset.filter(payment_status=status_filter)
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)

        donations = list(queryset.order_by("created_at", "id"))
        verified = [d for d in donations if d.payment_status == "success"]
        verified_total = sum(
            (donation.amount for donation in verified), Decimal("0.00")
        )

        buffer = BytesIO()
        document = SimpleDocTemplate(
            buffer,
            pagesize=landscape(A4),
            rightMargin=12 * mm,
            leftMargin=12 * mm,
            topMargin=13 * mm,
            bottomMargin=13 * mm,
            title="St. Stephen's C.S.I Church, Puthuval - Donation Report",
        )
        styles = getSampleStyleSheet()
        body_style = ParagraphStyle(
            "ReportCell",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=7,
            leading=9,
            spaceAfter=0,
        )
        header_style = ParagraphStyle(
            "ReportHeader",
            parent=body_style,
            fontName="Helvetica-Bold",
            textColor=colors.white,
        )
        title_style = ParagraphStyle(
            "ChurchReportTitle",
            parent=styles["Title"],
            textColor=colors.HexColor("#702b3a"),
            alignment=TA_CENTER,
            fontName="Helvetica-Bold",
        )
        elements = [
            Paragraph(
                "St. Stephen's C.S.I Church, Puthuval",
                title_style,
            ),
            Paragraph("Donation report", styles["Heading2"]),
            Paragraph(
                "This report contains the records matching the selected filters. "
                "Only payments marked successful are included in the verified "
                "donation total.",
                body_style,
            ),
            Spacer(1, 4 * mm),
            Paragraph(
                f"Matching records: {len(donations)}"
                f" &nbsp;&nbsp; Verified transactions: {len(verified)}"
                f" &nbsp;&nbsp; Verified total: ₹{verified_total:,.2f}",
                styles["BodyText"],
            ),
            Spacer(1, 4 * mm),
        ]

        headers = [
            "Reference",
            "Donor",
            "Phone",
            "Area / Place",
            "Prayer area",
            "Purpose",
            "Amount",
            "Status",
            "Transaction ID",
            "Created",
        ]
        rows = [[Paragraph(escape(value), header_style) for value in headers]]

        for donation in donations:
            created = timezone.localtime(donation.created_at).strftime(
                "%d %b %Y %H:%M"
            )
            cells = [
                str(donation.pk),
                donation.name,
                donation.phone_number,
                donation.area_place or "—",
                donation.prayer_area.name if donation.prayer_area else "—",
                donation.purpose.name,
                f"₹{donation.amount:,.2f}",
                donation.get_payment_status_display(),
                donation.transaction_id or "—",
                created,
            ]
            rows.append(
                [Paragraph(escape(value), body_style) for value in cells]
            )

        if len(rows) == 1:
            rows.append(
                [Paragraph("No donations match these filters.", body_style)]
                + [Paragraph("", body_style) for _ in headers[1:]]
            )

        table = LongTable(
            rows,
            colWidths=[
                15 * mm,
                29 * mm,
                23 * mm,
                30 * mm,
                27 * mm,
                25 * mm,
                20 * mm,
                18 * mm,
                41 * mm,
                25 * mm,
            ],
            repeatRows=1,
            hAlign="LEFT",
        )
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#702b3a")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#d9d1d2")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    (
                        "ROWBACKGROUNDS",
                        (0, 1),
                        (-1, -1),
                        [colors.white, colors.HexColor("#f8f5f3")],
                    ),
                    ("LEFTPADDING", (0, 0), (-1, -1), 4),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        elements.append(table)
        document.build(elements)
        buffer.seek(0)

        response = FileResponse(
            buffer,
            content_type="application/pdf",
            as_attachment=True,
            filename="church-donation-report.pdf",
        )
        return response

    @staticmethod
    def _report_date(request, field_name):
        value = request.GET.get(field_name, "").strip()
        if not value:
            return None
        parsed = parse_date(value)
        if parsed is None:
            return HttpResponseBadRequest(
                f"Invalid {field_name.replace('_', ' ')}."
            )
        return parsed

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