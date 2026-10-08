from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.lib import colors
from django.utils import timezone

def create_donation_receipt(donation):
    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()

    title_style = styles["Title"]
    normal_style = styles["Normal"]

    elements = []

    elements.append(
        Paragraph(
            "St. Stephen CSI PUTHUVAL",
            title_style,
        )
    )

    elements.append(
        Paragraph(
            "Donation Receipt",
            styles["Heading2"],
        )
    )

    elements.append(Spacer(1, 10 * mm))

    data = [
        ["Receipt Number", f"DON-{donation.id}"],
        ["Donor Name", donation.name],
        ["Phone Number", donation.phone_number],
        ["Area / Place", donation.area_place],
        [
            "Prayer Area",
            donation.prayer_area.name
            if donation.prayer_area
            else "Not specified",
        ],
        ["Donation Purpose", donation.purpose.name],
        ["Amount", f"₹ {donation.amount}"],
        ["Payment Status", donation.payment_status],
        [
            "Transaction ID",
            donation.transaction_id or "N/A",
        ],
        [
            "date and time",
            timezone.localtime(donation.created_at).strftime(
                "%d %B %Y, %I:%M %p"
            ),
        ],
    ]

    table = Table(
        data,
        colWidths=[50 * mm, 110 * mm],
    )

    table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (0, -1),
                    colors.lightgrey,
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.grey,
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP",
                ),
                (
                    "PADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
            ]
        )
    )

    elements.append(table)

    elements.append(Spacer(1, 15 * mm))

    elements.append(
        Paragraph(
            "Thank you for your generous donation.",
            normal_style,
        )
    )

    document.build(elements)

    buffer.seek(0)

    return buffer