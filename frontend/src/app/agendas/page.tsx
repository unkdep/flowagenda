"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LayoutShell } from "../components/layout-shell";
import { apiFetch } from "@/app/lib/api";
import styles from "./agendas.module.css";

type AppointmentApiItem = {
  id: number;
  client?: number | { id?: number; name?: string; full_name?: string };
  professional?: number | { id?: number; name?: string; full_name?: string };
  service?: number | { id?: number; name?: string; title?: string };
  client_name?: string;
  professional_name?: string;
  service_name?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
};

type ProfessionalItem = {
  id: number;
  name?: string;
  full_name?: string;
};

type ClientItem = {
  id: number;
  name?: string;
  full_name?: string;
};

type ServiceItem = {
  id: number;
  name?: string;
  title?: string;
  duration?: number;
};

type Appointment = {
  id: number;
  client: string;
  professional: string;
  service: string;
  date: string;
  time: string;
  endTime?: string;
  status: string;
};

type CreateFormState = {
  professional_id: string;
  client_id: string;
  service_id: string;
  date: string;
  start_time: string;
};

const HISTORY_PAGE_SIZE = 6;

function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDisplayName(
  item: ProfessionalItem | ClientItem | ServiceItem
): string {
  if ("title" in item && item.title) return item.title;
  if ("name" in item && item.name) return item.name;
  if ("full_name" in item && item.full_name) return item.full_name;
  return `Item #${item.id}`;
}

function initials(name: string) {
  if (!name) return "?";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatDate(value?: string) {
  if (!value) return "--/--/----";
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("pt-BR");
  }
  if (value.includes("T")) {
    return value.split("T")[0];
  }
  return value;
}

function formatTime(value?: string) {
  if (!value) return "--:--";
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  const match = value.match(/(\d{2}):(\d{2})/);
  if (match) return `${match[1]}:${match[2]}`;
  return "--:--";
}

function isValidDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTimeString(value: string) {
  return /^\d{2}:\d{2}$/.test(value);
}

function getNestedName(
  value:
    | number
    | { id?: number; name?: string; full_name?: string; title?: string }
    | undefined
) {
  if (!value || typeof value === "number") return undefined;
  return value.name || value.full_name || value.title;
}

