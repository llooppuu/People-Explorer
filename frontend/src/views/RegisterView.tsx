import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUi } from "../context/UiContext";
import { useT } from "../i18n";
import { Icon } from "../components/Icon";

export function RegisterView() {
  const { lang } = useUi();
  const t = useT(lang);
  const { register } = useAuth();
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
      await register(email, password);
      navigate("/");
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setError(lang === "et" ? "See e-post on juba registreeritud." : "Email already registered.");
      } else if (status === 400) {
        setError(lang === "et" ? "Parool peab olema vähemalt 8 tähemärki." : "Password must be at least 8 characters.");
      } else {
        setError(t.error_generic);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 460 }}>
      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <h2>{t.register_h}</h2>
          <div className="sub" style={{ marginTop: 4 }}>{t.register_sub}</div>
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
            autoComplete="new-password"
            style={{ height: 36 }}
          />
        </label>
        {error && (
          <div className="muted" style={{ color: "var(--danger)", fontSize: 12 }}>
            {error}
          </div>
        )}
        <div className="row" style={{ justifyContent: "space-between", paddingTop: 6 }}>
          <Link to="/login" className="btn ghost">
            {t.have_account}
          </Link>
          <button className="btn primary" type="submit" disabled={busy}>
            {busy ? t.loading : t.submit_register} <Icon name="arrow" size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}
