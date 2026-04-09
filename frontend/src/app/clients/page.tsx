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

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState<FormDataType>(initialForm);
  const [selected, setSelected] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function fetchClients() {
    const data = await apiFetch<Client[]>("/api/clients/");
    setClients(Array.isArray(data) ? data : []);
  }

  async function loadPage() {
    try {
      setLoading(true);
      setFeedback("");
      await fetchClients();
    } catch (error) {
      console.error(error);
      setFeedback("Não foi possível carregar os dados de clientes.");
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
      setFeedback("Informe o nome do cliente.");
      return;
    }

    try {
      setSaving(true);
      setFeedback("");

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      };

      await apiFetch("/api/clients/", {
        method: "POST",
        body: payload,
      });

      setForm(initialForm);
      await fetchClients();
      setFeedback("Cliente criado com sucesso.");
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        setFeedback(error.message);
      } else {
        setFeedback("Erro ao criar cliente. Verifique os campos obrigatórios.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm("Deseja realmente excluir este cliente?");
    if (!confirmed) return;

    try {
      setFeedback("");

      await apiFetch(`/api/clients/${id}/`, {
        method: "DELETE",
      });

      await fetchClients();
      setFeedback("Cliente excluído com sucesso.");
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        setFeedback(error.message);
      } else {
        setFeedback("Não foi possível excluir o cliente.");
      }
    }
  }

  async function handleUpdate() {
    if (!selected) return;

    if (!selected.name.trim()) {
      setFeedback("O nome do cliente é obrigatório.");
      return;
    }

    try {
      setSaving(true);
      setFeedback("");

      const payload = {
        name: selected.name.trim(),
        email: selected.email?.trim() ?? "",
        phone: selected.phone?.trim() ?? "",
      };

      await apiFetch(`/api/clients/${selected.id}/`, {
        method: "PUT",
        body: payload,
      });

      setSelected(null);
      await fetchClients();
      setFeedback("Cliente atualizado com sucesso.");
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        setFeedback(error.message);
      } else {
        setFeedback("Não foi possível atualizar o cliente.");
      }
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

  return (
    <LayoutShell
      eyebrow="Cadastros"
      title="Clientes"
      actionLabel="Novo cliente"
      actionHref="/clients"
    >
      <section className={styles.pageSection}>
        <div className={styles.hero}>
          <div>
            <span className={styles.heroEyebrow}>Relacionamento</span>
            <h2 className={styles.heroTitle}>Gerencie os clientes da clínica</h2>
            <p className={styles.heroDescription}>
              Cadastre, edite e remova clientes com dados reais integrados ao
              backend, mantendo a operação da clínica organizada e atualizada.
            </p>
          </div>
        </div>

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

          {feedback && <p className={styles.feedback}>{feedback}</p>}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Listagem</span>
              <h3 className={styles.panelTitle}>Clientes cadastrados</h3>
            </div>
          </div>

          {loading ? (
            <p className={styles.feedback}>Carregando clientes...</p>
          ) : clients.length === 0 ? (
            <p className={styles.feedback}>Nenhum cliente cadastrado.</p>
          ) : (
            <div className={styles.list}>
              {clients.map((item) => (
                <article key={item.id} className={styles.card}>
                  <div className={styles.cardContent}>
                    <div className={styles.cardTop}>
                      <strong>{item.name}</strong>
                    </div>

                    <p className={styles.cardMeta}>
                      E-mail: {item.email || "Não informado"}
                    </p>
                    <p className={styles.cardMeta}>
                      Telefone: {item.phone || "Não informado"}
                    </p>
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
                <h3>Editar cliente</h3>
              </div>

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
        )}
      </section>
    </LayoutShell>
  );
}