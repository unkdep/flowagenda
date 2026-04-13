"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutShell } from "../components/layout-shell";
import { apiFetch } from "../lib/api";
import styles from "./clients.module.css";

type Client = {
  id: number;
  name: string;
  email: string;
  phone: string;
  clinic: number | null;
};

type FormDataType = {
  name: string;
  email: string;
  phone: string;
};

const initialForm: FormDataType = {
  name: "",
  email: "",
  phone: "",
};

const PAGE_SIZE = 6;

function initials(name: string) {
  if (!name) return "?";
  const parts = name.trim().split(" ").filter(Boolean);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState<FormDataType>(initialForm);
  const [selected, setSelected] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  async function fetchClients() {
    const data = await apiFetch<Client[]>("/api/clients/");
    setClients(Array.isArray(data) ? data : []);
  }

  async function loadPage() {
    try {
      setLoading(true);
      setFeedback(null);
      await fetchClients();
    } catch (error) {
      setFeedback({
        msg: "Não foi possível carregar os dados de clientes.",
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
      setFeedback({ msg: "Informe o nome do cliente.", type: "error" });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);

      await apiFetch("/api/clients/", {
        method: "POST",
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
        },
      });

      setForm(initialForm);
      await fetchClients();
      setFeedback({ msg: "Cliente criado com sucesso.", type: "success" });
    } catch (error) {
      setFeedback({
        msg:
          error instanceof Error
            ? error.message
            : "Erro ao criar cliente. Verifique os campos obrigatórios.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Deseja realmente excluir este cliente?")) return;

    try {
      setFeedback(null);
      await apiFetch(`/api/clients/${id}/`, { method: "DELETE" });
      await fetchClients();
      setFeedback({ msg: "Cliente excluído com sucesso.", type: "success" });
    } catch (error) {
      setFeedback({
        msg:
          error instanceof Error
            ? error.message
            : "Não foi possível excluir o cliente.",
        type: "error",
      });
    }
  }

  async function handleUpdate() {
    if (!selected) return;

    if (!selected.name.trim()) {
      setFeedback({ msg: "O nome do cliente é obrigatório.", type: "error" });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);

      await apiFetch(`/api/clients/${selected.id}/`, {
        method: "PUT",
        body: {
          name: selected.name.trim(),
          email: selected.email?.trim() ?? "",
          phone: selected.phone?.trim() ?? "",
        },
      });

      setSelected(null);
      await fetchClients();
      setFeedback({ msg: "Cliente atualizado com sucesso.", type: "success" });
    } catch (error) {
      setFeedback({
        msg:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar o cliente.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  const totalWithEmail = useMemo(
    () => clients.filter((item) => item.email).length,
    [clients]
  );

  const totalWithPhone = useMemo(
    () => clients.filter((item) => item.phone).length,
    [clients]
  );

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    setPage(1);
    return clients.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        (item.email ?? "").toLowerCase().includes(term) ||
        (item.phone ?? "").toLowerCase().includes(term)
    );
  }, [clients, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  return (
    <LayoutShell
      eyebrow="Cadastros"
      title="Clientes"
      actionLabel="Novo cliente"
      actionHref="/clients"
    >
      <section className={styles.pageSection}>
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.heroEyebrow}>Relacionamento</span>
            <h2 className={styles.heroTitle}>Gerencie os clientes da clínica</h2>
            <p className={styles.heroDescription}>
              Cadastre, edite e remova clientes com dados reais integrados ao
              backend, mantendo a operação da clínica organizada e atualizada.
            </p>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.heroStatItem}>
              <strong>{clients.length}</strong>
              <span>Total</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStatItem}>
              <strong>{totalWithEmail}</strong>
              <span>Com e-mail</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStatItem}>
              <strong>{totalWithPhone}</strong>
              <span>Com tel.</span>
            </div>
          </div>
        </div>

        {/* Stat cards — hidden on mobile */}
        <div className={styles.statsGrid}>
          <article className={`${styles.statCard} ${styles.statCardOne}`}>
            <span className={styles.statLabel}>Total</span>
            <strong className={styles.statValue}>{clients.length}</strong>
          </article>

          <article className={`${styles.statCard} ${styles.statCardTwo}`}>
            <span className={styles.statLabel}>Com e-mail</span>
            <strong className={styles.statValue}>{totalWithEmail}</strong>
          </article>

          <article className={`${styles.statCard} ${styles.statCardThree}`}>
            <span className={styles.statLabel}>Com telefone</span>
            <strong className={styles.statValue}>{totalWithPhone}</strong>
          </article>
        </div>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Novo cadastro</span>
              <h3 className={styles.panelTitle}>Criar cliente</h3>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Nome</label>
              <input
                type="text"
                placeholder="Nome do cliente"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label>E-mail</label>
              <input
                type="email"
                placeholder="email@exemplo.com"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label>Telefone</label>
              <input
                type="text"
                placeholder="(11) 99999-9999"
                value={form.phone}
                onChange={(e) => updateForm("phone", e.target.value)}
              />
            </div>
          </div>

          <div className={styles.createActions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleCreate}
              disabled={saving}
            >
              {saving ? "Salvando..." : "Criar cliente"}
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
              <h3 className={styles.panelTitle}>Clientes cadastrados</h3>
            </div>

            <input
              className={styles.searchInput}
              placeholder="Buscar por nome, e-mail ou telefone..."
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
                    <div className={styles.skeletonLine} style={{ width: "40%" }} />
                    <div className={styles.skeletonLine} style={{ width: "26%", height: 10 }} />
                  </div>
                  <div className={styles.skeletonLine} style={{ width: 70 }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className={styles.emptyState}>
              {search ? "Nenhum resultado encontrado." : "Nenhum cliente cadastrado."}
            </p>
          ) : (
            <>
              <div className={styles.list}>
                {paginated.map((item) => (
                  <article key={item.id} className={styles.card}>
                    <div className={styles.cardLeft}>
                      <div className={styles.cardAvatar}>{initials(item.name)}</div>

                      <div className={styles.cardContent}>
                        <div className={styles.cardTop}>
                          <strong>{item.name}</strong>
                        </div>
                        <p className={styles.cardMeta}>
                          {item.email || "E-mail não informado"}
                        </p>
                        <p className={styles.cardMeta}>
                          {item.phone || "Telefone não informado"}
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
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
                  </span>
                </div>
              )}
            </>
          )}
        </section>

        {selected && (
          <div
            className={styles.modalOverlay}
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelected(null);
            }}
          >
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <div>
                  <p className={styles.modalEyebrow}>Editar cliente</p>
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
                    <label>E-mail</label>
                    <input
                      type="email"
                      value={selected.email || ""}
                      onChange={(e) =>
                        setSelected({ ...selected, email: e.target.value })
                      }
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Telefone</label>
                    <input
                      type="text"
                      value={selected.phone || ""}
                      onChange={(e) =>
                        setSelected({ ...selected, phone: e.target.value })
                      }
                    />
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