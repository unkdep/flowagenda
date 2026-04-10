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


def build_appointment_webhook_payload(event_name, clinic, appointment):
    return {
        "event": event_name,
        "source": "flowagenda",
        "timestamp": timezone.now().isoformat(),
        "clinic": {
            "id": clinic.id,
            "name": clinic.name,
        },
        "appointment": {
            "id": appointment.id,
            "status": appointment.status,
            "client_name": appointment.client.name if appointment.client else "",
            "professional_name": appointment.professional.name if appointment.professional else "",
            "service_name": appointment.service.name if appointment.service else "",
            "start_time": appointment.start_time.isoformat() if appointment.start_time else None,
            "end_time": appointment.end_time.isoformat() if appointment.end_time else None,
            "notes": appointment.notes or "",
        },
    }


def send_webhook_event(clinic, appointment, event_name):
    settings_obj = IntegrationSettings.objects.filter(clinic=clinic).first()

    if not settings_obj or not settings_obj.webhook_url:
        return

    payload = build_appointment_webhook_payload(event_name, clinic, appointment)

    headers = {
        "Content-Type": "application/json",
    }

    if settings_obj.webhook_secret:
        headers["X-FlowAgenda-Secret"] = settings_obj.webhook_secret

    try:
        requests.post(
            settings_obj.webhook_url,
            json=payload,
            headers=headers,
            timeout=10,
        )
    except requests.RequestException:
        pass


def get_update_event_name(old_status, new_status):
    if new_status == "cancelled" and old_status != "cancelled":
        return "appointment.cancelled"

    if new_status == "completed" and old_status != "completed":
        return "appointment.completed"

    return "appointment.updated"


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

    user = User.objects.filter(email=email).first()

    if not user:
        return Response({"error": "Usuário não encontrado."}, status=400)

    if not user.check_password(password):
        return Response({"error": "Senha inválida."}, status=400)

    login(request, user)

    return Response(
        {
            "message": "Login realizado com sucesso.",
            "user": build_user_payload(user),
        }
    )


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
        return Appointment.objects.filter(clinic=clinic).select_related(
            "client", "professional", "service", "clinic"
        ).order_by("-start_time")

    def perform_create(self, serializer):
        clinic = get_user_clinic(self.request.user)
        appointment = serializer.save(clinic=clinic)
        send_webhook_event(clinic, appointment, "appointment.created")

    def perform_update(self, serializer):
        old_appointment = self.get_object()
        old_status = old_appointment.status

        appointment = serializer.save()

        event_name = get_update_event_name(old_status, appointment.status)
        send_webhook_event(appointment.clinic, appointment, event_name)

    def perform_destroy(self, instance):
        clinic = instance.clinic
        instance.status = "cancelled"
        instance.save(update_fields=["status"])
        send_webhook_event(clinic, instance, "appointment.cancelled")
        instance.delete()


class ProfessionalViewSet(viewsets.ModelViewSet):
    serializer_class = ProfessionalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        clinic = get_user_clinic(self.request.user)
        if not clinic:
            return Professional.objects.none()
        return Professional.objects.filter(clinic=clinic).order_by("name")

    def perform_create(self, serializer):
        clinic = get_user_clinic(self.request.user)
        serializer.save(clinic=clinic)


class ClientViewSet(viewsets.ModelViewSet):
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        clinic = get_user_clinic(self.request.user)
        if not clinic:
            return Client.objects.none()
        return Client.objects.filter(clinic=clinic).order_by("name")

    def perform_create(self, serializer):
        clinic = get_user_clinic(self.request.user)
        serializer.save(clinic=clinic)


class ServiceViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        clinic = get_user_clinic(self.request.user)
        if not clinic:
            return Service.objects.none()
        return Service.objects.filter(clinic=clinic).order_by("name")

    def perform_create(self, serializer):
        clinic = get_user_clinic(self.request.user)
        serializer.save(clinic=clinic)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def availability_view(request):
    clinic = get_user_clinic(request.user)
    if not clinic:
        return Response({"error": "Clínica não encontrada."}, status=400)

    professional_id = request.GET.get("professional_id")
    date_str = request.GET.get("date")

    if not professional_id or not date_str:
        return Response(
            {"error": "professional_id e date são obrigatórios."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    professional = get_object_or_404(
        Professional,
        id=professional_id,
        clinic=clinic,
    )

    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return Response({"error": "Data inválida."}, status=400)

    start_hour = 8
    end_hour = 18
    slot_minutes = 30

    taken = Appointment.objects.filter(
        clinic=clinic,
        professional=professional,
        start_time__date=target_date,
        status__in=["scheduled", "confirmed", "pending"],
    ).values_list("start_time", flat=True)

    taken_times = {dt.strftime("%H:%M") for dt in taken}

    slots = []
    current = datetime.combine(target_date, datetime.min.time()).replace(
        hour=start_hour,
        minute=0,
    )
    last = current.replace(hour=end_hour, minute=0)

    while current < last:
        label = current.strftime("%H:%M")
        if label not in taken_times:
            slots.append(label)
        current += timedelta(minutes=slot_minutes)

    return Response(
        {
            "professional_id": professional.id,
            "professional_name": professional.name,
            "date": date_str,
            "available": slots,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def book_appointment(request):
    clinic = get_user_clinic(request.user)
    if not clinic:
        return Response({"error": "Clínica não encontrada."}, status=400)

    professional_id = request.data.get("professional_id")
    client_id = request.data.get("client_id")
    service_id = request.data.get("service_id")
    date = request.data.get("date")
    time_str = request.data.get("time") or request.data.get("start_time")
    notes = request.data.get("notes", "")

    if not all([professional_id, client_id, service_id, date, time_str]):
        return Response(
            {"error": "Campos obrigatórios faltando."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        professional = Professional.objects.get(id=professional_id, clinic=clinic)
        client = Client.objects.get(id=client_id, clinic=clinic)
        service = Service.objects.get(id=service_id, clinic=clinic)

        naive_start = datetime.strptime(f"{date} {time_str}", "%Y-%m-%d %H:%M")
        start_dt = timezone.make_aware(
            naive_start,
            timezone.get_current_timezone(),
        )
        end_dt = start_dt + timedelta(minutes=service.duration)
    except Professional.DoesNotExist:
        return Response({"error": "Profissional inválido."}, status=400)
    except Client.DoesNotExist:
        return Response({"error": "Cliente inválido."}, status=400)
    except Service.DoesNotExist:
        return Response({"error": "Serviço inválido."}, status=400)
    except ValueError:
        return Response({"error": "Data ou horário inválido."}, status=400)

    appointment = Appointment(
        clinic=clinic,
        professional=professional,
        client=client,
        service=service,
        start_time=start_dt,
        end_time=end_dt,
        status="scheduled",
        notes=notes,
    )

    try:
        appointment.save()
    except Exception as exc:
        return Response({"error": str(exc)}, status=400)

    send_webhook_event(clinic, appointment, "appointment.created")

    serializer = AppointmentSerializer(appointment)
    return Response(serializer.data, status=201)


@api_view(["GET", "PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def integration_settings_view(request):
    clinic = get_user_clinic(request.user)
    if not clinic:
        return Response({"error": "Clínica não encontrada."}, status=400)

    settings_obj, _ = IntegrationSettings.objects.get_or_create(clinic=clinic)

    if request.method == "GET":
        serializer = IntegrationSettingsSerializer(settings_obj)
        return Response(serializer.data)

    partial = request.method == "PATCH"
    serializer = IntegrationSettingsSerializer(
        settings_obj,
        data=request.data,
        partial=partial,
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def webhook_test_view(request):
    clinic = get_user_clinic(request.user)
    if not clinic:
        return Response({"error": "Clínica não encontrada."}, status=400)

    settings_obj, _ = IntegrationSettings.objects.get_or_create(clinic=clinic)

    if not settings_obj.webhook_url:
        return Response({"error": "Webhook não configurado."}, status=400)

    payload = {
        "event": "appointment.test",
        "source": "flowagenda",
        "timestamp": timezone.now().isoformat(),
        "clinic": {
            "id": clinic.id,
            "name": clinic.name,
        },
        "appointment": {
            "id": 999999,
            "status": "confirmed",
            "client_name": "Cliente Teste",
            "professional_name": "Profissional Teste",
            "service_name": "Consulta inicial",
            "start_time": timezone.now().isoformat(),
        },
    }

    headers = {
        "Content-Type": "application/json",
    }

    if settings_obj.webhook_secret:
        headers["X-FlowAgenda-Secret"] = settings_obj.webhook_secret

    try:
        response = requests.post(
            settings_obj.webhook_url,
            json=payload,
            headers=headers,
            timeout=10,
        )

        return Response(
            {
                "success": True,
                "message": "Webhook enviado com sucesso.",
                "status_code": response.status_code,
                "payload_preview": payload,
            }
        )
    except requests.RequestException as exc:
        return Response(
            {
                "error": f"Falha ao enviar webhook: {str(exc)}",
            },
            status=500,
        )