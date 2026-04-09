from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError


class Clinic(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class Profile(models.Model):
    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("staff", "Atendente"),
        ("professional", "Profissional"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)

    def __str__(self):
        return f"{self.user.username} - {self.role}"


class Professional(models.Model):
    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE)
    user = models.OneToOneField(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="professional_account",
    )
    name = models.CharField(max_length=255)
    specialty = models.CharField(max_length=255, blank=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Service(models.Model):
    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    duration = models.IntegerField(help_text="Duração em minutos")

    def __str__(self):
        return self.name


class Client(models.Model):
    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return self.name


class Availability(models.Model):
    professional = models.ForeignKey(Professional, on_delete=models.CASCADE)
    day_of_week = models.IntegerField()  # 0=segunda, 6=domingo
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return f"{self.professional.name} - dia {self.day_of_week}"


class Block(models.Model):
    professional = models.ForeignKey(Professional, on_delete=models.CASCADE)
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    reason = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"Bloqueio - {self.professional.name}"


class Appointment(models.Model):
    STATUS_CHOICES = [
        ("scheduled", "Agendado"),
        ("confirmed", "Confirmado"),
        ("pending", "Pendente"),
        ("completed", "Concluído"),
        ("cancelled", "Cancelado"),
    ]

    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE)
    professional = models.ForeignKey(Professional, on_delete=models.CASCADE)
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    service = models.ForeignKey(Service, on_delete=models.CASCADE)

    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="scheduled",
    )
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.client.name} - {self.start_time}"

    def clean(self):
        overlapping = Appointment.objects.filter(
            professional=self.professional,
            start_time__lt=self.end_time,
            end_time__gt=self.start_time,
        )

        if self.pk:
            overlapping = overlapping.exclude(pk=self.pk)

        if overlapping.exists():
            raise ValidationError(
                "Este profissional já possui um agendamento nesse horário."
            )

        if self.professional.clinic_id != self.clinic_id:
            raise ValidationError(
                "O profissional precisa pertencer à mesma clínica do agendamento."
            )

        if self.client.clinic_id != self.clinic_id:
            raise ValidationError(
                "O cliente precisa pertencer à mesma clínica do agendamento."
            )

        if self.service.clinic_id != self.clinic_id:
            raise ValidationError(
                "O serviço precisa pertencer à mesma clínica do agendamento."
            )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class IntegrationSettings(models.Model):
    clinic = models.OneToOneField(
        Clinic,
        on_delete=models.CASCADE,
        related_name="integration_settings",
    )

    api_external_enabled = models.BooleanField(default=True)

    webhook_enabled = models.BooleanField(default=False)
    webhook_url = models.URLField(blank=True)
    webhook_secret = models.CharField(max_length=255, blank=True)
    webhook_events = models.JSONField(default=list, blank=True)

    google_calendar_enabled = models.BooleanField(default=False)
    google_calendar_id = models.CharField(max_length=255, blank=True)
    google_calendar_sync_mode = models.CharField(
        max_length=20,
        default="read_write",
    )

    google_meet_enabled = models.BooleanField(default=False)
    google_meet_auto_create = models.BooleanField(default=True)
    google_meet_organizer_email = models.EmailField(blank=True)

    mcp_enabled = models.BooleanField(default=False)
    mcp_provider = models.CharField(max_length=100, blank=True)
    mcp_assistant_name = models.CharField(max_length=255, blank=True)
    mcp_endpoint = models.URLField(blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Integrações - {self.clinic.name}"