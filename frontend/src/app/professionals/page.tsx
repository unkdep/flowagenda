"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutShell } from "../components/layout-shell";
import { apiFetch } from "../lib/api";
import styles from "./professionals.module.css";

type Professional = {
  id: number;
  name: string;
  specialty: string;
  active: boolean;
  clinic: number | null;
};

type FormDataType = {
  name: string;
  specialty: string;
  active: boolean;
};

const initialForm: FormDataType = {
  name: "",
  specialty: "",
  active: true,
};

function initials(name: string) {
  if (!name) return "?";

  const parts = name.trim().split(" ").filter(Boolean);

  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [form, setForm] = useState<FormDataType>(initialForm);
  const [selected, setSelected] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [search, setSearch] = useState("");

  async function fetchProfessionals() {
    const data = await apiFetch<Professional[]>("/api/professionals/");
    setProfessionals(Array.isArray(data) ? data : []);
  }

  async function loadPage() {
    try {
      setLoading(true);
      setFeedback(null);
      await fetchProfessionals();
    } catch (error) {
      setFeedback({
        msg:
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os profissionais.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, []);

  function updateForm<K extends keyof FormDataType>(
    field: K,
    value: FormDataType[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreate() {
    if (!form.name.trim()) {
      setFeedback({
        msg: "Informe o nome do profissional.",
        type: "error",
      });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);

      await apiFetch("/api/professionals/", {
        method: "POST",
        body: {
          name: form.name.trim(),
          specialty: form.specialty.trim(),
          active: form.active,
        },
      });

      setForm(initialForm);
      await fetchProfessionals();

      setFeedback({
        msg: "Profissional criado com sucesso.",
        type: "success",
      });
    } catch (error) {
      setFeedback({
        msg:
          error instanceof Error
            ? error.message
            : "Erro ao criar profissional.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Deseja realmente excluir este profissional?")) return;

    try {
      setFeedback(null);

      await apiFetch(`/api/professionals/${id}/`, {
        method: "DELETE",
      });

      await fetchProfessionals();

      setFeedback({
        msg: "Profissional excluído com sucesso.",
        type: "success",
      });
    } catch (error) {
      setFeedback({
        msg: error instanceof Error ? error.message : "Erro ao excluir.",
        type: "error",
      });
    }
  }

  async function handleUpdate() {
    if (!selected) return;

    if (!selected.name.trim()) {
      setFeedback({
        msg: "O nome é obrigatório.",
        type: "error",
      });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);

      await apiFetch(`/api/professionals/${selected.id}/`, {
        method: "PUT",
        body: {
          name: selected.name.trim(),
          specialty: selected.specialty?.trim() ?? "",
          active: selected.active,
        },
      });

      setSelected(null);
      await fetchProfessionals();

      setFeedback({
        msg: "Profissional atualizado com sucesso.",
        type: "success",
      });
    } catch (error) {
      setFeedback({
        msg:
          error instanceof Error
            ? error.message
            : "Erro ao atualizar profissional.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  const activeCount = useMemo(
    () => professionals.filter((item) => item.active).length,
    [professionals]
  );

  const inactiveCount = useMemo(
    () => professionals.length - activeCount,
    [professionals, activeCount]
  );

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();

    return professionals.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        (item.specialty ?? "").toLowerCase().includes(term)
    );
  }, [professionals, search]);

  return (
    <LayoutShell eyebrow="Cadastros" title="Profissionais">
      <section className={styles.pageSection}>
        <div className={styles.hero}>
          <div className={styles.heroGlow} />

          <div className={styles.heroContent}>
            <span className={styles.heroEyebrow}>Equipe da clínica</span>
            <h2 className={styles.heroTitle}>
              Gerencie os profissionais da plataforma
            </h2>
            <p className={styles.heroDescription}>
              Cadastre, edite e acompanhe os profissionais vinculados à clínica
              com visual consistente, integração ao backend e ações em tempo real.
            </p>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.heroStatItem}>
              <strong>{professionals.length}</strong>
              <span>Total</span>
            </div>

            <div className={styles.heroStatDivider} />

            <div className={styles.heroStatItem}>
              <strong>{activeCount}</strong>
              <span>Ativos</span>
            </div>

            <div className={styles.heroStatDivider} />

            <div className={styles.heroStatItem}>
              <strong>{inactiveCount}</strong>
              <span>Inativos</span>
            </div>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <article className={`${styles.statCard} ${styles.accentOne}`}>
            <div className={styles.statCardTop}>
              <span className={styles.statLabel}>Total cadastrados</span>
              <span className={styles.statIcon}>◎</span>
            </div>
            <strong className={styles.statValue}>{professionals.length}</strong>
          </article>

          <article className={`${styles.statCard} ${styles.accentTwo}`}>
            <div className={styles.statCardTop}>
              <span className={styles.statLabel}>Ativos</span>
              <span className={styles.statIcon}>✓</span>
            </div>
            <strong className={styles.statValue}>{activeCount}</strong>
          </article>

          <article className={`${styles.statCard} ${styles.accentThree}`}>
            <div className={styles.statCardTop}>
              <span className={styles.statLabel}>Inativos</span>
              <span className={styles.statIcon}>◌</span>
            </div>
            <strong className={styles.statValue}>{inactiveCount}</strong>
          </article>
        </div>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Novo cadastro</span>
              <h3 className={styles.panelTitle}>Criar profissional</h3>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Nome</label>
              <input
                type="text"
                placeholder="Nome completo"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label>Especialidade</label>
              <input
                type="text"
                placeholder="Ex: Psicologia, Clínica Geral..."
                value={form.specialty}
                onChange={(e) => updateForm("specialty", e.target.value)}
              />
            </div>

            <div className={styles.checkboxField}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => updateForm("active", e.target.checked)}
                />
                <span>Profissional ativo</span>
              </label>
            </div>
          </div>

          <div className={styles.createActions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleCreate}
              disabled={saving}
            >
              {saving ? "Salvando..." : "Criar profissional"}
            </button>
          </div>

          {feedback && (
            <p
              className={`${styles.feedback} ${
                feedback.type === "success"
                  ? styles.feedbackSuccess
                  : styles.feedbackError
              }`}
            >
              {feedback.msg}
            </p>
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Listagem</span>
              <h3 className={styles.panelTitle}>Profissionais cadastrados</h3>
            </div>

            <input
              className={styles.searchInput}
              placeholder="Buscar por nome ou especialidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className={styles.skeletonList}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.skeletonRow}>
                  <div className={styles.skeletonCircle} />
                  <div className={styles.skeletonLines}>
                    <div
                      className={styles.skeletonLine}
                      style={{ width: "38%" }}
                    />
                    <div
                      className={styles.skeletonLine}
                      style={{ width: "24%", height: 10 }}
                    />
                  </div>
                  <div className={styles.skeletonLine} style={{ width: 70 }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className={styles.emptyState}>
              {search
                ? "Nenhum resultado encontrado."
                : "Nenhum profissional cadastrado."}
            </p>
          ) : (
            <div className={styles.list}>
              {filtered.map((item) => (
                <article key={item.id} className={styles.card}>
                  <div className={styles.cardLeft}>
                    <div className={styles.cardAvatar}>{initials(item.name)}</div>

                    <div className={styles.cardContent}>
                      <div className={styles.cardTop}>
                        <strong>{item.name}</strong>

                        <span
                          className={`${styles.badge} ${
                            item.active
                              ? styles.badgeActive
                              : styles.badgeInactive
                          }`}
                        >
                          {item.active ? "Ativo" : "Inativo"}
                        </span>
                      </div>

                      <p className={styles.cardMeta}>
                        {item.specialty || "Especialidade não informada"}
                      </p>
                    </div>
                  </div>

                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => setSelected(item)}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      className={styles.dangerButton}
                      onClick={() => handleDelete(item.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {selected && (
          <div
            className={styles.modalOverlay}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelected(null);
              }
            }}
          >
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <div>
                  <p className={styles.modalEyebrow}>Editar profissional</p>
                  <h3>{selected.name}</h3>
                </div>

                <button
                  className={styles.modalClose}
                  onClick={() => setSelected(null)}
                >
                  ✕
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label>Nome</label>
                    <input
                      type="text"
                      value={selected.name}
                      onChange={(e) =>
                        setSelected({ ...selected, name: e.target.value })
                      }
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Especialidade</label>
                    <input
                      type="text"
                      value={selected.specialty || ""}
                      onChange={(e) =>
                        setSelected({ ...selected, specialty: e.target.value })
                      }
                    />
                  </div>

                  <div className={styles.checkboxField}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selected.active}
                        onChange={(e) =>
                          setSelected({ ...selected, active: e.target.checked })
                        }
                      />
                      <span>Profissional ativo</span>
                    </label>
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={handleUpdate}
                    disabled={saving}
                  >
                    {saving ? "Salvando..." : "Salvar alterações"}
                  </button>

                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => setSelected(null)}
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