export default function AgendasPage() {
  const [data, setData] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalItem[]>([]);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);

  const [selected, setSelected] = useState<Appointment | null>(null);
  const [editMode, setEditMode] = useState(false);

  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [creatingAppointment, setCreatingAppointment] = useState(false);
  const [quickCancellingId, setQuickCancellingId] = useState<number | null>(null);
  const [quickCompletingId, setQuickCompletingId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [feedback, setFeedback] = useState("");
  const [createFeedback, setCreateFeedback] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // History pagination
  const [historyVisible, setHistoryVisible] = useState(HISTORY_PAGE_SIZE);
  const [historyAtBottom, setHistoryAtBottom] = useState(false);
  const historyListRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<CreateFormState>({
    professional_id: "",
    client_id: "",
    service_id: "",
    date: getTodayDate(),
    start_time: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setFeedback("");

      const [
        appointmentsResponse,
        professionalsResponse,
        clientsResponse,
        servicesResponse,
      ] = await Promise.all([
        apiFetch<AppointmentApiItem[]>("/api/appointments/"),
        apiFetch<ProfessionalItem[]>("/api/professionals/"),
        apiFetch<ClientItem[]>("/api/clients/"),
        apiFetch<ServiceItem[]>("/api/services/"),
      ]);

      const mappedAppointments = (
        Array.isArray(appointmentsResponse) ? appointmentsResponse : []
      ).map((item) => ({
        id: item.id,
        client:
          item.client_name ||
          getNestedName(item.client) ||
          "Cliente não informado",
        professional:
          item.professional_name ||
          getNestedName(item.professional) ||
          "Profissional não informado",
        service:
          item.service_name ||
          getNestedName(item.service) ||
          "Serviço não informado",
        date: formatDate(item.date ?? item.start_time),
        time: formatTime(item.start_time),
        endTime: formatTime(item.end_time),
        status: item.status ?? "scheduled",
      }));

      setData(mappedAppointments);
      setProfessionals(
        Array.isArray(professionalsResponse) ? professionalsResponse : []
      );
      setClients(Array.isArray(clientsResponse) ? clientsResponse : []);
      setServices(Array.isArray(servicesResponse) ? servicesResponse : []);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao carregar os dados da agenda.";
      setFeedback(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(
    () => ({
      total: data.length,
      scheduled: data.filter((d) => d.status === "scheduled").length,
      confirmed: data.filter((d) => d.status === "confirmed").length,
      pending: data.filter((d) => d.status === "pending").length,
      completed: data.filter((d) => d.status === "completed").length,
      cancelled: data.filter((d) => d.status === "cancelled").length,
    }),
    [data]
  );

  const visibleAppointments = useMemo(
    () =>
      data.filter((item) =>
        ["scheduled", "confirmed", "pending"].includes(item.status)
      ),
    [data]
  );

  const historyAppointments = useMemo(
    () =>
      data.filter((item) =>
        ["completed", "cancelled"].includes(item.status)
      ),
    [data]
  );

  const filteredVisible = useMemo(
    () =>
      visibleAppointments.filter((item) => {
        const term = search.toLowerCase().trim();
        const matchSearch =
          item.client.toLowerCase().includes(term) ||
          item.professional.toLowerCase().includes(term) ||
          item.service.toLowerCase().includes(term) ||
          item.date.toLowerCase().includes(term);
        const matchStatus =
          statusFilter === "all" || item.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [visibleAppointments, search, statusFilter]
  );

  const filteredHistory = useMemo(
    () =>
      historyAppointments.filter((item) => {
        const term = search.toLowerCase().trim();
        return (
          item.client.toLowerCase().includes(term) ||
          item.professional.toLowerCase().includes(term) ||
          item.service.toLowerCase().includes(term) ||
          item.date.toLowerCase().includes(term)
        );
      }),
    [historyAppointments, search]
  );

  const visibleHistory = useMemo(
    () => filteredHistory.slice(0, historyVisible),
    [filteredHistory, historyVisible]
  );

  const historyRemaining = filteredHistory.length - historyVisible;
  const hasMoreHistory = historyRemaining > 0;

  function handleLoadMoreHistory() {
    setHistoryVisible((prev) => prev + HISTORY_PAGE_SIZE);
    setTimeout(() => {
      historyListRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 50);
  }

  function handleHistoryScroll() {
    if (!historyListRef.current) return;
    const { scrollHeight, scrollTop, clientHeight } = historyListRef.current;
    setHistoryAtBottom(scrollHeight - scrollTop - clientHeight < 10);
  }

  const selectedService = useMemo(
    () => services.find((s) => String(s.id) === form.service_id),
    [services, form.service_id]
  );

  function getStatusLabel(status: string) {
    const map: Record<string, string> = {
      scheduled: "Agendado",
      confirmed: "Confirmado",
      pending: "Pendente",
      completed: "Concluído",
      cancelled: "Cancelado",
    };
    return map[status] ?? status;
  }

  function getStatusClass(status: string) {
    const map: Record<string, string> = {
      scheduled: styles.statusScheduled,
      confirmed: styles.statusConfirmed,
      pending: styles.statusPending,
      completed: styles.statusCompleted,
      cancelled: styles.statusCancelled,
    };
    return `${styles.statusBadge} ${map[status] ?? styles.statusScheduled}`;
  }

  function updateField<K extends keyof CreateFormState>(
    field: K,
    value: CreateFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (createFeedback) setCreateFeedback("");
  }

  function resetCreateForm() {
    setForm({
      professional_id: "",
      client_id: "",
      service_id: "",
      date: getTodayDate(),
      start_time: "",
    });
    setCreateFeedback("");
  }

  function getMissingFields(currentForm: CreateFormState) {
    const missing: string[] = [];
    if (!currentForm.professional_id) missing.push("profissional");
    if (!currentForm.client_id) missing.push("cliente");
    if (!currentForm.service_id) missing.push("serviço");
    if (!currentForm.date) missing.push("data");
    if (!currentForm.start_time) missing.push("horário de início");
    return missing;
  }

  async function handleCreateAppointment() {
    if (creatingAppointment) return;
    const missingFields = getMissingFields(form);
    if (missingFields.length > 0) {
      setCreateFeedback(`Preencha os campos obrigatórios: ${missingFields.join(", ")}.`);
      return;
    }
    if (!isValidDateString(form.date)) {
      setCreateFeedback("A data está em formato inválido.");
      return;
    }
    if (!isValidTimeString(form.start_time)) {
      setCreateFeedback("O horário de início está em formato inválido.");
      return;
    }
    try {
      setCreatingAppointment(true);
      setCreateFeedback("");
      setFeedback("");
      await apiFetch("/api/book-appointment/", {
        method: "POST",
        body: {
          professional_id: Number(form.professional_id),
          client_id: Number(form.client_id),
          service_id: Number(form.service_id),
          date: form.date,
          time: form.start_time,
        },
      });
      resetCreateForm();
      setShowCreateForm(false);
      setFeedback("Agendamento criado com sucesso.");
      await fetchData();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível criar o agendamento.";
      setCreateFeedback(message);
    } finally {
      setCreatingAppointment(false);
    }
  }

  async function handleUpdateStatus() {
    if (!selected) return;
    try {
      setSavingStatus(true);
      setFeedback("");
      await apiFetch(`/api/appointments/${selected.id}/`, {
        method: "PATCH",
        body: { status: selected.status },
      });
      setSelected(null);
      setEditMode(false);
      setFeedback("Status atualizado com sucesso.");
      await fetchData();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao atualizar o status do agendamento.";
      setFeedback(message);
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleQuickCancel(id: number) {
    const confirmed = window.confirm("Cancelar este agendamento?");
    if (!confirmed) return;
    try {
      setQuickCancellingId(id);
      setFeedback("");
      await apiFetch(`/api/appointments/${id}/`, {
        method: "PATCH",
        body: { status: "cancelled" },
      });
      if (selected?.id === id) setSelected({ ...selected, status: "cancelled" });
      setFeedback("Agendamento cancelado com sucesso.");
      await fetchData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao cancelar o agendamento.";
      setFeedback(message);
    } finally {
      setQuickCancellingId(null);
    }
  }

  async function handleQuickComplete(id: number) {
    const confirmed = window.confirm("Marcar este agendamento como concluído?");
    if (!confirmed) return;
    try {
      setQuickCompletingId(id);
      setFeedback("");
      await apiFetch(`/api/appointments/${id}/`, {
        method: "PATCH",
        body: { status: "completed" },
      });
      if (selected?.id === id) setSelected({ ...selected, status: "completed" });
      setFeedback("Agendamento concluído com sucesso.");
      await fetchData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao concluir o agendamento.";
      setFeedback(message);
    } finally {
      setQuickCompletingId(null);
    }
  }

  async function handleModalCancel() {
    if (!selected) return;
    try {
      setSavingStatus(true);
      setFeedback("");
      await apiFetch(`/api/appointments/${selected.id}/`, {
        method: "PATCH",
        body: { status: "cancelled" },
      });
      setSelected(null);
      setEditMode(false);
      setFeedback("Agendamento cancelado com sucesso.");
      await fetchData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao cancelar o agendamento.";
      setFeedback(message);
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleModalComplete() {
    if (!selected) return;
    try {
      setSavingStatus(true);
      setFeedback("");
      await apiFetch(`/api/appointments/${selected.id}/`, {
        method: "PATCH",
        body: { status: "completed" },
      });
      setSelected(null);
      setEditMode(false);
      setFeedback("Agendamento concluído com sucesso.");
      await fetchData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao concluir o agendamento.";
      setFeedback(message);
    } finally {
      setSavingStatus(false);
    }
  }

  return (
    <LayoutShell eyebrow="Operação" title="Agendamentos">
      <section className={styles.pageSection}>

        {/* ── HERO ── */}
        <div className={styles.hero}>
          <div className={styles.heroGlow} />
          <div className={styles.heroContent}>
            <span className={styles.heroEyebrow}>Gestão da agenda</span>
            <h2 className={styles.heroTitle}>Controle completo dos atendimentos</h2>
            <p className={styles.heroDescription}>
              Gerencie os agendamentos da clínica, filtre por status e crie
              novos atendimentos sem sair desta página.
            </p>
          </div>

          {/* Desktop-only action button inside hero */}
          <div className={`${styles.heroActions} ${styles.heroActionsDesktop}`}>
            <button
              type="button"
              className={styles.primaryActionButton}
              onClick={() => {
                setShowCreateForm((prev) => !prev);
                setCreateFeedback("");
              }}
            >
              {showCreateForm ? "Fechar criação" : "Novo agendamento"}
            </button>
          </div>
        </div>

        {/* Mobile-only: floating "Novo agendamento" button + inline form */}
        <div className={styles.mobileNewBar}>
          <button
            type="button"
            className={styles.primaryActionButton}
            onClick={() => {
              setShowCreateForm((prev) => !prev);
              setCreateFeedback("");
            }}
          >
            {showCreateForm ? "Fechar criação" : "+ Novo agendamento"}
          </button>
        </div>

        {/* ── STATS GRID — hidden on mobile ── */}
        <div className={styles.statsGrid}>
          <article className={`${styles.statCard} ${styles.cardOne}`}>
            <div className={styles.statCardTop}>
              <span className={styles.statLabel}>Total</span>
              <span className={styles.statIcon}>◎</span>
            </div>
            <strong className={styles.statValue}>{stats.total}</strong>
          </article>

          <article className={`${styles.statCard} ${styles.cardTwo}`}>
            <div className={styles.statCardTop}>
              <span className={styles.statLabel}>Agendados</span>
              <span className={styles.statIcon}>◷</span>
            </div>
            <strong className={styles.statValue}>{stats.scheduled}</strong>
          </article>

          <article className={`${styles.statCard} ${styles.cardThree}`}>
            <div className={styles.statCardTop}>
              <span className={styles.statLabel}>Confirmados</span>
              <span className={styles.statIcon}>✓</span>
            </div>
            <strong className={styles.statValue}>{stats.confirmed}</strong>
          </article>

          <article className={`${styles.statCard} ${styles.cardFour}`}>
            <div className={styles.statCardTop}>
              <span className={styles.statLabel}>Pendentes</span>
              <span className={styles.statIcon}>!</span>
            </div>
            <strong className={styles.statValue}>{stats.pending}</strong>
          </article>

          <article className={`${styles.statCard} ${styles.cardSix}`}>
            <div className={styles.statCardTop}>
              <span className={styles.statLabel}>Concluídos</span>
              <span className={styles.statIcon}>✔</span>
            </div>
            <strong className={styles.statValue}>{stats.completed}</strong>
          </article>

          <article className={`${styles.statCard} ${styles.cardFive}`}>
            <div className={styles.statCardTop}>
              <span className={styles.statLabel}>Cancelados</span>
              <span className={styles.statIcon}>✕</span>
            </div>
            <strong className={styles.statValue}>{stats.cancelled}</strong>
          </article>
        </div>

        {/* ── CREATE FORM ── */}
        {showCreateForm && (
          <section className={styles.createCard}>
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.sectionEyebrow}>Criação</span>
                <h3 className={styles.sectionTitle}>Novo agendamento</h3>
              </div>
              {selectedService?.duration ? (
                <span className={styles.serviceDurationBadge}>
                  Duração: {selectedService.duration} min
                </span>
              ) : (
                <span className={styles.serviceDurationBadge}>
                  Selecione um serviço
                </span>
              )}
            </div>

            {createFeedback && (
              <p className={styles.feedbackWarning}>{createFeedback}</p>
            )}

            <div className={styles.createForm}>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span>Profissional</span>
                  <select
                    value={form.professional_id}
                    onChange={(e) => updateField("professional_id", e.target.value)}
                  >
                    <option value="">Selecione um profissional</option>
                    {professionals.map((p) => (
                      <option key={p.id} value={p.id}>{getDisplayName(p)}</option>
                    ))}
                  </select>
                </label>

                <label className={styles.field}>
                  <span>Cliente</span>
                  <select
                    value={form.client_id}
                    onChange={(e) => updateField("client_id", e.target.value)}
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{getDisplayName(c)}</option>
                    ))}
                  </select>
                </label>

                <label className={styles.field}>
                  <span>Serviço</span>
                  <select
                    value={form.service_id}
                    onChange={(e) => updateField("service_id", e.target.value)}
                  >
                    <option value="">Selecione um serviço</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>{getDisplayName(s)}</option>
                    ))}
                  </select>
                </label>

                <label className={styles.field}>
                  <span>Data</span>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => updateField("date", e.target.value)}
                  />
                </label>

                <label className={styles.field}>
                  <span>Horário de início</span>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => updateField("start_time", e.target.value)}
                  />
                </label>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.ghostButton}
                  onClick={() => { resetCreateForm(); setShowCreateForm(false); }}
                  disabled={creatingAppointment}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={styles.primaryActionButton}
                  onClick={handleCreateAppointment}
                  disabled={creatingAppointment}
                >
                  {creatingAppointment ? "Criando..." : "Criar agendamento"}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── ACTIVE APPOINTMENTS ── */}
        <section className={styles.panel}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionEyebrow}>Em andamento</span>
              <h3 className={styles.sectionTitle}>Agendamentos ativos</h3>
            </div>
            <div className={styles.filters}>
              <input
                className={styles.searchInput}
                placeholder="Buscar cliente, profissional, serviço..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className={styles.statusFilter}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos os status ativos</option>
                <option value="scheduled">Agendado</option>
                <option value="confirmed">Confirmado</option>
                <option value="pending">Pendente</option>
              </select>
            </div>
          </div>

          {feedback && <p className={styles.feedbackInfo}>{feedback}</p>}

          {loading ? (
            <div className={styles.loadingState}>
              <strong>Carregando agendamentos...</strong>
              <p>Aguarde enquanto buscamos os dados da API.</p>
            </div>
          ) : filteredVisible.length === 0 ? (
            <p className={styles.emptyState}>
              {search || statusFilter !== "all"
                ? "Nenhum resultado encontrado para os filtros aplicados."
                : "Nenhum agendamento ativo cadastrado."}
            </p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Profissional</th>
                    <th>Serviço</th>
                    <th>Data</th>
                    <th>Hora</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisible.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className={styles.clientCell}>
                          <div className={styles.clientAvatar}>{initials(item.client)}</div>
                          <span>{item.client}</span>
                        </div>
                      </td>
                      <td>{item.professional}</td>
                      <td><span className={styles.serviceTag}>{item.service}</span></td>
                      <td className={styles.monoCell}>{item.date}</td>
                      <td className={styles.monoCell}>
                        {item.endTime && item.endTime !== "--:--"
                          ? `${item.time} - ${item.endTime}`
                          : item.time}
                      </td>
                      <td>
                        <span className={getStatusClass(item.status)}>
                          {getStatusLabel(item.status)}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            type="button"
                            className={styles.viewButton}
                            onClick={() => { setSelected(item); setEditMode(false); }}
                          >
                            Ver
                          </button>
                          <button
                            type="button"
                            className={styles.editButton}
                            onClick={() => { setSelected(item); setEditMode(true); }}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className={styles.completeButton}
                            onClick={() => handleQuickComplete(item.id)}
                            disabled={quickCompletingId === item.id}
                          >
                            {quickCompletingId === item.id ? "Concluindo..." : "Concluir"}
                          </button>
                          <button
                            type="button"
                            className={styles.softDangerButton}
                            onClick={() => handleQuickCancel(item.id)}
                            disabled={quickCancellingId === item.id}
                          >
                            {quickCancellingId === item.id ? "Cancelando..." : "Cancelar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── HISTORY ── */}
        <section className={styles.panel}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionEyebrow}>Histórico</span>
              <h3 className={styles.sectionTitle}>Concluídos e cancelados</h3>
            </div>
            {!loading && filteredHistory.length > 0 && (
              <span className={styles.historyCount}>
                {filteredHistory.length} registro{filteredHistory.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {loading ? (
            <div className={styles.loadingState}>
              <strong>Carregando histórico...</strong>
              <p>Aguarde enquanto buscamos os dados da API.</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <p className={styles.emptyState}>
              Nenhum agendamento concluído ou cancelado.
            </p>
          ) : (
            <>
              {/* Scrollable history table */}
              <div className={styles.historyWrap}>
                <div
                  ref={historyListRef}
                  className={styles.historyScroll}
                  onScroll={handleHistoryScroll}
                >
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Profissional</th>
                        <th>Serviço</th>
                        <th>Data</th>
                        <th>Hora</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleHistory.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className={styles.clientCell}>
                              <div className={styles.clientAvatar}>{initials(item.client)}</div>
                              <span>{item.client}</span>
                            </div>
                          </td>
                          <td>{item.professional}</td>
                          <td><span className={styles.serviceTag}>{item.service}</span></td>
                          <td className={styles.monoCell}>{item.date}</td>
                          <td className={styles.monoCell}>
                            {item.endTime && item.endTime !== "--:--"
                              ? `${item.time} - ${item.endTime}`
                              : item.time}
                          </td>
                          <td>
                            <span className={getStatusClass(item.status)}>
                              {getStatusLabel(item.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bottom fade when more rows are hidden */}
                {hasMoreHistory && (
                  <div
                    className={styles.historyFade}
                    style={{ opacity: historyAtBottom ? 0 : 1 }}
                  />
                )}
              </div>

              {/* Load more bar */}
              {hasMoreHistory && (
                <div className={styles.loadMoreBar}>
                  <button
                    type="button"
                    className={styles.loadMoreBtn}
                    onClick={handleLoadMoreHistory}
                  >
                    <span className={styles.loadMoreIcon}>↓</span>
                    Ver mais registros
                  </button>
                  <span className={styles.loadMoreCount}>
                    +{historyRemaining} registro{historyRemaining !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </>
          )}
        </section>

        {/* ── MODAL ── */}
        {selected && (
          <div
            className={styles.modalOverlay}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelected(null);
                setEditMode(false);
              }
            }}
          >
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <div>
                  <p className={styles.modalEyebrow}>
                    {editMode ? "Editar agendamento" : "Detalhes do agendamento"}
                  </p>
                  <h3>{selected.client}</h3>
                </div>
                <button
                  type="button"
                  className={styles.modalClose}
                  onClick={() => { setSelected(null); setEditMode(false); }}
                >
                  ✕
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.modalGrid}>
                  <div className={styles.modalField}>
                    <span className={styles.modalFieldLabel}>Profissional</span>
                    <span className={styles.modalFieldValue}>{selected.professional}</span>
                  </div>
                  <div className={styles.modalField}>
                    <span className={styles.modalFieldLabel}>Serviço</span>
                    <span className={styles.modalFieldValue}>{selected.service}</span>
                  </div>
                  <div className={styles.modalField}>
                    <span className={styles.modalFieldLabel}>Data</span>
                    <span className={styles.modalFieldValue}>{selected.date}</span>
                  </div>
                  <div className={styles.modalField}>
                    <span className={styles.modalFieldLabel}>Hora</span>
                    <span className={styles.modalFieldValue}>
                      {selected.endTime && selected.endTime !== "--:--"
                        ? `${selected.time} - ${selected.endTime}`
                        : selected.time}
                    </span>
                  </div>
                </div>

                {editMode ? (
                  <>
                    <div className={styles.field}>
                      <span>Status</span>
                      <select
                        value={selected.status}
                        onChange={(e) =>
                          setSelected({ ...selected, status: e.target.value })
                        }
                      >
                        <option value="scheduled">Agendado</option>
                        <option value="confirmed">Confirmado</option>
                        <option value="pending">Pendente</option>
                        <option value="completed">Concluído</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </div>
                    <div className={styles.modalActions}>
                      <button
                        type="button"
                        className={styles.completeButton}
                        onClick={handleModalComplete}
                        disabled={savingStatus}
                      >
                        {savingStatus ? "Processando..." : "Concluir"}
                      </button>
                      <button
                        type="button"
                        className={styles.softDangerButton}
                        onClick={handleModalCancel}
                        disabled={savingStatus}
                      >
                        {savingStatus ? "Processando..." : "Cancelar agendamento"}
                      </button>
                      <button
                        type="button"
                        className={styles.ghostButton}
                        onClick={() => { setSelected(null); setEditMode(false); }}
                        disabled={savingStatus}
                      >
                        Fechar
                      </button>
                      <button
                        type="button"
                        className={styles.primaryActionButton}
                        onClick={handleUpdateStatus}
                        disabled={savingStatus}
                      >
                        {savingStatus ? "Salvando..." : "Salvar alterações"}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.modalFieldSingle}>
                      <span className={styles.modalFieldLabel}>Status</span>
                      <span className={getStatusClass(selected.status)}>
                        {getStatusLabel(selected.status)}
                      </span>
                    </div>
                    <div className={styles.modalActions}>
                      <button
                        type="button"
                        className={styles.ghostButton}
                        onClick={() => { setSelected(null); setEditMode(false); }}
                      >
                        Fechar
                      </button>
                      <button
                        type="button"
                        className={styles.editButton}
                        onClick={() => setEditMode(true)}
                      >
                        Editar status
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

      </section>
    </LayoutShell>
  );
}