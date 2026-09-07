import type { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUi } from "../context/UiContext";
import { useT } from "../i18n";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

interface NavGroup {
  section: string;
  items: { to: string; label: string; icon: IconName }[];
}

export function Layout({ children }: { children: ReactNode }) {
  const { lang, theme, setLang, setTheme } = useUi();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const t = useT(lang);
  const location = useLocation();

  const navItems: NavGroup[] = [
    {
      section: t.section_main,
      items: [
        { to: "/", label: t.nav_home, icon: "home" },
        { to: "/persons", label: t.nav_browse, icon: "grid" },
        { to: "/sources", label: t.nav_sources, icon: "server" },
      ],
    },
    ...(isAuthenticated
      ? [
          {
            section: t.section_user,
            items: [
              { to: "/requests/new", label: t.nav_request, icon: "plus" as const },
              { to: "/watchlist", label: t.nav_watchlist, icon: "bookmark" as const },
            ],
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            section: t.section_admin,
            items: [{ to: "/admin", label: t.nav_admin, icon: "shield" as const }],
          },
        ]
      : []),
  ];

  const crumbMap: Record<string, string> = {
    "/": t.nav_home,
    "/persons": t.nav_browse,
    "/sources": t.nav_sources,
    "/requests/new": t.nav_request,
    "/watchlist": t.nav_watchlist,
    "/admin": t.nav_admin,
    "/login": t.login_h,
    "/register": t.register_h,
  };

  const crumb = (() => {
    if (location.pathname.startsWith("/persons/")) return [t.nav_browse, ""];
    return [crumbMap[location.pathname] ?? ""];
  })();

  const roleLabel =
    user?.role === "ADMIN"
      ? t.role_admin
      : (user?.trustScore ?? 0) >= 80
      ? t.role_trusted
      : isAuthenticated
      ? t.role_user
      : t.role_visitor;

  const userInitials = user?.email ? user.email.slice(0, 2).toUpperCase() : "?";

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <span className="brand-glyph">DP</span>
            <span>People Explorer</span>
          </div>
          <div className="brand-sub">Eesti avalik andmebaas · v0.4</div>
        </div>
        {navItems.map((group) => (
          <div className="nav-section" key={group.section}>
            <div className="nav-section-title">{group.section}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
              >
                <span className="row" style={{ gap: 10 }}>
                  <Icon name={item.icon} size={15} /> {item.label}
                </span>
              </NavLink>
            ))}
          </div>
        ))}

        <div className="user-card">
          {isAuthenticated ? (
            <>
              <div className="avatar">{userInitials}</div>
              <div className="meta" style={{ minWidth: 0, flex: 1 }}>
                <div
                  className="name"
                  style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {user?.email}
                </div>
                <div className="role">{roleLabel}</div>
              </div>
              <span className="trust-pill">{user?.trustScore ?? 0}</span>
            </>
          ) : (
            <NavLink to="/login" className="btn" style={{ width: "100%", justifyContent: "center" }}>
              {t.submit_login}
            </NavLink>
          )}
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="crumbs">
            {crumb.filter(Boolean).map((c, i) => (
              <span key={i} className={i === crumb.filter(Boolean).length - 1 ? "current" : ""}>
                {c}
              </span>
            ))}
          </div>
          <span className="topbar-spacer" />
          <div className="lang-toggle">
            <button className={lang === "et" ? "on" : ""} onClick={() => setLang("et")}>
              ET
            </button>
            <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>
              EN
            </button>
          </div>
          <button
            className="icon-btn"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            title={theme === "light" ? "Dossier mode" : "Register mode"}
          >
            <Icon name={theme === "light" ? "sun" : "eye"} size={14} />
          </button>
          {isAuthenticated && (
            <button className="icon-btn" onClick={logout} title={t.logout}>
              <Icon name="logout" size={14} />
            </button>
          )}
        </div>
        {children}
      </main>
    </div>
  );
}
