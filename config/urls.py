from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from core.views import (
    ClinicViewSet,
    AppointmentViewSet,
    ProfessionalViewSet,
    ClientViewSet,
    ServiceViewSet,
    availability_view,
    book_appointment,
    register_clinic_view,
    login_view,
    logout_view,
    me_view,
    csrf_view,
    integration_settings_view,
    webhook_test_view,
)

router = DefaultRouter()
router.register(r"clinics", ClinicViewSet, basename="clinic")
router.register(r"appointments", AppointmentViewSet, basename="appointment")
router.register(r"professionals", ProfessionalViewSet, basename="professional")
router.register(r"clients", ClientViewSet, basename="client")
router.register(r"services", ServiceViewSet, basename="service")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path("api/availability/", availability_view),
    path("api/book-appointment/", book_appointment),

    path("api/integrations/settings/", integration_settings_view),
    path("api/integrations/test-webhook/", webhook_test_view),

    path("api/auth/csrf/", csrf_view),
    path("api/auth/register-clinic/", register_clinic_view),
    path("api/auth/login/", login_view),
    path("api/auth/logout/", logout_view),
    path("api/auth/me/", me_view),
]