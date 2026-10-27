
from django.urls import path

from .views import (
    PrayerHouseCategoryListCreateView,
    PrayerHouseCategoryDetailView,
    PrayerHouseListCreateView,
    PrayerHouseDetailView,
)

urlpatterns = [
    # Categories
    path(
        "categories/",
        PrayerHouseCategoryListCreateView.as_view(),
        name="prayerhouse-category-list-create",
    ),
    path(
        "categories/<int:pk>/",
        PrayerHouseCategoryDetailView.as_view(),
        name="prayerhouse-category-detail",
    ),

    # Prayer houses
    path(
        "",
        PrayerHouseListCreateView.as_view(),
        name="prayerhouse-list-create",
    ),
    path(
        "<int:pk>/",
        PrayerHouseDetailView.as_view(),
        name="prayerhouse-detail",
    ),
]
