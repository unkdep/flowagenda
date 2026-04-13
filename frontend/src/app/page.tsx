"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LayoutShell } from "./components/layout-shell";
import { apiFetch } from "@/app/lib/api";

type Appointment = {
  id: number;
  client_name?: string;
  professional_name?: string;
  service_name?: string;
  start_time: string;
  end_time?: string;
  status?: string;
};

type ProfessionalItem = {
  id: number;
  name?: string;
  full_name?: string;
  active?: boolean;
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
};

type DashboardCard = {
  label: string;
  value: string | number;
  desc: string;
  accentClass: string;
  icon: string;
  trend?: string;
};

type SummaryCard = {
  label: string;
  value: string | number;
  desc: string;
  colorClass: string;
};

const PAGE_SIZE = 6;

function initials(name: string) {
  if (!name) return "?";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  { bg: "rgba(88,112,109,0.30)", color: "#ffffff" },
  { bg: "rgba(75,87,87,0.30)", color: "#e3e3d1" },
  { bg: "rgba(124,138,110,0.30)", color: "#ffffff" },
  { bg: "rgba(176,176,135,0.25)", color: "#ffffff" },
  { bg: "rgba(88,112,109,0.40)", color: "#ffffff" },
  { bg: "rgba(124,138,110,0.40)", color: "#e3e3d1" },
];

