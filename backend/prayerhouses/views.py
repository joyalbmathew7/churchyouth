
from datetime import timedelta

from django.utils import timezone
from rest_framework import generics
from rest_framework.permissions import IsAdminUser, AllowAny

from .models import PrayerHouse, PrayerHouseCategory
from .serializers import (
    PrayerHouseSerializer,
    PrayerHouseCategorySerializer,
)


class PrayerHouseCategoryListCreateView(generics.ListCreateAPIView):
    queryset = PrayerHouseCategory.objects.all()
    serializer_class = PrayerHouseCategorySerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdminUser()]
        return [AllowAny()]


class PrayerHouseCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PrayerHouseCategory.objects.all()
    serializer_class = PrayerHouseCategorySerializer
    permission_classes = [IsAdminUser]


class PrayerHouseListCreateView(generics.ListCreateAPIView):
    serializer_class = PrayerHouseSerializer

    def get_queryset(self):
        expiry_date = timezone.now() - timedelta(days=30)

        return PrayerHouse.objects.filter(
            created_at__gte=expiry_date
        ).select_related("category")

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdminUser()]
        return [AllowAny()]


class PrayerHouseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PrayerHouse.objects.select_related("category").all()
    serializer_class = PrayerHouseSerializer
    permission_classes = [IsAdminUser]
