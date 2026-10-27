
from datetime import timedelta

from django.db import models
from django.utils import timezone


class PrayerHouseCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Prayer House Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class PrayerHouse(models.Model):
    category = models.ForeignKey(
        PrayerHouseCategory,
        on_delete=models.PROTECT,
        related_name="prayer_houses",
    )
    house_name = models.CharField(max_length=200)
    host_member_name = models.CharField(max_length=150)
    meeting_date = models.DateField()
    location_link = models.URLField(max_length=500, blank=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["meeting_date", "house_name"]

    def __str__(self):
        return f"{self.house_name} - {self.meeting_date}"

    @property
    def expires_at(self):
        return self.created_at + timedelta(days=30)

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at
