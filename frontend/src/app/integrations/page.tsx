"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutShell } from "../components/layout-shell";
import styles from "./integrations.module.css";
import { apiFetch } from "../lib/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type IntegrationStatus = "configured" | "not_configured" | "testing";

type WebhookEvents = {
  appointment_created: boolean;
  appointment_updated: boolean;
  appointment_cancelled: boolean;
  appointment_completed: boolean;
};

type WebhookConfig = {
  url: string;
  secret: string;
  events: WebhookEvents;
};

type GoogleCalendarConfig = {
  enabled: boolean;
  calendarId: string;
  syncMode: "read_write" | "read_only";
};

type GoogleMeetConfig = {
  enabled: boolean;
  autoCreateMeet: boolean;
  organizerEmail: string;
};

type McpConfig = {
  enabled: boolean;
  provider: string;
  assistantName: string;
  endpoint: string;
};

type IntegrationSettingsResponse = {
  api_external_enabled: boolean;
  webhook_enabled: boolean;
  webhook_url: string;
  webhook_secret: string;
  webhook_events: string[];
  google_calendar_enabled: boolean;
  google_calendar_id: string;
  google_calendar_sync_mode: "read_write" | "read_only";
  google_meet_enabled: boolean;
  google_meet_auto_create: boolean;
  google_meet_organizer_email: string;
  mcp_enabled: boolean;
  mcp_provider: string;
  mcp_assistant_name: string;
  mcp_endpoint: string;
  updated_at: string;
};

type WebhookTestResponse = {
  success?: boolean;
  message?: string;
  status_code?: number;
  payload_preview?: unknown;
  error?: string;
};

const WEBHOOK_STORAGE_KEY = "flowagenda:webhook-config";
const GCAL_STORAGE_KEY = "flowagenda:gcal-config";
const GMEET_STORAGE_KEY = "flowagenda:gmeet-config";
const MCP_STORAGE_KEY = "flowagenda:mcp-config";

const defaultWebhookConfig: WebhookConfig = {
  url: "",
  secret: "",
  events: {
    appointment_created: true,
    appointment_updated: true,
    appointment_cancelled: true,
    appointment_completed: true,
  },
};

const defaultGoogleCalendarConfig: GoogleCalendarConfig = {
  enabled: false,
  calendarId: "",
  syncMode: "read_write",
};

const defaultGoogleMeetConfig: GoogleMeetConfig = {
  enabled: false,
  autoCreateMeet: true,
  organizerEmail: "",
};

const defaultMcpConfig: McpConfig = {
  enabled: false,
  provider: "OpenAI",
  assistantName: "Assistente FlowAgenda",
  endpoint: "",
};

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function saveStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function eventsArrayToObject(events: string[]): WebhookEvents {
  return {
    appointment_created: events.includes("appointment_created"),
    appointment_updated: events.includes("appointment_updated"),
    appointment_cancelled: events.includes("appointment_cancelled"),
    appointment_completed: events.includes("appointment_completed"),
  };
}

