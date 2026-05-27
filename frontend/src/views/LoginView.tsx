import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUi } from "../context/UiContext";
import { useT } from "../i18n";
import { Icon } from "../components/Icon";

export function LoginView() {
  const { lang } = useUi();
  const t = useT(lang);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError(lang === "et" ? "Vale e-post või parool." : "Invalid email or password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 460 }}>
      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <h2>{t.login_h}</h2>
          <div className="sub" style={{ marginTop: 4 }}>{t.login_sub}</div>
        </div>
      </div>
      <form className="card" onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span className="mono" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ink-3)" }}>
            {t.email}
          </span>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{ height: 36 }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span className="mono" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ink-3)" }}>
            {t.password}
          </span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="current-password"
            style={{ height: 36 }}
          />
        </label>
        {error && (
          <div className="muted" style={{ color: "var(--danger)", fontSize: 12 }}>
            {error}
          </div>
        )}
        <div className="row" style={{ justifyContent: "space-between", paddingTop: 6 }}>
          <Link to="/register" className="btn ghost">
            {t.no_account}
          </Link>
          <button className="btn primary" type="submit" disabled={busy}>
            {busy ? t.loading : t.submit_login} <Icon name="arrow" size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}
