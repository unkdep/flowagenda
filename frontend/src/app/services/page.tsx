"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutShell } from "../components/layout-shell";
import styles from "./services.module.css";
import { apiFetch } from "../lib/api";

type Service = {
  id: number;
  clinic: number;
  clinic_name?: string;
  name: string;
  duration: number;
};

type FormData = {
  name: string;
  duration: string;
};

const emptyForm: FormData = {
  name: "",
  duration: "",
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState<FormData>(emptyForm);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [selected, setSelected] = useState<Service | null>(null);
  const [editForm, setEditForm] = useState<FormData>(emptyForm);
  const [updating, setUpdating] = useState(false);

  async function fetchServices() {
    const data = await apiFetch<Service[]>("/api/services/");
    setServices(Array.isArray(data) ? data : []);
  }

  async function loadInitialData() {
    try {
      setLoading(true);
      setErrorMessage("");
      await fetchServices();
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao carregar dados da página de serviços."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!successMessage) return;

    const timer = setTimeout(() => {
      setSuccessMessage("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [successMessage]);

  function resetForm() {
    setForm(emptyForm);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleEditChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const name = form.name.trim();
    const duration = Number(form.duration);

    if (!name || !form.duration) {
      setErrorMessage("Preencha nome e duração.");
      return;
    }

    if (Number.isNaN(duration) || duration <= 0) {
      setErrorMessage("Informe uma duração válida em minutos.");
      return;
    }

    try {
      setSaving(true);

      await apiFetch("/api/services/", {
        method: "POST",
        body: {
          name,
          duration,
        },
      });

      await fetchServices();
      resetForm();
      setSuccessMessage("Serviço criado com sucesso.");
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro inesperado ao salvar o serviço."
      );
    } finally {
      setSaving(false);
    }
  }

  function openEditModal(service: Service) {
    setSelected(service);
    setEditForm({
      name: service.name ?? "",
      duration: String(service.duration ?? ""),
    });
    setErrorMessage("");
    setSuccessMessage("");
  }

  function closeEditModal() {
    setSelected(null);
    setEditForm(emptyForm);
  }

  async function handleUpdate() {
    if (!selected) return;

    const name = editForm.name.trim();
    const duration = Number(editForm.duration);

    if (!name || !editForm.duration) {
      setErrorMessage("Preencha nome e duração para editar.");
      return;
    }

    if (Number.isNaN(duration) || duration <= 0) {
      setErrorMessage("Informe uma duração válida em minutos.");
      return;
    }

    try {
      setUpdating(true);
      setErrorMessage("");
      setSuccessMessage("");

      await apiFetch(`/api/services/${selected.id}/`, {
        method: "PUT",
        body: {
          name,
          duration,
        },
      });

      await fetchServices();
      closeEditModal();
      setSuccessMessage("Serviço atualizado com sucesso.");
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro inesperado ao atualizar o serviço."
      );
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete(serviceId: number) {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este serviço?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(serviceId);
      setErrorMessage("");
      setSuccessMessage("");

      await apiFetch(`/api/services/${serviceId}/`, {
        method: "DELETE",
      });

      if (selected?.id === serviceId) {
        closeEditModal();
      }

      await fetchServices();
      setSuccessMessage("Serviço excluído com sucesso.");
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro inesperado ao excluir o serviço."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const clinicName = (service.clinic_name || "").toLowerCase();
      const term = search.toLowerCase();

      return (
        service.name.toLowerCase().includes(term) ||
        String(service.duration).includes(search) ||
        clinicName.includes(term)
      );
    });
  }, [services, search]);

  const metrics = useMemo(() => {
    const total = services.length;

    const averageDuration =
      total > 0
        ? Math.round(
            services.reduce(
              (acc, item) => acc + Number(item.duration || 0),
              0
            ) / total
          )
        : 0;

    const longestDuration =
      total > 0
        ? Math.max(...services.map((item) => Number(item.duration || 0)))
        : 0;

    const clinicsCount = new Set(
      services.map((item) => item.clinic_name || item.clinic)
    ).size;

    return {
      total,
      averageDuration,
      longestDuration,
      clinicsCount,
    };
  }, [services]);

  return (
    <LayoutShell eyebrow="Cadastros" title="Serviços">
      <section className={styles.page}>
        <div className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Catálogo da clínica</p>
            <h2 className={styles.title}>Gerencie os serviços oferecidos</h2>
            <p className={styles.subtitle}>
              Cadastre, edite e organize os serviços da clínica com duração em
              minutos para alimentar a agenda e os agendamentos automáticos.
            </p>
          </div>
        </div>

        <section className={styles.metricsGrid}>
          <article className={styles.metricCard}>
            <span className={styles.metricLabel}>Total de serviços</span>
            <strong className={styles.metricValue}>{metrics.total}</strong>
          </article>

          <article className={styles.metricCard}>
            <span className={styles.metricLabel}>Duração média</span>
            <strong className={styles.metricValue}>
              {metrics.averageDuration} min
            </strong>
          </article>

          <article className={styles.metricCard}>
            <span className={styles.metricLabel}>Maior duração</span>
            <strong className={styles.metricValue}>
              {metrics.longestDuration} min
            </strong>
          </article>

          <article className={styles.metricCard}>
            <span className={styles.metricLabel}>Clínicas com serviços</span>
            <strong className={styles.metricValue}>{metrics.clinicsCount}</strong>
          </article>
        </section>

        <section className={styles.contentGrid}>
          <article className={styles.formCard}>
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.cardEyebrow}>Novo cadastro</p>
                <h3 className={styles.cardTitle}>Criar serviço</h3>
              </div>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                <label className={`${styles.field} ${styles.fieldFull}`}>
                  <span>Nome</span>
                  <input
                    type="text"
                    name="name"
                    placeholder="Ex.: Consulta inicial"
                    value={form.name}
                    onChange={handleChange}
                  />
                </label>

                <label className={`${styles.field} ${styles.fieldFull}`}>
                  <span>Duração (minutos)</span>
                  <input
                    type="number"
                    min="1"
                    name="duration"
                    placeholder="Ex.: 60"
                    value={form.duration}
                    onChange={handleChange}
                  />
                </label>
              </div>

              <div className={styles.formActions}>
                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={saving}
                >
                  {saving ? "Salvando..." : "Criar serviço"}
                </button>
              </div>

              {successMessage && (
                <p className={styles.successMessage}>{successMessage}</p>
              )}

              {errorMessage && (
                <p className={styles.errorMessage}>{errorMessage}</p>
              )}
            </form>
          </article>

          <article className={styles.listCard}>
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.cardEyebrow}>Listagem</p>
                <h3 className={styles.cardTitle}>Serviços cadastrados</h3>
              </div>
            </div>

            <div className={styles.filters}>
              <label className={styles.searchField}>
                <input
                  type="text"
                  placeholder="Buscar por nome, duração ou clínica"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
            </div>

            {loading ? (
              <div className={styles.emptyState}>
                <strong>Carregando serviços...</strong>
                <p>Aguarde enquanto buscamos os dados da API.</p>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className={styles.emptyState}>
                <strong>Nenhum serviço encontrado</strong>
                <p>
                  Cadastre um novo serviço ou ajuste a busca para visualizar
                  resultados.
                </p>
              </div>
            ) : (
              <div className={styles.serviceList}>
                {filteredServices.map((service) => (
                  <article key={service.id} className={styles.serviceCard}>
                    <div className={styles.serviceMain}>
                      <div>
                        <h4>{service.name}</h4>
                        <p>
                          Clínica: {service.clinic_name || `ID ${service.clinic}`}
                        </p>
                      </div>

                      <div className={styles.badges}>
                        <span className={styles.durationBadge}>
                          {service.duration} min
                        </span>
                      </div>
                    </div>

                    <div className={styles.serviceActions}>
                      <button
                        type="button"
                        className={styles.editButton}
                        onClick={() => openEditModal(service)}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => handleDelete(service.id)}
                        disabled={deletingId === service.id}
                      >
                        {deletingId === service.id ? "Excluindo..." : "Excluir"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>
        </section>

        {selected && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 18, 18, 0.72)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              zIndex: 999,
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeEditModal();
              }
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "520px",
                background:
                  "linear-gradient(180deg, rgba(42, 50, 49, 0.99), rgba(31, 38, 37, 0.99))",
                border: "1px solid rgba(227, 227, 209, 0.08)",
                borderRadius: "24px",
                overflow: "hidden",
                boxShadow: "0 24px 60px rgba(0, 0, 0, 0.34)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "16px",
                  padding: "22px 24px 18px",
                  borderBottom: "1px solid rgba(227, 227, 209, 0.06)",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: "0 0 6px",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "#b0b087",
                    }}
                  >
                    Editar serviço
                  </p>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1.1rem",
                      fontWeight: 600,
                      color: "#f5f5ec",
                    }}
                  >
                    {selected.name}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={closeEditModal}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    border: "1px solid rgba(227, 227, 209, 0.08)",
                    background: "rgba(227, 227, 209, 0.04)",
                    color: "#d9d9c8",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>

              <div
                style={{
                  padding: "20px 24px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <label className={`${styles.field} ${styles.fieldFull}`}>
                  <span>Nome</span>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                  />
                </label>

                <label className={`${styles.field} ${styles.fieldFull}`}>
                  <span>Duração (minutos)</span>
                  <input
                    type="number"
                    min="1"
                    name="duration"
                    value={editForm.duration}
                    onChange={handleEditChange}
                  />
                </label>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={handleUpdate}
                    disabled={updating}
                  >
                    {updating ? "Salvando..." : "Salvar alterações"}
                  </button>

                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={closeEditModal}
                    disabled={updating}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </LayoutShell>
  );
}