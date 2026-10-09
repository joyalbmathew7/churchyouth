from django.contrib import admin
from django.urls import include, path


urlpatterns = [
    path("joyaladmin/", admin.site.urls),
    path(
        "admin/",
        include((admin.site.get_urls(), "admin"), namespace="legacy_admin"),
    ),

    path(
        "api/v1/forms/",
        include("forms.urls"),
    ),
]