"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./login.module.css";
import { useAuth } from "../contexts/auth-context";

type AccessType = "clinic" | "professional";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [accessType, setAccessType] = useState<AccessType>("clinic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const subtitle = useMemo(() => {
    return accessType === "clinic"
      ? "Acesse com a conta principal da clínica."
      : "Acesse com sua conta individual de profissional.";
  }, [accessType]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");

    try {
      await login({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      router.replace("/");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Não foi possível entrar."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />

      <section className={styles.card}>
        <div className={styles.shimmer} />

        <div className={styles.logo}>
          <div className={styles.logoMark}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="6" height="6" rx="2" fill="rgba(227,227,209,0.9)" />
              <rect x="10" y="2" width="6" height="6" rx="2" fill="rgba(227,227,209,0.5)" />
              <rect x="2" y="10" width="6" height="6" rx="2" fill="rgba(227,227,209,0.5)" />
              <rect x="10" y="10" width="6" height="6" rx="2" fill="rgba(227,227,209,0.75)" />
            </svg>
          </div>
          <span className={styles.logoName}>FlowAgenda</span>
        </div>

        <h1 className={styles.heading}>Entrar na agenda</h1>
        <p className={styles.sub}>{subtitle}</p>

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${accessType === "clinic" ? styles.tabActive : ""}`}
            onClick={() => setAccessType("clinic")}
          >
            Clínica
          </button>
          <button
            type="button"
            className={`${styles.tab} ${accessType === "professional" ? styles.tabActive : ""}`}
            onClick={() => setAccessType("professional")}
          >
            Profissional
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>E-mail</span>
            <input
              className={styles.fieldInput}
              type="email"
              placeholder="voce@clinica.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Senha</span>
            <input
              className={styles.fieldInput}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <div className={styles.row}>
            <label className={styles.remember}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Lembrar de mim
            </label>
            <a href="#" className={styles.forgot}>Esqueci a senha</a>
          </div>

          {errorMessage && (
            <p className={styles.errorMessage}>{errorMessage}</p>
          )}

          <button type="submit" className={styles.primaryButton} disabled={saving}>
            {saving ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className={styles.divider}>ou</div>

        <p className={styles.footer}>
          Ainda não tem conta?{" "}
          <Link href="/register">Criar conta da clínica</Link>
        </p>
      </section>
    </main>
  );
}