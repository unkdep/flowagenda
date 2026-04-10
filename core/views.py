from datetime import datetime, timedelta
import requests

from django.contrib.auth import login, logout, get_user_model
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie

from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import (
    Clinic,
    Appointment,
    Professional,
    Client,
    Service,
    Profile,
    IntegrationSettings,
)
from .serializers import (
    ClinicSerializer,
    AppointmentSerializer,
    ProfessionalSerializer,
    ClientSerializer,
    ServiceSerializer,
    RegisterClinicSerializer,
    IntegrationSettingsSerializer,
)

User = get_user_model()


# ========================
# HELPERS
# ========================

def get_user_clinic(user):
    profile = getattr(user, "profile", None)
    if not profile:
        return None
    return profile.clinic


def build_user_payload(user):
    profile = getattr(user, "profile", None)
    clinic = profile.clinic if profile else None
    professional = getattr(user, "professional_account", None)

    full_name = " ".join(
        part for part in [user.first_name, user.last_name] if part
    ).strip()

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": full_name or user.username,
        "clinic_id": clinic.id if clinic else None,
        "clinic_name": clinic.name if clinic else None,
        "role": profile.role if profile else None,
        "professional_id": professional.id if professional else None,
        "professional_name": professional.name if professional else None,
    }


# ========================
# AUTH
# ========================

@ensure_csrf_cookie
@api_view(["GET"])
@permission_classes([AllowAny])
def csrf_view(request):
    return Response({"csrfToken": get_token(request)})


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""

    if not email or not password:
        return Response({"error": "Informe e-mail e senha."}, status=400)

    # 🔥 CORREÇÃO AQUI (LOGIN POR EMAIL)
    user = User.objects.filter(email=email).first()

    if not user:
        return Response({"error": "Usuário não encontrado."}, status=400)

    if not user.check_password(password):
        return Response({"error": "Senha inválida."}, status=400)

    login(request, user)

    return Response({
        "message": "Login realizado com sucesso.",
        "user": build_user_payload(user),
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def register_clinic_view(request):
    serializer = RegisterClinicSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    result = serializer.save()

    user = result["user"]
    login(request, user)

    return Response(
        {
            "message": "Clínica registrada com sucesso.",
            "user": build_user_payload(user),
        },
        status=201,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({"message": "Logout realizado com sucesso."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    return Response({"user": build_user_payload(request.user)})


# ========================
# VIEWSETS (CRUD)
# ========================

class ClinicViewSet(viewsets.ModelViewSet):
    queryset = Clinic.objects.all()
    serializer_class = ClinicSerializer
    permission_classes = [IsAuthenticated]


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        clinic = get_user_clinic(self.request.user)
        if not clinic:
            return Appointment.objects.none()
        return Appointment.objects.filter(clinic=clinic)

    def perform_create(self, serializer):
        clinic = get_user_clinic(self.request.user)
        serializer.save(clinic=clinic)


class ProfessionalViewSet(viewsets.ModelViewSet):
    serializer_class = ProfessionalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        clinic = get_user_clinic(self.request.user)
        if not clinic:
            return Professional.objects.none()
        return Professional.objects.filter(clinic=clinic)


class ClientViewSet(viewsets.ModelViewSet):
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        clinic = get_user_clinic(self.request.user)
        if not clinic:
            return Client.objects.none()
        return Client.objects.filter(clinic=clinic)


class ServiceViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        clinic = get_user_clinic(self.request.user)
        if not clinic:
            return Service.objects.none()
        return Service.objects.filter(clinic=clinic)