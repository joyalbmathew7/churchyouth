from django.db import models


class DonationPurpose(models.Model):
    name = models.CharField(max_length=150, unique=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class PrayerArea(models.Model):
    name = models.CharField(max_length=150, unique=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Donation(models.Model):
    name = models.CharField(max_length=150)

    phone_number = models.CharField(max_length=20)

    area_place = models.CharField(max_length=150,blank=True)

    prayer_area = models.ForeignKey(
        PrayerArea,
        on_delete=models.PROTECT,
        # max_length=150,
        blank=True,
        null=True,
         related_name="donations"
    )

    purpose = models.ForeignKey(
        DonationPurpose,
        on_delete=models.PROTECT,
        related_name="donations"
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    payment_status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("success", "Success"),
            ("failed", "Failed"),
        ],
        default="pending"
    )
    gateway_order_id = models.CharField(
    max_length=200,
    blank=True,
    null=True
)

    transaction_id = models.CharField(
        max_length=200,
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - ₹{self.amount}"