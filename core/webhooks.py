import requests

from .models import IntegrationSettings


def send_appointment_webhook(clinic, appointment, event_name: str):
    """
    Envia webhook de agendamento se a clínica tiver integração habilitada
    e o evento estiver configurado.
    """
    settings_obj = getattr(clinic, "integration_settings", None)

    if settings_obj is None:
      try:
          settings_obj = IntegrationSettings.objects.get(clinic=clinic)
      except IntegrationSettings.DoesNotExist:
          return False, "Integração não configurada."

    if not settings_obj.webhook_enabled:
        return False, "Webhook desativado."

    if not settings_obj.webhook_url:
        return False, "Webhook sem URL."

    configured_events = settings_obj.webhook_events or []
    if event_name not in configured_events:
        return False, "Evento não habilitado."

    payload = {
        "event": event_name,
        "source": "flowagenda",
        "clinic": {
            "id": clinic.id,
            "name": clinic.name,
        },
        "appointment": {
            "id": appointment.id,
            "status": appointment.status,
            "client_id": appointment.client_id,
            "client_name": appointment.client.name,
            "professional_id": appointment.professional_id,
            "professional_name": appointment.professional.name,
            "service_id": appointment.service_id,
            "service_name": appointment.service.name,
            "start_time": appointment.start_time.isoformat(),
            "end_time": appointment.end_time.isoformat(),
            "notes": appointment.notes or "",
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
        response.raise_for_status()
        return True, f"Webhook enviado ({event_name})."
    except requests.RequestException as exc:
        return False, str(exc)