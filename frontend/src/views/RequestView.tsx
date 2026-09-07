import { useState } from "react";
import type { FormEvent } from "react";
import { Icon } from "../components/Icon";
import { useUi } from "../context/UiContext";
import { useT } from "../i18n";
import { useAuth } from "../context/AuthContext";
import { createRequest } from "../api/requests";
import type { PersonRequest } from "../types";

export function RequestView() {
  const { lang } = useUi();
  const t = useT(lang);
  const { user } = useAuth();
  const trust = user?.trustScore ?? 0;

  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PersonRequest | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await createRequest(name.trim());
      setResult(created);
    } catch {
      setError(t.error_generic);
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    const autoApproved = result.status === "APPROVED";
    return (
      <div className="page" style={{ maxWidth: 720 }}>
        <div className="card" style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              background: "color-mix(in oklab, var(--ok) 18%, var(--surface))",
              color: "var(--ok)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="check" size={16} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--serif)", fontSize: 20, marginBottom: 4 }}>
              {autoApproved
                ? lang === "et"
                  ? "Päring auto-kinnitatud"
                  : "Request auto-approved"
                : lang === "et"
                ? "Päring esitatud"
                : "Request submitted"}
            </div>
            <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
              {autoApproved
                ? lang === "et"
                  ? `Trust ${trust}. Profiil avalikustatakse pärast lõpp-kontrolli.`
                  : `Trust ${trust}. Profile will be published after final check.`
                : lang === "et"
                ? `Saadetud admini järjekorda. Trust ${trust}/100 — auto-kinnitamiseks vajalik 80.`
                : `Sent to admin queue. Trust ${trust}/100 — auto-approve requires 80.`}
            </p>
            <button
              className="btn sm"
              onClick={() => {
                setResult(null);
                setName("");
              }}
            >
              {lang === "et" ? "Esita uus" : "Submit another"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <h2>{t.request_h}</h2>
          <div className="sub" style={{ marginTop: 4 }}>{t.request_sub}</div>
        </div>
      </div>

      <form
        className="card"
        onSubmit={onSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span
            className="mono"
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              color: "var(--ink-3)",
            }}
          >
            {t.request_target} <span style={{ color: "var(--danger)" }}>*</span>
          </span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder={lang === "et" ? "nt. Mait Vahter" : "e.g. Mait Vahter"}
            style={{ height: 36, fontSize: 14 }}
          />
        </label>

        <div
          className="row"
          style={{ justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--line)" }}
        >
          <span className="mono muted">
            Trust {trust}/100 {trust >= 80 ? "· auto-approve" : "· manual review"}
          </span>
          <button className="btn primary" type="submit" disabled={busy || !name.trim()}>
            {busy ? t.loading : t.request_submit} <Icon name="arrow" size={14} />
          </button>
        </div>

        {error && (
          <div className="muted" style={{ color: "var(--danger)", fontSize: 12 }}>
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
