import { useEffect, useState } from "react";
import { Icon } from "../components/Icon";
import { useUi } from "../context/UiContext";
import { useT } from "../i18n";
import { getEuipoSettings, updateEuipoSettings, type EuipoSettingsStatus } from "../api/integrations";
import { listRequests, updateRequest } from "../api/requests";
import type { PersonRequest, RequestStatus } from "../types";

export function AdminView() {
  const { lang } = useUi();
  const t = useT(lang);
  const [filter, setFilter] = useState<RequestStatus>("PENDING");
  const [items, setItems] = useState<PersonRequest[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [euipoSettings, setEuipoSettings] = useState<EuipoSettingsStatus | null>(null);
  const [euipoClientId, setEuipoClientId] = useState("");
  const [euipoClientSecret, setEuipoClientSecret] = useState("");
  const [euipoBusy, setEuipoBusy] = useState(false);
  const [euipoMessage, setEuipoMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listRequests(filter)
      .then((data) => {
        if (!active) return;
        setItems(data);
        setActiveId(data[0]?.id ?? null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filter]);

  useEffect(() => {
    let active = true;

    getEuipoSettings().then((settings) => {
      if (!active) return;
      setEuipoSettings(settings);
      setEuipoClientId(settings.clientId ?? "");
    });

    return () => {
      active = false;
    };
  }, []);

  const active = items.find((r) => r.id === activeId) ?? null;

  async function decide(status: "APPROVED" | "REJECTED") {
    if (!active) return;
    setBusy(true);
    try {
      const updated = await updateRequest(active.id, status);
      setItems((list) => list.map((r) => (r.id === updated.id ? updated : r)));
    } finally {
      setBusy(false);
    }
  }

  async function saveEuipoSettings() {
    setEuipoBusy(true);
    setEuipoMessage(null);
    try {
      const settings = await updateEuipoSettings({
        clientId: euipoClientId,
        clientSecret: euipoClientSecret
      });
      setEuipoSettings(settings);
      setEuipoClientSecret("");
      setEuipoMessage(lang === "et" ? "EUIPO võtmed salvestatud." : "EUIPO credentials saved.");
    } finally {
      setEuipoBusy(false);
    }
  }

  const filterLabels: Record<RequestStatus, string> = {
    PENDING: lang === "et" ? "Ootel" : "Pending",
    APPROVED: lang === "et" ? "Kinnitatud" : "Approved",
    REJECTED: lang === "et" ? "Tagasi lükatud" : "Rejected",
  };

  return (
    <div className="page">
      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <h2>{t.admin_h}</h2>
          <div className="sub" style={{ marginTop: 4 }}>
            {items.length} · {t.admin_sub}
          </div>
        </div>
        <div className="filter-group">
          {(["PENDING", "APPROVED", "REJECTED"] as RequestStatus[]).map((s) => (
            <button
              key={s}
              className={"chip" + (filter === s ? " active" : "")}
              onClick={() => setFilter(s)}
              style={{ cursor: "pointer", border: 0 }}
            >
              {filterLabels[s]}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          border: "1px solid var(--line)",
          borderRadius: "var(--radius)",
          background: "var(--surface)",
          padding: 16,
          marginBottom: 18,
        }}
      >
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div>
            <strong>EUIPO Persons</strong>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              {lang === "et"
                ? "Kaubamärgi ja disaini taotlejate ning esindajate API võtmed."
                : "API credentials for trademark and design applicants and representatives."}
            </div>
          </div>
          <span className={"status " + (euipoSettings?.configured ? "approved" : "pending")}>
            <span className="pulse" />{" "}
            {euipoSettings?.configured
              ? lang === "et"
                ? "seadistatud"
                : "configured"
              : lang === "et"
              ? "seadistamata"
              : "not configured"}
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) auto",
            gap: 10,
            alignItems: "end",
            marginTop: 14,
          }}
        >
          <label>
            <div className="mono muted" style={{ fontSize: 10, textTransform: "uppercase", marginBottom: 5 }}>
              Client ID
            </div>
            <input
              className="input"
              value={euipoClientId}
              onChange={(event) => setEuipoClientId(event.target.value)}
              style={{ width: "100%" }}
            />
          </label>
          <label>
            <div className="mono muted" style={{ fontSize: 10, textTransform: "uppercase", marginBottom: 5 }}>
              Client Secret
            </div>
            <input
              className="input"
              type="password"
              value={euipoClientSecret}
              onChange={(event) => setEuipoClientSecret(event.target.value)}
              placeholder={euipoSettings?.secretPreview ?? ""}
              style={{ width: "100%" }}
            />
          </label>
          <button
            className="btn primary"
            onClick={saveEuipoSettings}
            disabled={euipoBusy || !euipoClientId.trim() || !euipoClientSecret.trim()}
          >
            <Icon name="check" size={14} /> {lang === "et" ? "Salvesta" : "Save"}
          </button>
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
          {euipoMessage ??
            (euipoSettings?.source === "environment"
              ? lang === "et"
                ? "Praegu kasutatakse .env väärtuseid; salvestamine asendab need andmebaasi seadistusega."
                : "Currently using .env values; saving here switches to database settings."
              : lang === "et"
              ? "Salvestatud võtit hoitakse serveripoolselt ja frontendi tagasi ei saadeta."
              : "The saved secret is stored server-side and is not sent back to the frontend.")}
        </div>
      </div>

      {loading ? (
        <div className="empty">{t.loading}</div>
      ) : items.length === 0 ? (
        <div className="empty">{t.no_results}</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 420px",
            gap: 0,
            border: "1px solid var(--line)",
            borderRadius: "var(--radius)",
            overflow: "hidden",
            background: "var(--surface)",
          }}
        >
          <div style={{ borderRight: "1px solid var(--line)" }}>
            <table className="table" style={{ borderRadius: 0 }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{lang === "et" ? "Subjekt" : "Subject"}</th>
                  <th>{lang === "et" ? "Esitatud" : "Submitted"}</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setActiveId(r.id)}
                    style={{
                      cursor: "pointer",
                      background: activeId === r.id ? "var(--bg-2)" : undefined,
                    }}
                  >
                    <td className="mono muted">{r.id.slice(0, 8)}</td>
                    <td>
                      <strong>{r.targetPersonName}</strong>
                    </td>
                    <td className="mono muted">
                      {new Date(r.createdAt).toISOString().slice(0, 10)}
                    </td>
                    <td>
                      <span
                        className={
                          "status " +
                          (r.status === "PENDING"
                            ? "pending"
                            : r.status === "REJECTED"
                            ? "rejected"
                            : "approved")
                        }
                      >
                        <span className="pulse" /> {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {active && (
            <div style={{ padding: 24, background: "var(--bg-2)" }}>
              <div className="mono muted" style={{ fontSize: 11 }}>
                {active.id.toUpperCase()} ·{" "}
                {new Date(active.createdAt).toISOString().slice(0, 16).replace("T", " ")}
              </div>
              <h3
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 24,
                  fontWeight: 400,
                  margin: "8px 0 4px 0",
                }}
              >
                {active.targetPersonName}
              </h3>
              <div
                style={{
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: "1px solid var(--line)",
                }}
              >
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    color: "var(--ink-3)",
                    marginBottom: 8,
                  }}
                >
                  Status
                </div>
                <span
                  className={
                    "status " +
                    (active.status === "PENDING"
                      ? "pending"
                      : active.status === "REJECTED"
                      ? "rejected"
                      : "approved")
                  }
                >
                  <span className="pulse" /> {active.status}
                </span>
              </div>
              {active.status === "PENDING" && (
                <div
                  className="row"
                  style={{
                    marginTop: 24,
                    paddingTop: 16,
                    borderTop: "1px solid var(--line)",
                  }}
                >
                  <button
                    className="btn primary"
                    style={{ flex: 1 }}
                    onClick={() => decide("APPROVED")}
                    disabled={busy}
                  >
                    <Icon name="check" size={14} /> {t.admin_approve}
                  </button>
                  <button
                    className="btn danger"
                    onClick={() => decide("REJECTED")}
                    disabled={busy}
                  >
                    <Icon name="x" size={14} /> {t.admin_reject}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
