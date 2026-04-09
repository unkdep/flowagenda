"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./register.module.css";
import { useAuth } from "../contexts/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { registerClinic } = useAuth();

  const [clinicName, setClinicName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");

    try {
      await registerClinic({
        clinic_name: clinicName.trim(),
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      router.replace("/");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Não foi possível criar a conta."
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

        <h1 className={styles.heading}>Criar conta da clínica</h1>
        <p className={styles.sub}>
          Crie a agenda principal, vire admin da clínica e depois cadastre os profissionais.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row2}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Nome da clínica</span>
              <input
                className={styles.fieldInput}
                type="text"
                placeholder="Ex.: FlowAgenda Clínica"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                required
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Seu nome</span>
              <input
                className={styles.fieldInput}
                type="text"
                placeholder="Ex.: Rafael"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </label>
          </div>

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
              placeholder="Mínimo de 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>

          {errorMessage && (
            <p className={styles.errorMessage}>{errorMessage}</p>
          )}

          <button type="submit" className={styles.primaryButton} disabled={saving}>
            {saving ? "Criando conta..." : "Criar agenda"}
          </button>
        </form>

        <div className={styles.divider}>ou</div>

        <p className={styles.footer}>
          Já tem conta? <Link href="/login">Entrar</Link>
        </p>
      </section>
    </main>
  );
}