export default function IntegrationsPage() {
  const [apiTestStatus, setApiTestStatus] =
    useState<IntegrationStatus>("not_configured");
  const [apiMessage, setApiMessage] = useState("");

  const [webhookConfig, setWebhookConfig] =
    useState<WebhookConfig>(defaultWebhookConfig);
  const [webhookStatus, setWebhookStatus] =
    useState<IntegrationStatus>("not_configured");
  const [webhookMessage, setWebhookMessage] = useState("");

  const [googleCalendarConfig, setGoogleCalendarConfig] =
    useState<GoogleCalendarConfig>(defaultGoogleCalendarConfig);
  const [googleCalendarMessage, setGoogleCalendarMessage] = useState("");

  const [googleMeetConfig, setGoogleMeetConfig] =
    useState<GoogleMeetConfig>(defaultGoogleMeetConfig);
  const [googleMeetMessage, setGoogleMeetMessage] = useState("");

  const [mcpConfig, setMcpConfig] = useState<McpConfig>(defaultMcpConfig);
  const [mcpMessage, setMcpMessage] = useState("");

  useEffect(() => {
    setWebhookConfig(readStorage(WEBHOOK_STORAGE_KEY, defaultWebhookConfig));
    setGoogleCalendarConfig(
      readStorage(GCAL_STORAGE_KEY, defaultGoogleCalendarConfig)
    );
    setGoogleMeetConfig(readStorage(GMEET_STORAGE_KEY, defaultGoogleMeetConfig));
    setMcpConfig(readStorage(MCP_STORAGE_KEY, defaultMcpConfig));
  }, []);

  useEffect(() => {
    async function loadIntegrationSettings() {
      try {
        const data = await apiFetch<IntegrationSettingsResponse>(
          "/api/integrations/settings/",
          { method: "GET" }
        );

        const webhookFromApi: WebhookConfig = {
          url: data.webhook_url || "",
          secret: data.webhook_secret || "",
          events: eventsArrayToObject(data.webhook_events || []),
        };

        const gcalFromApi: GoogleCalendarConfig = {
          enabled: data.google_calendar_enabled,
          calendarId: data.google_calendar_id || "",
          syncMode: data.google_calendar_sync_mode || "read_write",
        };

        const gmeetFromApi: GoogleMeetConfig = {
          enabled: data.google_meet_enabled,
          autoCreateMeet: data.google_meet_auto_create,
          organizerEmail: data.google_meet_organizer_email || "",
        };

        const mcpFromApi: McpConfig = {
          enabled: data.mcp_enabled,
          provider: data.mcp_provider || "OpenAI",
          assistantName: data.mcp_assistant_name || "Assistente FlowAgenda",
          endpoint: data.mcp_endpoint || "",
        };

        setWebhookConfig(webhookFromApi);
        setGoogleCalendarConfig(gcalFromApi);
        setGoogleMeetConfig(gmeetFromApi);
        setMcpConfig(mcpFromApi);

        saveStorage(WEBHOOK_STORAGE_KEY, webhookFromApi);
        saveStorage(GCAL_STORAGE_KEY, gcalFromApi);
        saveStorage(GMEET_STORAGE_KEY, gmeetFromApi);
        saveStorage(MCP_STORAGE_KEY, mcpFromApi);
      } catch {
        // mantém fallback local
      }
    }

    loadIntegrationSettings();
  }, []);

  const webhookEnabledEvents = useMemo(() => {
    return Object.entries(webhookConfig.events)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key);
  }, [webhookConfig.events]);

  async function handleCopyApiUrl() {
    try {
      await navigator.clipboard.writeText(`${API_BASE_URL}/api/`);
      setApiMessage("Base URL copiada.");
    } catch {
      setApiMessage("Não foi possível copiar a URL.");
    }
  }

  async function handleTestApi() {
    setApiTestStatus("testing");
    setApiMessage("Testando API...");

    try {
      await apiFetch("/api/", { method: "GET" });
      setApiTestStatus("configured");
      setApiMessage("API respondendo normalmente.");
    } catch (error) {
      setApiTestStatus("not_configured");
      setApiMessage(
        error instanceof Error
          ? `Falha ao testar API: ${error.message}`
          : "Falha ao testar API."
      );
    }
  }

  function updateWebhookField<K extends keyof WebhookConfig>(
    field: K,
    value: WebhookConfig[K]
  ) {
    setWebhookConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function updateWebhookEvent<K extends keyof WebhookEvents>(
    event: K,
    value: WebhookEvents[K]
  ) {
    setWebhookConfig((prev) => ({
      ...prev,
      events: {
        ...prev.events,
        [event]: value,
      },
    }));
  }

  async function handleSaveWebhook() {
    if (!webhookConfig.url.trim()) {
      setWebhookStatus("not_configured");
      setWebhookMessage("Informe a URL do webhook.");
      return;
    }

    if (!isValidHttpUrl(webhookConfig.url.trim())) {
      setWebhookStatus("not_configured");
      setWebhookMessage("Informe uma URL válida.");
      return;
    }

    if (webhookEnabledEvents.length === 0) {
      setWebhookStatus("not_configured");
      setWebhookMessage("Selecione ao menos um evento.");
      return;
    }

    const normalized: WebhookConfig = {
      ...webhookConfig,
      url: webhookConfig.url.trim(),
      secret: webhookConfig.secret.trim(),
    };

    try {
      await apiFetch<IntegrationSettingsResponse>("/api/integrations/settings/", {
        method: "PATCH",
        body: {
          webhook_enabled: true,
          webhook_url: normalized.url,
          webhook_secret: normalized.secret,
          webhook_events: webhookEnabledEvents,
        },
      });

      setWebhookConfig(normalized);
      saveStorage(WEBHOOK_STORAGE_KEY, normalized);
      setWebhookStatus("configured");
      setWebhookMessage("Webhook salvo com sucesso.");
    } catch (error) {
      setWebhookStatus("not_configured");
      setWebhookMessage(
        error instanceof Error ? error.message : "Erro ao salvar webhook."
      );
    }
  }

  async function handleTestWebhook() {
    if (!webhookConfig.url.trim()) {
      setWebhookStatus("not_configured");
      setWebhookMessage("Informe a URL do webhook antes de testar.");
      return;
    }

    if (!isValidHttpUrl(webhookConfig.url.trim())) {
      setWebhookStatus("not_configured");
      setWebhookMessage("A URL do webhook é inválida.");
      return;
    }

    setWebhookStatus("testing");
    setWebhookMessage("Testando webhook...");

    try {
      await apiFetch<IntegrationSettingsResponse>("/api/integrations/settings/", {
        method: "PATCH",
        body: {
          webhook_enabled: true,
          webhook_url: webhookConfig.url.trim(),
          webhook_secret: webhookConfig.secret.trim(),
          webhook_events: webhookEnabledEvents,
        },
      });

      const data = await apiFetch<WebhookTestResponse>(
        "/api/integrations/test-webhook/",
        {
          method: "POST",
        }
      );

      if (!data?.success) {
        throw new Error(data?.error || "Erro ao testar webhook.");
      }

      setWebhookStatus("configured");
      setWebhookMessage(data.message || "Webhook enviado com sucesso.");
    } catch (error) {
      setWebhookStatus("not_configured");
      setWebhookMessage(
        error instanceof Error ? error.message : "Falha ao testar webhook."
      );
    }
  }

  function handleSaveGoogleCalendar() {
    const normalized: GoogleCalendarConfig = {
      ...googleCalendarConfig,
      calendarId: googleCalendarConfig.calendarId.trim(),
    };

    saveStorage(GCAL_STORAGE_KEY, normalized);
    setGoogleCalendarConfig(normalized);
    setGoogleCalendarMessage("Configuração do Google Calendar salva.");
  }

  function handleSaveGoogleMeet() {
    const normalized: GoogleMeetConfig = {
      ...googleMeetConfig,
      organizerEmail: googleMeetConfig.organizerEmail.trim(),
    };

    saveStorage(GMEET_STORAGE_KEY, normalized);
    setGoogleMeetConfig(normalized);
    setGoogleMeetMessage("Configuração do Google Meet salva.");
  }

  function handleSaveMcp() {
    const normalized: McpConfig = {
      ...mcpConfig,
      assistantName: mcpConfig.assistantName.trim(),
      endpoint: mcpConfig.endpoint.trim(),
    };

    saveStorage(MCP_STORAGE_KEY, normalized);
    setMcpConfig(normalized);
    setMcpMessage("Configuração de assistente salva.");
  }

  return (
    <LayoutShell eyebrow="Configurações" title="Integrações">
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            Configurações
          </div>
          <h1 className={styles.pageTitle}>Integrações</h1>
          <p className={styles.pageDesc}>
            Centralize conexões, automações e serviços externos da plataforma.
          </p>
        </div>

        <div className={styles.cards}>
          <article className={`${styles.card} ${styles.cardTeal}`}>
            <div className={styles.cardTop}>
              <div className={styles.cardMeta}>
                <span className={styles.tag}>API</span>
                <div className={styles.cardTitle}>API Externa</div>
              </div>
              <span
                className={`${styles.badge} ${
                  apiTestStatus === "configured" ? styles.badgeActive : ""
                }`}
              >
                {apiTestStatus === "testing"
                  ? "Testando"
                  : apiTestStatus === "configured"
                  ? "Conectada"
                  : "Disponível"}
              </span>
            </div>

            <p className={styles.cardDesc}>
              Endpoint REST para integrações com sistemas externos, automações,
              painéis e parceiros.
            </p>

            <div className={styles.codeBox}>
              <div className={styles.codeLabel}>Base URL</div>
              <code>{`${API_BASE_URL}/api/`}</code>
            </div>

            {apiMessage ? <p className={styles.messageLight}>{apiMessage}</p> : null}

            <div className={styles.actions}>
              <button className={styles.btnGhost} type="button" onClick={handleTestApi}>
                Testar API
              </button>
              <button className={styles.btnSolid} type="button" onClick={handleCopyApiUrl}>
                Copiar URL
              </button>
            </div>
          </article>

          <article className={`${styles.card} ${styles.cardSlate}`}>
            <div className={styles.cardTop}>
              <div className={styles.cardMeta}>
                <span className={styles.tag}>Webhook</span>
                <div className={styles.cardTitle}>Webhooks</div>
              </div>
              <span
                className={`${styles.badge} ${
                  webhookStatus === "configured" ? styles.badgeActive : ""
                }`}
              >
                {webhookStatus === "testing"
                  ? "Testando"
                  : webhookStatus === "configured"
                  ? "Configurado"
                  : "Não configurado"}
              </span>
            </div>

            <p className={styles.cardDesc}>
              Envie notificações automáticas para outros sistemas quando eventos
              importantes acontecerem na agenda.
            </p>

            <div className={styles.formStack}>
              <div className={styles.field}>
                <label>URL do Webhook</label>
                <input
                  type="text"
                  placeholder="https://seusistema.com/webhook"
                  value={webhookConfig.url}
                  onChange={(e) => updateWebhookField("url", e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label>Chave secreta</label>
                <input
                  type="text"
                  placeholder="Opcional"
                  value={webhookConfig.secret}
                  onChange={(e) => updateWebhookField("secret", e.target.value)}
                />
              </div>

              <div>
                <div className={styles.eventsLabel}>Eventos</div>
                <div className={styles.checkboxGrid}>
                  <label className={styles.cbItem}>
                    <input
                      type="checkbox"
                      checked={webhookConfig.events.appointment_created}
                      onChange={(e) =>
                        updateWebhookEvent("appointment_created", e.target.checked)
                      }
                    />
                    appointment.created
                  </label>

                  <label className={styles.cbItem}>
                    <input
                      type="checkbox"
                      checked={webhookConfig.events.appointment_updated}
                      onChange={(e) =>
                        updateWebhookEvent("appointment_updated", e.target.checked)
                      }
                    />
                    appointment.updated
                  </label>

                  <label className={styles.cbItem}>
                    <input
                      type="checkbox"
                      checked={webhookConfig.events.appointment_cancelled}
                      onChange={(e) =>
                        updateWebhookEvent("appointment_cancelled", e.target.checked)
                      }
                    />
                    appointment.cancelled
                  </label>

                  <label className={styles.cbItem}>
                    <input
                      type="checkbox"
                      checked={webhookConfig.events.appointment_completed}
                      onChange={(e) =>
                        updateWebhookEvent("appointment_completed", e.target.checked)
                      }
                    />
                    appointment.completed
                  </label>
                </div>
              </div>
            </div>

            {webhookMessage ? (
              <p className={styles.messageLight}>{webhookMessage}</p>
            ) : null}

            <div className={styles.actions}>
              <button className={styles.btnErr} type="button" onClick={handleTestWebhook}>
                Testar webhook
              </button>
              <button className={styles.btnSolid} type="button" onClick={handleSaveWebhook}>
                Salvar
              </button>
            </div>
          </article>

          <article className={`${styles.card} ${styles.cardMoss}`}>
            <div className={styles.cardTop}>
              <div className={styles.cardMeta}>
                <span className={styles.tag}>Google</span>
                <div className={styles.cardTitle}>Google Calendar</div>
              </div>
              <span
                className={`${styles.badge} ${
                  googleCalendarConfig.enabled ? styles.badgeActive : ""
                }`}
              >
                {googleCalendarConfig.enabled ? "Configurado" : "Pronto para configurar"}
              </span>
            </div>

            <p className={styles.cardDesc}>
              Prepare a sincronização da agenda com calendários externos para leitura
              e atualização de eventos.
            </p>

            <div className={styles.formStack}>
              <label className={styles.cbItem}>
                <input
                  type="checkbox"
                  checked={googleCalendarConfig.enabled}
                  onChange={(e) =>
                    setGoogleCalendarConfig((prev) => ({
                      ...prev,
                      enabled: e.target.checked,
                    }))
                  }
                />
                Ativar sincronização
              </label>

              <div className={styles.field}>
                <label>Calendar ID</label>
                <input
                  type="text"
                  placeholder="primary ou email do calendário"
                  value={googleCalendarConfig.calendarId}
                  onChange={(e) =>
                    setGoogleCalendarConfig((prev) => ({
                      ...prev,
                      calendarId: e.target.value,
                    }))
                  }
                />
              </div>

              <div className={styles.field}>
                <label>Modo</label>
                <select
                  className={styles.selectField}
                  value={googleCalendarConfig.syncMode}
                  onChange={(e) =>
                    setGoogleCalendarConfig((prev) => ({
                      ...prev,
                      syncMode: e.target.value as "read_write" | "read_only",
                    }))
                  }
                >
                  <option value="read_write">Leitura e escrita</option>
                  <option value="read_only">Somente leitura</option>
                </select>
              </div>
            </div>

            {googleCalendarMessage ? (
              <p className={styles.messageLight}>{googleCalendarMessage}</p>
            ) : null}

            <div className={styles.actions}>
              <button className={styles.btnGhost} type="button">
                Revisar credenciais
              </button>
              <button className={styles.btnSolid} type="button" onClick={handleSaveGoogleCalendar}>
                Salvar
              </button>
            </div>
          </article>

          <article className={`${styles.card} ${styles.cardAmber}`}>
            <div className={styles.cardTop}>
              <div className={styles.cardMeta}>
                <span className={styles.tag}>Meet</span>
                <div className={styles.cardTitle}>Google Meet</div>
              </div>
              <span
                className={`${styles.badge} ${
                  googleMeetConfig.enabled ? styles.badgeActive : ""
                }`}
              >
                {googleMeetConfig.enabled ? "Configurado" : "Pronto para configurar"}
              </span>
            </div>

            <p className={styles.cardDesc}>
              Estruture a criação automática de links de reunião para atendimentos
              online e sessões remotas.
            </p>

            <div className={styles.formStack}>
              <label className={styles.cbItem}>
                <input
                  type="checkbox"
                  checked={googleMeetConfig.enabled}
                  onChange={(e) =>
                    setGoogleMeetConfig((prev) => ({
                      ...prev,
                      enabled: e.target.checked,
                    }))
                  }
                />
                Ativar geração de links
              </label>

              <label className={styles.cbItem}>
                <input
                  type="checkbox"
                  checked={googleMeetConfig.autoCreateMeet}
                  onChange={(e) =>
                    setGoogleMeetConfig((prev) => ({
                      ...prev,
                      autoCreateMeet: e.target.checked,
                    }))
                  }
                />
                Criar link automaticamente ao agendar
              </label>

              <div className={styles.field}>
                <label>E-mail organizador</label>
                <input
                  type="text"
                  placeholder="organizador@empresa.com"
                  value={googleMeetConfig.organizerEmail}
                  onChange={(e) =>
                    setGoogleMeetConfig((prev) => ({
                      ...prev,
                      organizerEmail: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {googleMeetMessage ? (
              <p className={styles.messageLight}>{googleMeetMessage}</p>
            ) : null}

            <div className={styles.actions}>
              <button className={styles.btnGhost} type="button">
                Revisar regras
              </button>
              <button className={styles.btnSolid} type="button" onClick={handleSaveGoogleMeet}>
                Salvar
              </button>
            </div>
          </article>

          <article className={`${styles.card} ${styles.cardOffwhite}`}>
            <div className={styles.cardTop}>
              <div className={styles.cardMeta}>
                <span className={`${styles.tag} ${styles.tagDark}`}>IA</span>
                <div className={`${styles.cardTitle} ${styles.cardTitleDark}`}>
                  MCP / Assistentes
                </div>
              </div>
              <span className={`${styles.badge} ${styles.badgeDark}`}>
                Estrutura pronta
              </span>
            </div>

            <p className={`${styles.cardDesc} ${styles.cardDescDark}`}>
              Configure a base para assistentes, copilotos e orquestração de fluxos
              com IA aplicada ao atendimento e operação.
            </p>

            <div className={styles.formStack}>
              <label className={`${styles.cbItem} ${styles.cbItemDark}`}>
                <input
                  type="checkbox"
                  checked={mcpConfig.enabled}
                  onChange={(e) =>
                    setMcpConfig((prev) => ({
                      ...prev,
                      enabled: e.target.checked,
                    }))
                  }
                />
                Ativar assistente
              </label>

              <div className={styles.fieldDark}>
                <label>Fornecedor</label>
                <input
                  type="text"
                  placeholder="OpenAI, interno, parceiro"
                  value={mcpConfig.provider}
                  onChange={(e) =>
                    setMcpConfig((prev) => ({
                      ...prev,
                      provider: e.target.value,
                    }))
                  }
                />
              </div>

              <div className={styles.fieldDark}>
                <label>Nome do assistente</label>
                <input
                  type="text"
                  placeholder="Assistente FlowAgenda"
                  value={mcpConfig.assistantName}
                  onChange={(e) =>
                    setMcpConfig((prev) => ({
                      ...prev,
                      assistantName: e.target.value,
                    }))
                  }
                />
              </div>

              <div className={styles.fieldDark}>
                <label>Endpoint do orquestrador</label>
                <input
                  type="text"
                  placeholder="https://assistente.suaempresa.com"
                  value={mcpConfig.endpoint}
                  onChange={(e) =>
                    setMcpConfig((prev) => ({
                      ...prev,
                      endpoint: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {mcpMessage ? (
              <p className={styles.messageDark}>{mcpMessage}</p>
            ) : null}

            <div className={`${styles.divider} ${styles.dividerDark}`} />

            <div className={styles.actions}>
              <button className={styles.btnGhostDark} type="button">
                Revisar arquitetura
              </button>
              <button className={styles.btnSolidDark} type="button" onClick={handleSaveMcp}>
                Salvar
              </button>
            </div>
          </article>
        </div>
      </div>
    </LayoutShell>
  );
}