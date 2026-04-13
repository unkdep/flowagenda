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

const PAGE_SIZE = 6;

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState<FormData>(emptyForm);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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
    const timer = setTimeout(() => setSuccessMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  function resetForm() {
    setForm(emptyForm);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleEditChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
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
      await apiFetch("/api/services/", { method: "POST", body: { name, duration } });
      await fetchServices();
      resetForm();
      setSuccessMessage("Serviço criado com sucesso.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro inesperado ao salvar o serviço."
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
        body: { name, duration },
      });

      await fetchServices();
      closeEditModal();
      setSuccessMessage("Serviço atualizado com sucesso.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro inesperado ao atualizar o serviço."
      );
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete(serviceId: number) {
    if (!window.confirm("Tem certeza que deseja excluir este serviço?")) return;

    try {
      setDeletingId(serviceId);
      setErrorMessage("");
      setSuccessMessage("");

      await apiFetch(`/api/services/${serviceId}/`, { method: "DELETE" });

      if (selected?.id === serviceId) closeEditModal();

      await fetchServices();
      setSuccessMessage("Serviço excluído com sucesso.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro inesperado ao excluir o serviço."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredServices = useMemo(() => {
    const term = search.toLowerCase();
    setPage(1);
    return services.filter((service) => {
      const clinicName = (service.clinic_name || "").toLowerCase();
      return (
        service.name.toLowerCase().includes(term) ||
        String(service.duration).includes(search) ||
        clinicName.includes(term)
      );
    });
  }, [services, search]);

  const totalPages = Math.ceil(filteredServices.length / PAGE_SIZE);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredServices.slice(start, start + PAGE_SIZE);
  }, [filteredServices, page]);

  const metrics = useMemo(() => {
    const total = services.length;
    const averageDuration =
      total > 0
        ? Math.round(services.reduce((acc, item) => acc + Number(item.duration || 0), 0) / total)
        : 0;
    const longestDuration =
      total > 0 ? Math.max(...services.map((item) => Number(item.duration || 0))) : 0;
    const clinicsCount = new Set(services.map((item) => item.clinic_name || item.clinic)).size;

    return { total, averageDuration, longestDuration, clinicsCount };
  }, [services]);

  return (
    <LayoutShell eyebrow="Cadastros" title="Serviços">
      <section className={styles.page}>
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>Catálogo da clínica</p>
            <h2 className={styles.title}>Gerencie os serviços oferecidos</h2>
            <p className={styles.subtitle}>
              Cadastre, edite e organize os serviços da clínica com duração em
              minutos para alimentar a agenda e os agendamentos automáticos.
            </p>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.heroStatItem}>
              <strong>{metrics.total}</strong>
              <span>Total</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStatItem}>
              <strong>{metrics.averageDuration}m</strong>
              <span>Média</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStatItem}>
              <strong>{metrics.clinicsCount}</strong>
              <span>Clínicas</span>
            </div>
          </div>
        </div>

        {/* Metric cards — hidden on mobile */}
        <section className={styles.metricsGrid}>
          <article className={styles.metricCard}>
            <span className={styles.metricLabel}>Total de serviços</span>
            <strong className={styles.metricValue}>{metrics.total}</strong>
          </article>

          <article className={styles.metricCard}>
            <span className={styles.metricLabel}>Duração média</span>
            <strong className={styles.metricValue}>{metrics.averageDuration} min</strong>
          </article>

          <article className={styles.metricCard}>
            <span className={styles.metricLabel}>Maior duração</span>
            <strong className={styles.metricValue}>{metrics.longestDuration} min</strong>
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
                <button type="submit" className={styles.primaryButton} disabled={saving}>
                  {saving ? "Salvando..." : "Criar serviço"}
                </button>
              </div>

              {successMessage && <p className={styles.successMessage}>{successMessage}</p>}
              {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
            </form>
          </article>

          <article className={styles.listCard}>
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.cardEyebrow}>Listagem</p>
                <h3 className={styles.cardTitle}>Serviços cadastrados</h3>
              </div>

              <input
                className={styles.searchInput}
                type="text"
                placeholder="Buscar por nome, duração ou clínica"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {loading ? (
              <div className={styles.skeletonList}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={styles.skeletonRow}>
                    <div className={styles.skeletonLines}>
                      <div className={styles.skeletonLine} style={{ width: "45%" }} />
                      <div className={styles.skeletonLine} style={{ width: "28%", height: 10 }} />
                    </div>
                    <div className={styles.skeletonLine} style={{ width: 60 }} />
                  </div>
                ))}
              </div>
            ) : filteredServices.length === 0 ? (
              <div className={styles.emptyState}>
                <strong>{search ? "Nenhum resultado encontrado" : "Nenhum serviço encontrado"}</strong>
                <p>
                  {search
                    ? "Ajuste a busca para visualizar resultados."
                    : "Cadastre um novo serviço para começar."}
                </p>
              </div>
            ) : (
              <>
                <div className={styles.serviceList}>
                  {paginated.map((service) => (
                    <article key={service.id} className={styles.serviceCard}>
                      <div className={styles.serviceMain}>
                        <div className={styles.serviceInfo}>
                          <h4>{service.name}</h4>
                          <p>Clínica: {service.clinic_name || `ID ${service.clinic}`}</p>
                        </div>

                        <div className={styles.badges}>
                          <span className={styles.durationBadge}>{service.duration} min</span>
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

                {totalPages > 1 && (
                  <div className={styles.pagination}>
                    <button
                      className={styles.pageBtn}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      aria-label="Página anterior"
                    >
                      ←
                    </button>

                    <div className={styles.pageNumbers}>
                      {Array.from({ length: totalPages }).map((_, i) => {
                        const n = i + 1;
                        const isNear = Math.abs(n - page) <= 1 || n === 1 || n === totalPages;
                        if (!isNear) {
                          if (n === page - 2 || n === page + 2) {
                            return <span key={n} className={styles.pageDots}>…</span>;
                          }
                          return null;
                        }
                        return (
                          <button
                            key={n}
                            className={`${styles.pageBtn} ${n === page ? styles.pageBtnActive : ""}`}
                            onClick={() => setPage(n)}
                          >
                            {n}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      className={styles.pageBtn}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      aria-label="Próxima página"
                    >
                      →
                    </button>

                    <span className={styles.pageInfo}>
                      {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredServices.length)} de {filteredServices.length}
                    </span>
                  </div>
                )}
              </>
            )}
          </article>
        </section>

        {selected && (
          <div
            className={styles.modalOverlay}
            onClick={(e) => {
              if (e.target === e.currentTarget) closeEditModal();
            }}
          >
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <div>
                  <p className={styles.modalEyebrow}>Editar serviço</p>
                  <h3>{selected.name}</h3>
                </div>

                <button type="button" className={styles.modalClose} onClick={closeEditModal}>
                  ✕
                </button>
              </div>

              <div className={styles.modalBody}>
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

                <div className={styles.modalActions}>
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