function avatarStyle(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[hash];
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function isToday(value: string) {
  const target = new Date(value);
  const now = new Date();
  return (
    target.getDate() === now.getDate() &&
    target.getMonth() === now.getMonth() &&
    target.getFullYear() === now.getFullYear()
  );
}

function getStatusLabel(status?: string) {
  const map: Record<string, string> = {
    scheduled: "Agendado",
    confirmed: "Confirmado",
    pending: "Pendente",
    cancelled: "Cancelado",
  };
  if (!status) return "Agendado";
  return map[status] ?? status;
}

export default function Home() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalItem[]>([]);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError("");

        const [
          appointmentsResponse,
          professionalsResponse,
          clientsResponse,
          servicesResponse,
        ] = await Promise.all([
          apiFetch<Appointment[]>("/api/appointments/"),
          apiFetch<ProfessionalItem[]>("/api/professionals/"),
          apiFetch<ClientItem[]>("/api/clients/"),
          apiFetch<ServiceItem[]>("/api/services/"),
        ]);

        setAppointments(
          Array.isArray(appointmentsResponse) ? appointmentsResponse : []
        );
        setProfessionals(
          Array.isArray(professionalsResponse) ? professionalsResponse : []
        );
        setClients(Array.isArray(clientsResponse) ? clientsResponse : []);
        setServices(Array.isArray(servicesResponse) ? servicesResponse : []);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao carregar o dashboard.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const todayAppointments = useMemo(
    () => appointments.filter((item) => isToday(item.start_time)),
    [appointments]
  );

  const activeProfessionals = useMemo(
    () => professionals.filter((item) => item.active !== false).length,
    [professionals]
  );

  const confirmedAppointments = useMemo(
    () => appointments.filter((item) => item.status === "confirmed").length,
    [appointments]
  );

  const pendingAppointments = useMemo(
    () => appointments.filter((item) => item.status === "pending").length,
    [appointments]
  );

  const cancelledAppointments = useMemo(
    () => appointments.filter((item) => item.status === "cancelled").length,
    [appointments]
  );

  const sortedAppointments = useMemo(
    () =>
      [...appointments].sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      ),
    [appointments]
  );

  const visibleAppointments = useMemo(
    () => sortedAppointments.slice(0, visibleCount),
    [sortedAppointments, visibleCount]
  );

  const remainingCount = sortedAppointments.length - visibleCount;
  const hasMore = remainingCount > 0;

  function handleLoadMore() {
    setVisibleCount((prev) => prev + PAGE_SIZE);

    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollTo({
          top: listRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 50);
  }

  function handleListScroll() {
    if (!listRef.current) return;
    const { scrollHeight, scrollTop, clientHeight } = listRef.current;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 10);
  }

  const cards: DashboardCard[] = [
    {
      label: "Agendamentos",
      value: loading ? "—" : todayAppointments.length,
      desc: "registrados hoje",
      accentClass: "card--accent-teal",
      icon: "◷",
      trend: loading ? "carregando..." : `${appointments.length} no total`,
    },
    {
      label: "Profissionais",
      value: loading ? "—" : activeProfessionals,
      desc: "ativos na plataforma",
      accentClass: "card--accent-blue",
      icon: "✦",
      trend: loading ? "carregando..." : `${professionals.length} cadastrados`,
    },
    {
      label: "Clientes",
      value: loading ? "—" : clients.length,
      desc: "na base da clínica",
      accentClass: "card--accent-purple",
      icon: "◎",
      trend: loading ? "carregando..." : `${services.length} serviços disponíveis`,
    },
    {
      label: "Integrações",
      value: "2",
      desc: "preparadas e ativas",
      accentClass: "card--accent-amber",
      icon: "⬡",
      trend: "WhatsApp · Calendar",
    },
  ];

  const summaryCards: SummaryCard[] = [
    {
      label: "Confirmados",
      value: loading ? "—" : confirmedAppointments,
      desc: "atendimentos confirmados",
      colorClass: "summary-card--color1",
    },
    {
      label: "Pendentes",
      value: loading ? "—" : pendingAppointments,
      desc: "aguardando definição",
      colorClass: "summary-card--color2",
    },
    {
      label: "Cancelados",
      value: loading ? "—" : cancelledAppointments,
      desc: "com sinalização suave",
      colorClass: "summary-card--color3",
    },
    {
      label: "Serviços",
      value: loading ? "—" : services.length,
      desc: "cadastrados na clínica",
      colorClass: "summary-card--color4",
    },
  ];

  return (
    <LayoutShell
      eyebrow="Painel"
      title="Dashboard"
      actionLabel="Ver agendamentos"
      actionHref="/agendas"
    >
      <div className="page-content">
        <section className="dashboard-grid">
          {cards.map((card) => (
            <article key={card.label} className={`card ${card.accentClass}`}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "16px",
                }}
              >
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(245,245,236,0.86)",
                  }}
                >
                  {card.label}
                </span>

                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "10px",
                    background: "rgba(227,227,209,0.07)",
                    border: "1px solid rgba(227,227,209,0.10)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1rem",
                    color: "#f5f5ec",
                    flexShrink: 0,
                  }}
                >
                  {card.icon}
                </span>
              </div>

              <strong
                style={{
                  display: "block",
                  fontSize: "2.4rem",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  color: "#ffffff",
                  marginBottom: "6px",
                }}
              >
                {card.value}
              </strong>

              <p
                style={{
                  fontSize: "0.82rem",
                  color: "rgba(245,245,236,0.82)",
                  marginBottom: "16px",
                }}
              >
                {card.desc}
              </p>

              {card.trend && (
                <div
                  style={{
                    paddingTop: "14px",
                    borderTop: "1px solid rgba(227,227,209,0.07)",
                    fontSize: "0.74rem",
                    color: "#f5f5ec",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#e3e3d1",
                      flexShrink: 0,
                      display: "inline-block",
                      opacity: 0.7,
                    }}
                  />
                  {card.trend}
                </div>
              )}
            </article>
          ))}
        </section>

        <section className="panel">
          <div className="panel__header">
            <div>
              <h2 className="panel__title">Resumo operacional</h2>
              <p className="panel__subtitle">
                Indicadores reais do sistema conectados ao backend
              </p>
            </div>
          </div>

          <div className="summary-grid">
            {summaryCards.map((item) => (
              <article
                key={item.label}
                className={`summary-card ${item.colorClass}`}
              >
                <span className="summary-card__label">{item.label}</span>
                <strong className="summary-card__value">{item.value}</strong>
                <p className="summary-card__desc">{item.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel__header">
            <div>
              <h2 className="panel__title">Próximos atendimentos</h2>
              <p className="panel__subtitle">
                Dados em tempo real · FlowAgenda API
              </p>
            </div>

            {!error ? (
              <span className="badge-live">
                <span className="badge-live__dot" />
                Ao vivo
              </span>
            ) : (
              <span className="badge-live">
                <span className="badge-live__dot" />
                Erro de conexão
              </span>
            )}
          </div>

          <div className="appointments-list-wrap">
            <div
              ref={listRef}
              className="appointments-list"
              onScroll={handleListScroll}
            >
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="appointment-item">
                    <div
                      className="skeleton"
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div
                        className="skeleton"
                        style={{ height: 12, width: "42%" }}
                      />
                      <div
                        className="skeleton"
                        style={{ height: 10, width: "30%" }}
                      />
                    </div>
                    <div className="skeleton" style={{ width: 52, height: 12 }} />
                  </div>
                ))
              ) : error ? (
                <p className="error-state">
                  ⚠️ {error || "Erro ao conectar com o backend."}
                </p>
              ) : visibleAppointments.length === 0 ? (
                <p className="empty-state">Nenhum agendamento encontrado.</p>
              ) : (
                visibleAppointments.map((item) => {
                  const clientName = item.client_name || "Cliente não informado";
                  const professionalName =
                    item.professional_name || "Profissional não informado";
                  const serviceName =
                    item.service_name || "Serviço não informado";
                  const avatar = avatarStyle(clientName);

                  return (
                    <div key={item.id} className="appointment-item">
                      <div
                        className="appt-avatar"
                        style={{ background: avatar.bg, color: avatar.color }}
                      >
                        {initials(clientName)}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong
                          style={{
                            display: "block",
                            fontSize: "0.92rem",
                            fontWeight: 700,
                            color: "#ffffff",
                            marginBottom: 4,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {clientName}
                        </strong>

                        <p
                          style={{
                            fontSize: "0.79rem",
                            color: "#8fa8a5",
                            margin: 0,
                          }}
                        >
                          <span className="appt-service-tag">{serviceName}</span>
                          {professionalName}
                        </p>

                        <span
                          className={`status-chip status-chip--${
                            item.status || "scheduled"
                          }`}
                        >
                          {getStatusLabel(item.status)}
                        </span>
                      </div>

                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <span className="appt-time">
                          <span className="appt-time__dot" />
                          {formatTime(item.start_time)}
                        </span>
                        <p
                          style={{
                            fontSize: "0.72rem",
                            color: "#7c8a6e",
                            marginTop: 4,
                            marginBottom: 0,
                          }}
                        >
                          {formatDate(item.start_time)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {!loading && !error && hasMore && (
              <div
                className="appointments-fade-bottom"
                style={{ opacity: isAtBottom ? 0 : 1 }}
              />
            )}
          </div>

          {!loading && !error && hasMore && (
            <div className="load-more-bar">
              <button
                className="load-more-btn"
                onClick={handleLoadMore}
                type="button"
              >
                <span className="load-more-btn__icon">↓</span>
                Ver mais atendimentos
              </button>
              <span className="load-more-count">
                +{remainingCount} atendimento{remainingCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </section>
      </div>
    </LayoutShell>
  );
}