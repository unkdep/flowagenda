from django.contrib import admin
from .models import *


@admin.register(Clinic)
class ClinicAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "clinic", "role")
    list_filter = ("role", "clinic")
    search_fields = ("user__username", "user__email")


@admin.register(Professional)
class ProfessionalAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "clinic", "user", "specialty", "active")
    list_filter = ("clinic", "active")
    search_fields = ("name", "specialty", "user__username", "user__email")


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "clinic", "duration")
    list_filter = ("clinic",)
    search_fields = ("name",)


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "email", "phone", "clinic")
    list_filter = ("clinic",)
    search_fields = ("name", "email", "phone")


@admin.register(Availability)
class AvailabilityAdmin(admin.ModelAdmin):
    list_display = ("professional", "day_of_week", "start_time", "end_time")
    list_filter = ("professional", "day_of_week")


@admin.register(Block)
class BlockAdmin(admin.ModelAdmin):
    list_display = ("professional", "start_datetime", "end_datetime", "reason")
    list_filter = ("professional",)


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "client",
        "professional",
        "service",
        "clinic",
        "start_time",
        "end_time",
        "status",
    )
    list_filter = ("status", "clinic", "professional")
    search_fields = ("client__name", "professional__name", "service__name")