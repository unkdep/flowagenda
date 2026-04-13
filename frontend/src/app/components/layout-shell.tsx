"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "../contexts/auth-context";

type LayoutShellProps = {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  actionLabel?: string;
  actionHref?: string;
};

const NAV = [
  { label: "Dashboard", href: "/", icon: <IconDash /> },
  { label: "Agendas", href: "/agendas", icon: <IconCalSmall /> },
  { label: "Profissionais", href: "/professionals", icon: <IconPeople /> },
  { label: "Clientes", href: "/clients", icon: <IconClient /> },
  { label: "Serviços", href: "/services", icon: <IconService /> },
  { label: "Calendário", href: "/calendar", icon: <IconCal /> },
  { label: "Integrações", href: "/integrations", icon: <IconInteg /> },
];

function IconDash() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="2" fill="currentColor" opacity="0.9" />
      <rect x="9" y="1" width="6" height="6" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="1" y="9" width="6" height="6" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="9" y="9" width="6" height="6" rx="2" fill="currentColor" opacity="0.75" />
    </svg>
  );
}

function IconCalSmall() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="3" width="14" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 1v3M11 1v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M1 7h14" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function IconPeople() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="6" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1 14c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.3" opacity="0.6" />
      <path d="M14 14c0-1.657-1.343-3-3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

function IconClient() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5.5" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1.5 15c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconService() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.53 11.53l1.42 1.42M3.05 12.95l1.42-1.42M11.53 4.47l1.42-1.42"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconCal() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="3" width="14" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 1v3M11 1v3M1 7h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="5" cy="10.5" r="1" fill="currentColor" />
      <circle cx="8" cy="10.5" r="1" fill="currentColor" />
      <circle cx="11" cy="10.5" r="1" fill="currentColor" />
    </svg>
  );
}

function IconInteg() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="3.5" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12.5" cy="3.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12.5" cy="12.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 8h2.5M9 8l3-4.3M9 8l3 4.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect y="3" width="18" height="1.8" rx="0.9" fill="currentColor" />
      <rect y="8.1" width="18" height="1.8" rx="0.9" fill="currentColor" />
      <rect y="13.2" width="18" height="1.8" rx="0.9" fill="currentColor" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9 2h3a1 1 0 011 1v8a1 1 0 01-1 1H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 10l3-3-3-3M9 7H1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getInitials(name?: string, email?: string) {
  const src = name || email || "U";
  const parts = src.trim().split(" ").filter(Boolean);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return src.slice(0, 2).toUpperCase();
}

