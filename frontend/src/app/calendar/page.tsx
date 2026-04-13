"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutShell } from "../components/layout-shell";
import { apiFetch } from "../lib/api";
import styles from "./calendar.module.css";

type AppointmentApiItem = {
  id: number;
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

type AvailabilityResponse = {
  professional_id: number;
  professional_name: string;
  date: string;
  available: string[];
};

type CalendarAppointment = {
  id: number;
  client: string;
  professional: string;
  service: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
};

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function normalizeDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDateToISO(date: Date) {
  const normalized = normalizeDate(date);
  const year = normalized.getFullYear();
  const month = `${normalized.getMonth() + 1}`.padStart(2, "0");
  const day = `${normalized.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameDay(dateA: Date, dateB: Date) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function getStatusLabel(status: string) {
  switch (status) {
    case "scheduled":
      return "Agendado";
    case "confirmed":
      return "Confirmado";
    case "pending":
      return "Pendente";
    case "cancelled":
      return "Cancelado";
    default:
      return status || "Sem status";
  }
}

function getDisplayName(item: ProfessionalItem) {
  if (item.name) return item.name;
  if (item.full_name) return item.full_name;
  return `Profissional #${item.id}`;
}

export default function CalendarPage() {
  const today = useMemo(() => normalizeDate(new Date()), []);

  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalItem[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState("");

  const [loading, setLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const [feedback, setFeedback] = useState("");
  const [availabilityFeedback, setAvailabilityFeedback] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  useEffect(() => {
    async function fetchInitialData() {
      try {
        setLoading(true);
        setFeedback("");

        const [appointmentsData, professionalsData] = await Promise.all([
          apiFetch<AppointmentApiItem[]>("/api/appointments/"),
          apiFetch<ProfessionalItem[]>("/api/professionals/"),
        ]);

        const mappedAppointments = (
          Array.isArray(appointmentsData) ? appointmentsData : []
        ).map((item) => {
          const date =
            item.date ??
            item.start_time?.split("T")[0] ??
            formatDateToISO(today);

          const startTime = item.start_time?.slice(11, 16) ?? "--:--";
          const endTime = item.end_time?.slice(11, 16) ?? "--:--";

          return {
            id: item.id,
            client: item.client_name ?? "Cliente não informado",
            professional: item.professional_name ?? "Profissional não informado",
            service: item.service_name ?? "Serviço não informado",
            date,
            startTime,
            endTime,
            status: item.status ?? "scheduled",
          };
        });

        const mappedProfessionals = Array.isArray(professionalsData)
          ? professionalsData
          : [];

        setAppointments(mappedAppointments);
        setProfessionals(mappedProfessionals);

        if (mappedProfessionals.length > 0) {
          setSelectedProfessionalId(String(mappedProfessionals[0].id));
        }
      } catch (error) {
        console.error(error);
        setFeedback(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os dados do calendário."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchInitialData();
  }, [today]);

  const selectedDateISO = useMemo(
    () => formatDateToISO(selectedDate),
    [selectedDate]
  );

  useEffect(() => {
    async function fetchAvailability() {
      if (!selectedProfessionalId) {
        setAvailableSlots([]);
        setAvailabilityFeedback("");
        return;
      }

      try {
        setAvailabilityLoading(true);
        setAvailabilityFeedback("");

        const params = new URLSearchParams({
          professional_id: selectedProfessionalId,
          date: selectedDateISO,
        });

        const data = await apiFetch<AvailabilityResponse>(
          `/api/availability/?${params.toString()}`
        );

        setAvailableSlots(Array.isArray(data.available) ? data.available : []);
      } catch (error) {
        console.error(error);
        setAvailableSlots([]);
        setAvailabilityFeedback(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a disponibilidade."
        );
      } finally {
        setAvailabilityLoading(false);
      }
    }

    fetchAvailability();
  }, [selectedProfessionalId, selectedDateISO]);

  const currentMonthLabel = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startDay = firstDayOfMonth.getDay();

    const firstGridDate = new Date(year, month, 1 - startDay);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(firstGridDate);
      date.setDate(firstGridDate.getDate() + index);
      return normalizeDate(date);
    });
  }, [currentMonth]);

  const monthlyCounts = useMemo(() => {
    const map = new Map<string, number>();

    for (const appointment of appointments) {
      const count = map.get(appointment.date) ?? 0;
      map.set(appointment.date, count + 1);
    }

    return map;
  }, [appointments]);

  const selectedDayAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => appointment.date === selectedDateISO)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointments, selectedDateISO]);

  const stats = useMemo(() => {
    const todayISO = formatDateToISO(today);

    return {
      total: appointments.length,
      today: appointments.filter((appointment) => appointment.date === todayISO)
        .length,
      confirmed: appointments.filter(
        (appointment) => appointment.status === "confirmed"
      ).length,
      cancelled: appointments.filter(
        (appointment) => appointment.status === "cancelled"
      ).length,
    };
  }, [appointments, today]);

  function handlePreviousMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  }

  function handleNextMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  }

  function handleToday() {
    const now = normalizeDate(new Date());
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  }

  return (
    <LayoutShell
      eyebrow="Agenda"
      title="Calendário"
      actionLabel="Novo agendamento"
      actionHref="/agendas"
    >
      <section className={styles.page}>
        <section className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Agenda inteligente</p>
            <h1 className={styles.title}>Calendário</h1>
            <p className={styles.subtitle}>
              Visualize os agendamentos reais da clínica, acompanhe a agenda do
              dia e consulte a disponibilidade por profissional.
            </p>
          </div>

          <div className={styles.headerActions}>
            <button className={styles.secondaryButton} onClick={handleToday}>
              Hoje
            </button>
          </div>
        </section>

        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total de agendamentos</span>
            <strong className={styles.statValue}>{stats.total}</strong>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>Agendamentos hoje</span>
            <strong className={styles.statValue}>{stats.today}</strong>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>Confirmados</span>
            <strong className={styles.statValue}>{stats.confirmed}</strong>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>Cancelados</span>
            <strong className={styles.statValue}>{stats.cancelled}</strong>
          </div>
        </section>

        {feedback && <p className={styles.feedback}>{feedback}</p>}

        <section className={styles.contentGrid}>
          <div className={styles.calendarCard}>
            <div className={styles.calendarTop}>
              <div>
                <p className={styles.calendarSmallLabel}>Visão mensal</p>
                <h2 className={styles.calendarTitle}>{currentMonthLabel}</h2>
              </div>

              <div className={styles.monthControls}>
                <button
                  className={styles.iconButton}
                  onClick={handlePreviousMonth}
                  aria-label="Mês anterior"
                >
                  ←
                </button>
                <button
                  className={styles.iconButton}
                  onClick={handleNextMonth}
                  aria-label="Próximo mês"
                >
                  →
                </button>
              </div>
            </div>

            <div className={styles.weekHeader}>
              {weekDays.map((day) => (
                <span key={day} className={styles.weekDay}>
                  {day}
                </span>
              ))}
            </div>

            <div className={styles.calendarGrid}>
              {calendarDays.map((date) => {
                const iso = formatDateToISO(date);
                const isCurrentMonth =
                  date.getMonth() === currentMonth.getMonth() &&
                  date.getFullYear() === currentMonth.getFullYear();
                const isTodayDate = isSameDay(date, today);
                const isSelected = isSameDay(date, selectedDate);
                const dayCount = monthlyCounts.get(iso) ?? 0;

                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setSelectedDate(normalizeDate(date))}
                    className={[
                      styles.dayCell,
                      !isCurrentMonth ? styles.dayCellMuted : "",
                      isTodayDate ? styles.dayCellToday : "",
                      isSelected ? styles.dayCellSelected : "",
                    ].join(" ")}
                  >
                    <div className={styles.dayCellTop}>
                      <span className={styles.dayNumber}>{date.getDate()}</span>
                      {dayCount > 0 && (
                        <span className={styles.dayBadge}>{dayCount}</span>
                      )}
                    </div>

                    <div className={styles.dayIndicators}>
                      {dayCount > 0 &&
                        Array.from({ length: Math.min(dayCount, 3) }).map(
                          (_, index) => (
                            <span
                              key={`${iso}-${index}`}
                              className={styles.dayDot}
                            />
                          )
                        )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className={styles.agendaCard}>
            <div className={styles.agendaHeader}>
              <div>
                <p className={styles.calendarSmallLabel}>Agenda do dia</p>
                <h2 className={styles.calendarTitle}>
                  {selectedDate.toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                  })}
                </h2>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  fontSize: 13,
                  color: "#8f9bb6",
                }}
              >
                <span>Profissional para disponibilidade</span>
                <select
                  value={selectedProfessionalId}
                  onChange={(e) => setSelectedProfessionalId(e.target.value)}
                  style={{
                    height: 42,
                    borderRadius: 12,
                    background: "#0b1020",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#ffffff",
                    padding: "0 12px",
                  }}
                >
                  <option value="">Selecione um profissional</option>
                  {professionals.map((professional) => (
                    <option key={professional.id} value={professional.id}>
                      {getDisplayName(professional)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div
              style={{
                marginBottom: 18,
                padding: 14,
                borderRadius: 16,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p
                style={{
                  margin: "0 0 10px",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                Horários disponíveis
              </p>

              {availabilityLoading ? (
                <p style={{ margin: 0, color: "#8f9bb6", fontSize: 13 }}>
                  Carregando disponibilidade...
                </p>
              ) : availabilityFeedback ? (
                <p style={{ margin: 0, color: "#ff8da0", fontSize: 13 }}>
                  {availabilityFeedback}
                </p>
              ) : availableSlots.length === 0 ? (
                <p style={{ margin: 0, color: "#8f9bb6", fontSize: 13 }}>
                  Nenhum horário livre para este profissional nesta data.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  {availableSlots.map((slot) => (
                    <span
                      key={slot}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: 32,
                        padding: "0 12px",
                        borderRadius: 999,
                        background: "rgba(124, 92, 255, 0.16)",
                        color: "#dcd5ff",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {slot}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.timeline}>
              {loading ? (
                <div className={styles.emptyState}>
                  <strong>Carregando calendário...</strong>
                  <p>Aguarde enquanto buscamos os agendamentos reais.</p>
                </div>
              ) : selectedDayAppointments.length === 0 ? (
                <div className={styles.emptyState}>
                  <strong>Nenhum agendamento nesta data</strong>
                  <p>Selecione outro dia com marcação no calendário.</p>
                </div>
              ) : (
                selectedDayAppointments.map((appointment) => (
                  <article key={appointment.id} className={styles.eventCard}>
                    <div className={styles.eventTime}>
                      <span>{appointment.startTime}</span>
                      <small>{appointment.endTime}</small>
                    </div>

                    <div className={styles.eventBody}>
                      <div className={styles.eventTopRow}>
                        <h3>{appointment.client}</h3>
                        <span
                          className={[
                            styles.statusBadge,
                            appointment.status === "confirmed"
                              ? styles.statusConfirmed
                              : appointment.status === "pending"
                              ? styles.statusPending
                              : appointment.status === "cancelled"
                              ? styles.statusCancelled
                              : styles.statusScheduled,
                          ].join(" ")}
                        >
                          {getStatusLabel(appointment.status)}
                        </span>
                      </div>

                      <p className={styles.eventService}>{appointment.service}</p>
                      <p className={styles.eventMeta}>
                        Profissional: {appointment.professional}
                      </p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </aside>
        </section>
      </section>
    </LayoutShell>
  );
}