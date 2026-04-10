from django.contrib import admin
from django.urls import include, path, re_path
from rest_framework.routers import DefaultRouter

from core.views import (
    ClinicViewSet,
    AppointmentViewSet,
    ProfessionalViewSet,
    ClientViewSet,
    ServiceViewSet,
    availability_view,
    book_appointment,
    integration_settings_view,
    webhook_test_view,
    csrf_view,
    register_clinic_view,
    login_view,
    logout_view,
    me_view,
)

router = DefaultRouter()
router.trailing_slash = "/?"

router.register(r"clinics", ClinicViewSet, basename="clinic")
router.register(r"appointments", AppointmentViewSet, basename="appointment")
router.register(r"professionals", ProfessionalViewSet, basename="professional")
router.register(r"clients", ClientViewSet, basename="client")
router.register(r"services", ServiceViewSet, basename="service")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),

    re_path(r"^api/availability/?$", availability_view),
    re_path(r"^api/book-appointment/?$", book_appointment),

    re_path(r"^api/integrations/settings/?$", integration_settings_view),
    re_path(r"^api/integrations/test-webhook/?$", webhook_test_view),

    re_path(r"^api/auth/csrf/?$", csrf_view),
    re_path(r"^api/auth/register-clinic/?$", register_clinic_view),
    re_path(r"^api/auth/login/?$", login_view),
    re_path(r"^api/auth/logout/?$", logout_view),
    re_path(r"^api/auth/me/?$", me_view),
]