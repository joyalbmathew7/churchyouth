from django.db.models import Count, Sum
from django.urls import reverse
from django.utils import timezone

from .models import Donation


def admin_dashboard(request):
    if (
        request.path.rstrip("/") != "/joyaladmin"
        or not request.user.has_perm("forms.view_donation")
    ):
        return {}

    now = timezone.localtime()
    month_start = now.replace(
        day=1,
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )
    verified = Donation.objects.filter(payment_status="success")

    def distribution(field_name):
        groups = list(
            verified.values(f"{field_name}__name")
            .annotate(count=Count("id"), total=Sum("amount"))
            .order_by("-total", f"{field_name}__name")
        )
        largest_total = max(
            (group["total"] or 0 for group in groups),
            default=0,
        )
        for group in groups:
            group["name"] = group.pop(f"{field_name}__name") or "Not specified"
            group["percentage"] = (
                round(float(group["total"] / largest_total * 100))
                if largest_total
                else 0
            )
        return groups

    return {
        "church_dashboard": {
            "verified_total": verified.aggregate(total=Sum("amount"))["total"]
            or 0,
            "verified_count": verified.count(),
            "month_total": verified.filter(
                created_at__gte=month_start
            ).aggregate(total=Sum("amount"))["total"]
            or 0,
            "pending_count": Donation.objects.filter(
                payment_status="pending"
            ).count(),
            "purpose_groups": distribution("purpose"),
            "prayer_area_groups": distribution("prayer_area"),
            "donation_url": reverse("admin:forms_donation_changelist"),
            "purpose_url": reverse("admin:forms_donationpurpose_changelist"),
            "prayer_area_url": reverse("admin:forms_prayerarea_changelist"),
        },
    }
