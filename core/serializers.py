from django.contrib.auth.models import User
from rest_framework import serializers

from .models import (
    Appointment,
    Professional,
    Client,
    Service,
    Clinic,
    Profile,
    IntegrationSettings,
)


class ClinicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clinic
        fields = "__all__"


class ProfileSerializer(serializers.ModelSerializer):
    clinic_name = serializers.CharField(source="clinic.name", read_only=True)

    class Meta:
        model = Profile
        fields = ["id", "clinic", "clinic_name", "role"]


class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]


class RegisterClinicSerializer(serializers.Serializer):
    clinic_name = serializers.CharField(max_length=255)
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)

    def validate_email(self, value):
        email = value.strip().lower()

        if User.objects.filter(username=email).exists() or User.objects.filter(email=email).exists():
            raise serializers.ValidationError("Já existe uma conta com este e-mail.")

        return email

    def create(self, validated_data):
        clinic = Clinic.objects.create(name=validated_data["clinic_name"].strip())
        IntegrationSettings.objects.create(clinic=clinic)

        full_name = validated_data["full_name"].strip()
        email = validated_data["email"].strip().lower()
        password = validated_data["password"]

        parts = full_name.split()
        first_name = parts[0] if parts else ""
        last_name = " ".join(parts[1:]) if len(parts) > 1 else ""

        user = User(
            username=email,
            email=email,
            first_name=first_name,
            last_name=last_name,
        )
        user.set_password(password)
        user.save()

        Profile.objects.create(
            user=user,
            clinic=clinic,
            role="admin",
        )

        return {
            "clinic": clinic,
            "user": user,
        }


class ProfessionalSerializer(serializers.ModelSerializer):
    clinic_name = serializers.CharField(source="clinic.name", read_only=True)
    account = UserBasicSerializer(source="user", read_only=True)

    class Meta:
        model = Professional
        fields = [
            "id",
            "clinic",
            "clinic_name",
            "user",
            "account",
            "name",
            "specialty",
            "active",
        ]
        read_only_fields = ["clinic", "clinic_name", "user", "account"]


class ClientSerializer(serializers.ModelSerializer):
    clinic_name = serializers.CharField(source="clinic.name", read_only=True)

    class Meta:
        model = Client
        fields = ["id", "clinic", "clinic_name", "name", "email", "phone"]
        read_only_fields = ["clinic", "clinic_name"]


class ServiceSerializer(serializers.ModelSerializer):
    clinic_name = serializers.CharField(source="clinic.name", read_only=True)

    class Meta:
        model = Service
        fields = ["id", "clinic", "clinic_name", "name", "duration"]
        read_only_fields = ["clinic", "clinic_name"]


class AppointmentSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source="client.name", read_only=True)
    professional_name = serializers.CharField(source="professional.name", read_only=True)
    service_name = serializers.CharField(source="service.name", read_only=True)
    clinic_name = serializers.CharField(source="clinic.name", read_only=True)

    class Meta:
        model = Appointment
        fields = [
            "id",
            "clinic",
            "clinic_name",
            "professional",
            "professional_name",
            "client",
            "client_name",
            "service",
            "service_name",
            "start_time",
            "end_time",
            "status",
            "notes",
        ]
        read_only_fields = ["clinic", "clinic_name"]


class IntegrationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntegrationSettings
        fields = [
            "api_external_enabled",
            "webhook_enabled",
            "webhook_url",
            "webhook_secret",
            "webhook_events",
            "google_calendar_enabled",
            "google_calendar_id",
            "google_calendar_sync_mode",
            "google_meet_enabled",
            "google_meet_auto_create",
            "google_meet_organizer_email",
            "mcp_enabled",
            "mcp_provider",
            "mcp_assistant_name",
            "mcp_endpoint",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]