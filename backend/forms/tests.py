from io import BytesIO
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from django.test.utils import override_settings

from .models import Donation, DonationPurpose, PrayerArea


@override_settings(
    STORAGES={
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
        },
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }
)
class ChurchAdminDashboardTests(TestCase):
    def setUp(self):
        self.prayer_area = PrayerArea.objects.create(name="Puthuval")
        self.purpose = DonationPurpose.objects.create(name="Community support")
        Donation.objects.create(
            name="Verified Donor",
            phone_number="9876543210",
            area_place="Puthuval",
            prayer_area=self.prayer_area,
            purpose=self.purpose,
            amount=Decimal("500.00"),
            payment_status="success",
            transaction_id="pay_verified",
        )
        Donation.objects.create(
            name="Pending Donor",
            phone_number="9876543211",
            area_place="Puthuval",
            prayer_area=self.prayer_area,
            purpose=self.purpose,
            amount=Decimal("200.00"),
            payment_status="pending",
        )
        self.admin_user = get_user_model().objects.create_user(
            username="church-admin",
            password="a-long-test-only-password",
            is_staff=True,
            is_superuser=True,
        )

    def test_unauthenticated_dashboard_redirects_to_admin_login(self):
        response = self.client.get("/joyaladmin/")

        self.assertEqual(response.status_code, 302)
        self.assertIn("/joyaladmin/login/", response["Location"])

    def test_admin_login_requires_csrf_and_valid_credentials(self):
        client = Client(enforce_csrf_checks=True)
        login_page = client.get("/joyaladmin/login/")
        csrf_token = login_page.cookies["csrftoken"].value

        response = client.post(
            "/joyaladmin/login/",
            {
                "username": self.admin_user.username,
                "password": "a-long-test-only-password",
                "csrfmiddlewaretoken": csrf_token,
                "next": "/joyaladmin/",
            },
        )

        self.assertEqual(response.status_code, 302)
        self.assertIn("/joyaladmin/", response["Location"])
        self.assertEqual(client.get("/joyaladmin/").status_code, 200)

    def test_admin_logout_ends_the_authenticated_session(self):
        self.client.force_login(self.admin_user)

        logout_response = self.client.post("/joyaladmin/logout/")
        dashboard_response = self.client.get("/joyaladmin/")

        self.assertIn(logout_response.status_code, (200, 302))
        self.assertEqual(dashboard_response.status_code, 302)
        self.assertIn("/joyaladmin/login/", dashboard_response["Location"])

    def test_admin_dashboard_uses_only_verified_records_for_totals(self):
        self.client.force_login(self.admin_user)

        response = self.client.get("/joyaladmin/")

        self.assertEqual(response.status_code, 200)
        dashboard = response.context["church_dashboard"]
        self.assertEqual(dashboard["verified_count"], 1)
        self.assertEqual(dashboard["verified_total"], Decimal("500.00"))
        self.assertEqual(dashboard["pending_count"], 1)
        self.assertContains(response, "St. Stephen's C.S.I Church, Puthuval")

    def test_existing_admin_route_remains_available(self):
        self.client.force_login(self.admin_user)

        response = self.client.get("/admin/")

        self.assertEqual(response.status_code, 200)

    def test_report_download_requires_staff_login(self):
        response = self.client.get("/joyaladmin/forms/donation/reports/pdf/")

        self.assertEqual(response.status_code, 302)
        self.assertIn("/joyaladmin/login/", response["Location"])

    def test_report_pdf_is_generated_for_selected_filters(self):
        self.client.force_login(self.admin_user)

        response = self.client.get(
            "/joyaladmin/forms/donation/reports/pdf/",
            {
                "prayer_area": self.prayer_area.pk,
                "purpose": self.purpose.pk,
                "payment_status": "pending",
            },
        )

        content = b"".join(response.streaming_content)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertTrue(content.startswith(b"%PDF"))

    def test_report_filter_page_is_available_to_an_authorized_admin(self):
        self.client.force_login(self.admin_user)

        response = self.client.get("/joyaladmin/forms/donation/reports/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Filter donation report")
        self.assertContains(response, "Puthuval")

    def test_staff_without_donation_permission_cannot_view_reports_or_totals(self):
        staff_user = get_user_model().objects.create_user(
            username="limited-staff",
            password="a-long-test-only-password",
            is_staff=True,
        )
        self.client.force_login(staff_user)

        dashboard = self.client.get("/joyaladmin/")
        report = self.client.get(
            "/joyaladmin/forms/donation/reports/pdf/"
        )

        self.assertEqual(dashboard.status_code, 200)
        self.assertNotIn("church_dashboard", dashboard.context)
        self.assertEqual(report.status_code, 403)

    def test_donations_cannot_be_added_or_deleted_from_admin(self):
        self.client.force_login(self.admin_user)

        add_response = self.client.get("/joyaladmin/forms/donation/add/")
        delete_response = self.client.get(
            "/joyaladmin/forms/donation/1/delete/"
        )

        self.assertEqual(add_response.status_code, 403)
        self.assertEqual(delete_response.status_code, 403)

    def test_report_download_is_a_pdf_and_filters_by_payment_status(self):
        self.client.force_login(self.admin_user)

        response = self.client.get(
            "/joyaladmin/forms/donation/reports/pdf/",
            {"payment_status": "success"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")
        pdf_content = b"".join(response.streaming_content)
        self.assertTrue(pdf_content.startswith(b"%PDF"))

    def test_report_rejects_invalid_status_filter(self):
        self.client.force_login(self.admin_user)

        response = self.client.get(
            "/joyaladmin/forms/donation/reports/pdf/",
            {"payment_status": "cancelled"},
        )

        self.assertEqual(response.status_code, 400)

    def test_report_rejects_invalid_date_range(self):
        self.client.force_login(self.admin_user)

        response = self.client.get(
            "/joyaladmin/forms/donation/reports/pdf/",
            {"date_from": "2026-10-10", "date_to": "2026-10-01"},
        )

        self.assertEqual(response.status_code, 400)

    def test_public_prayer_area_and_purpose_lists_remain_available(self):
        prayer_areas = self.client.get("/api/v1/forms/prayer-areas/")
        purposes = self.client.get("/api/v1/forms/purposes/")

        self.assertEqual(prayer_areas.status_code, 200)
        self.assertEqual(prayer_areas.json()[0]["name"], "Puthuval")
        self.assertEqual(purposes.status_code, 200)
        self.assertEqual(purposes.json()[0]["name"], "Community support")

    @patch("forms.views.create_razorpay_order")
    def test_donation_creation_keeps_the_existing_razorpay_order_contract(
        self, create_order
    ):
        create_order.return_value = {
            "id": "order_test",
            "amount": 50000,
            "currency": "INR",
        }

        response = self.client.post(
            "/api/v1/forms/donations/",
            {
                "name": "Donor",
                "phone_number": "9876543210",
                "area_place": "Puthuval",
                "prayer_area": self.prayer_area.pk,
                "purpose": self.purpose.pk,
                "amount": "500.00",
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(payload["razorpay_order_id"], "order_test")
        self.assertEqual(payload["amount"], 50000)
        self.assertEqual(payload["currency"], "INR")
        donation = Donation.objects.get(pk=payload["donation_id"])
        self.assertEqual(donation.payment_status, "pending")
        self.assertEqual(donation.gateway_order_id, "order_test")

    @patch("forms.views.create_razorpay_order")
    def test_authenticated_donation_post_requires_and_accepts_csrf_header(
        self, create_order
    ):
        create_order.return_value = {
            "id": "order_csrf_test",
            "amount": 50000,
            "currency": "INR",
        }
        client = Client(enforce_csrf_checks=True)
        login_page = client.get("/joyaladmin/login/")
        csrf_token = login_page.cookies["csrftoken"].value
        client.force_login(self.admin_user)
        payload = {
            "name": "CSRF Donor",
            "phone_number": "9876543210",
            "area_place": "Puthuval",
            "prayer_area": self.prayer_area.pk,
            "purpose": self.purpose.pk,
            "amount": "500.00",
        }

        missing_header_response = client.post(
            "/api/v1/forms/donations/",
            payload,
            content_type="application/json",
        )
        valid_header_response = client.post(
            "/api/v1/forms/donations/",
            payload,
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )

        self.assertEqual(missing_header_response.status_code, 403)
        self.assertEqual(valid_header_response.status_code, 201)

    @patch("forms.views.verify_payment")
    def test_payment_is_marked_success_only_after_backend_verification(
        self, verify_payment
    ):
        donation = Donation.objects.create(
            name="Payment Donor",
            phone_number="9876543210",
            area_place="Puthuval",
            prayer_area=self.prayer_area,
            purpose=self.purpose,
            amount=Decimal("500.00"),
            gateway_order_id="order_test",
        )

        response = self.client.post(
            "/api/v1/forms/payments/verify/",
            {
                "donation_id": donation.pk,
                "razorpay_payment_id": "pay_test",
                "razorpay_order_id": "order_test",
                "razorpay_signature": "signature_test",
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["payment_status"], "success")
        donation.refresh_from_db()
        self.assertEqual(donation.payment_status, "success")
        self.assertEqual(donation.transaction_id, "pay_test")
        verify_payment.assert_called_once()

    @patch("forms.views.create_donation_receipt")
    def test_receipt_download_stays_limited_to_successful_donations(
        self, create_receipt
    ):
        create_receipt.return_value = BytesIO(b"%PDF test receipt")
        verified = Donation.objects.get(name="Verified Donor")
        pending = Donation.objects.get(name="Pending Donor")

        response = self.client.get(
            f"/api/v1/forms/donations/{verified.pk}/receipt/"
        )
        pending_response = self.client.get(
            f"/api/v1/forms/donations/{pending.pk}/receipt/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertEqual(pending_response.status_code, 404)