export function LayoutShell({
  children,
  eyebrow = "Painel",
  title = "Dashboard",
  actionLabel = "Novo",
  actionHref = "/",
}: LayoutShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isAuthenticated, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function isActive(href: string) {
    return href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  async function handleLogout() {
    try {
      await logout();
    } catch {}
    router.replace("/login");
  }

  const filteredNav = useMemo(
    () =>
      user?.role === "professional"
        ? NAV.filter(
            (item) =>
              !["/integrations", "/services", "/professionals"].includes(
                item.href
              )
          )
        : NAV,
    [user?.role]
  );

  const initials = getInitials(user?.full_name, user?.email);
  const sidebarWidth = collapsed ? "76px" : "252px";

  const css = `
    .shell {
      display: flex;
      min-height: 100vh;
      background: #1a2420;
      color: #e3e3d1;
      font-family: system-ui, -apple-system, sans-serif;
      align-items: stretch;
    }

    .sb {
      width: ${sidebarWidth};
      min-width: ${sidebarWidth};
      min-height: 100vh;
      height: auto;
      position: relative;
      background: #141e1a;
      border-right: 1px solid rgba(176,176,135,0.1);
      display: flex;
      flex-direction: column;
      padding: 18px 12px 16px;
      transition: width .22s cubic-bezier(.4,0,.2,1), min-width .22s cubic-bezier(.4,0,.2,1), transform .25s cubic-bezier(.4,0,.2,1);
      overflow: hidden;
      z-index: 60;
      align-self: stretch;
    }

    .sb-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 4px;
      margin-bottom: 8px;
      min-width: 0;
    }

    .sb-mark {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      flex-shrink: 0;
      background: linear-gradient(135deg, #58706d, #7c8a6e);
      box-shadow: 0 0 0 1px rgba(176,176,135,0.2), 0 6px 18px rgba(88,112,109,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 800;
      color: #f0efe8;
    }

    .sb-brand-text {
      min-width: 0;
      overflow: hidden;
      opacity: ${collapsed ? 0 : 1};
      transition: opacity .18s;
      pointer-events: ${collapsed ? "none" : "auto"};
    }

    .sb-brand-name {
      font-size: 14px;
      font-weight: 700;
      color: #f0efe8;
      margin: 0;
      white-space: nowrap;
    }

    .sb-brand-clinic {
      font-size: 11px;
      color: rgba(176,176,135,0.55);
      margin: 2px 0 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 148px;
    }

    .sb-toggle-row {
      display: flex;
      justify-content: flex-end;
      margin: 6px 0 22px;
    }

    .sb-toggle {
      width: 30px;
      height: 30px;
      border-radius: 9px;
      border: 1px solid rgba(176,176,135,0.12);
      background: rgba(176,176,135,0.06);
      color: rgba(176,176,135,0.55);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background .15s, color .15s, transform .15s;
    }

    .sb-toggle:hover {
      background: rgba(176,176,135,0.12);
      color: #e3e3d1;
      transform: scale(1.05);
    }

    .sb-section {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: rgba(176,176,135,0.28);
      padding: 0 10px;
      margin: 0 0 8px;
      white-space: nowrap;
      overflow: hidden;
      opacity: ${collapsed ? 0 : 1};
      transition: opacity .15s;
    }

    .sb-nav {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .sb-link {
      display: flex;
      align-items: center;
      gap: 13px;
      height: 46px;
      padding: 0 ${collapsed ? "0" : "13px"};
      ${collapsed ? "justify-content:center;" : ""}
      border-radius: 13px;
      border: 1px solid transparent;
      color: rgba(176,176,135,0.55);
      font-size: 13.5px;
      font-weight: 500;
      text-decoration: none;
      transition: background .15s, color .15s, border-color .15s;
      white-space: nowrap;
      overflow: hidden;
    }

    .sb-link:hover {
      background: rgba(176,176,135,0.07);
      color: #e3e3d1;
    }

    .sb-link.active {
      background: rgba(88,112,109,0.2);
      border-color: rgba(124,138,110,0.25);
      color: #f0efe8;
      font-weight: 600;
    }

    .sb-link.active .sb-link-icon {
      color: #b0b087;
    }

    .sb-link-icon {
      width: 18px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .sb-link-label {
      opacity: ${collapsed ? 0 : 1};
      transition: opacity .15s;
      pointer-events: ${collapsed ? "none" : "auto"};
      overflow: hidden;
    }

    .sb-footer {
      border-top: 1px solid rgba(176,176,135,0.08);
      padding-top: 14px;
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .sb-user {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px ${collapsed ? "0" : "10px"};
      ${collapsed ? "justify-content:center;" : ""}
      border-radius: 12px;
      min-width: 0;
    }

    .sb-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4a6663, #3e4f4f);
      border: 1.5px solid rgba(176,176,135,0.18);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11.5px;
      font-weight: 700;
      color: #e3e3d1;
      flex-shrink: 0;
    }

    .sb-user-info {
      min-width: 0;
      overflow: hidden;
      opacity: ${collapsed ? 0 : 1};
      transition: opacity .15s;
    }

    .sb-user-name {
      font-size: 12.5px;
      font-weight: 600;
      color: #e3e3d1;
      margin: 0 0 1px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sb-user-role {
      font-size: 11px;
      color: rgba(176,176,135,0.45);
      margin: 0;
    }

    .sb-logout {
      display: flex;
      align-items: center;
      justify-content: ${collapsed ? "center" : "flex-start"};
      gap: 8px;
      height: 38px;
      padding: 0 ${collapsed ? "0" : "12px"};
      border-radius: 11px;
      border: 1px solid rgba(176,176,135,0.1);
      background: transparent;
      color: rgba(176,176,135,0.45);
      font-size: 12.5px;
      font-weight: 500;
      cursor: pointer;
      transition: background .15s, color .15s, border-color .15s;
      width: 100%;
      white-space: nowrap;
      overflow: hidden;
    }

    .sb-logout:hover {
      background: rgba(184,92,92,0.1);
      color: #e8a0a0;
      border-color: rgba(184,92,92,0.22);
    }

    .sb-logout-label {
      opacity: ${collapsed ? 0 : 1};
      transition: opacity .15s;
      overflow: hidden;
    }

    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(3px);
      z-index: 50;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: opacity .25s ease, visibility .25s ease;
      display: none;
    }

    .overlay.open {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }

    .content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .topbar {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      padding: 1.75rem 2rem 1.25rem;
      border-bottom: 1px solid rgba(176,176,135,0.08);
      position: sticky;
      top: 0;
      background: rgba(26,36,32,0.9);
      backdrop-filter: blur(14px);
      z-index: 40;
    }

    .topbar-left {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      min-width: 0;
    }

    .topbar-hamburger {
      display: none;
      width: 38px;
      height: 38px;
      border-radius: 11px;
      border: 1px solid rgba(176,176,135,0.12);
      background: rgba(176,176,135,0.06);
      color: rgba(176,176,135,0.7);
      cursor: pointer;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background .15s, color .15s;
      position: relative;
      z-index: 70;
    }

    .topbar-hamburger:hover {
      background: rgba(176,176,135,0.12);
      color: #e3e3d1;
    }

    .topbar-eyebrow {
      display: block;
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #b0b087;
      margin-bottom: 4px;
    }

    .topbar-title {
      font-size: 22px;
      font-weight: 700;
      color: #f0efe8;
      margin: 0;
      line-height: 1.15;
      word-break: break-word;
    }

    .topbar-sub {
      margin: 5px 0 0;
      font-size: 12.5px;
      color: rgba(176,176,135,0.5);
      word-break: break-word;
    }

    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      flex-wrap: wrap;
    }

    .btn-action {
      height: 38px;
      padding: 0 18px;
      border-radius: 11px;
      border: none;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      color: #1a2420;
      background: linear-gradient(135deg, #c8c8a0, #e3e3d1);
      box-shadow: 0 4px 14px rgba(200,200,160,0.2);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: filter .15s, transform .15s;
    }

    .btn-action:hover {
      filter: brightness(1.06);
      transform: translateY(-1px);
    }

    .btn-logout {
      height: 38px;
      padding: 0 16px;
      border-radius: 11px;
      border: 1px solid rgba(176,176,135,0.12);
      background: rgba(176,176,135,0.06);
      color: rgba(176,176,135,0.6);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: background .15s, color .15s, border-color .15s;
    }

    .btn-logout:hover {
      background: rgba(184,92,92,0.12);
      color: #e8a0a0;
      border-color: rgba(184,92,92,0.25);
    }

    .main {
      flex: 1;
      padding: 2rem;
      min-width: 0;
    }

    @media (max-width: 768px) {
      .shell {
        display: block;
      }

      .overlay {
        display: block;
      }

      .sb {
        position: fixed;
        top: 0;
        left: 0;
        width: 272px !important;
        min-width: 272px !important;
        height: 100vh;
        min-height: 100vh;
        transform: translateX(-100%);
        box-shadow: 8px 0 40px rgba(0,0,0,0.4);
      }

      .sb.mob-open {
        transform: translateX(0);
      }

      .sb-toggle-row {
        display: none;
      }

      .sb-brand-text,
      .sb-link-label,
      .sb-logout-label,
      .sb-user-info {
        opacity: 1 !important;
        pointer-events: auto !important;
      }

      .sb-link {
        padding: 0 13px !important;
        justify-content: flex-start !important;
      }

      .sb-logout {
        padding: 0 12px !important;
        justify-content: flex-start !important;
      }

      .sb-user {
        padding: 8px 10px !important;
        justify-content: flex-start !important;
      }

      .sb-section {
        opacity: 1 !important;
      }

      .topbar-hamburger {
        display: inline-flex;
      }

      .topbar {
        padding: 1.25rem 1.25rem 1rem;
      }

      .main {
        padding: 1.25rem;
      }
    }

    @media (max-width: 480px) {
      .topbar {
        flex-direction: column;
        align-items: stretch;
      }

      .topbar-title {
        font-size: 19px;
      }

      .topbar-actions {
        flex-wrap: wrap;
        width: 100%;
      }

      .btn-action,
      .btn-logout {
        flex: 1;
        justify-content: center;
      }
    }
  `;

  if (loading || !isAuthenticated) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#1a2420",
          color: "#e3e3d1",
          fontSize: "14px",
        }}
      >
        Carregando...
      </div>
    );
  }

  return (
    <>
      <style>{css}</style>

      <div className="shell">
        <div
          className={`overlay ${mobileOpen ? "open" : ""}`}
          onClick={() => setMobileOpen(false)}
        />

        <aside className={`sb ${mobileOpen ? "mob-open" : ""}`}>
          <div className="sb-brand">
            <div className="sb-mark">F</div>
            <div className="sb-brand-text">
              <p className="sb-brand-name">FlowAgenda</p>
              <p className="sb-brand-clinic">{user?.clinic_name}</p>
            </div>
          </div>

          <div className="sb-toggle-row">
            <button
              className="sb-toggle"
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              aria-label="Colapsar menu"
            >
              {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
            </button>
          </div>

          <div className="sb-section">Navegação</div>

          <nav className="sb-nav" aria-label="Navegação principal">
            {filteredNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sb-link ${isActive(item.href) ? "active" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <span className="sb-link-icon">{item.icon}</span>
                <span className="sb-link-label">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="sb-footer">
            <div className="sb-user">
              <div className="sb-avatar">{initials}</div>
              <div className="sb-user-info">
                <p className="sb-user-name">{user?.full_name || "Usuário"}</p>
                <p className="sb-user-role">{user?.role}</p>
              </div>
            </div>

            <button className="sb-logout" type="button" onClick={handleLogout}>
              <IconLogout />
              <span className="sb-logout-label">Sair da conta</span>
            </button>
          </div>
        </aside>

        <div className="content">
          <header className="topbar">
            <div className="topbar-left">
              <button
                className="topbar-hamburger"
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
              >
                {mobileOpen ? <IconClose /> : <IconMenu />}
              </button>

              <div>
                <span className="topbar-eyebrow">{eyebrow}</span>
                <h1 className="topbar-title">{title}</h1>
                <p className="topbar-sub">
                  {user?.full_name || user?.email} · {user?.role}
                </p>
              </div>
            </div>

            <div className="topbar-actions">
              <Link className="btn-action" href={actionHref}>
                {actionLabel}
              </Link>

              <button className="btn-logout" type="button" onClick={handleLogout}>
                Sair
              </button>
            </div>
          </header>

          <main className="main">{children}</main>
        </div>
      </div>
    </>
  );
}