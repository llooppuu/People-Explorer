import { useEffect, useState } from "react";
import { Icon } from "../components/Icon";
import { useUi } from "../context/UiContext";
import { useT } from "../i18n";
import {
  getAiSettings,
  getEuipoSettings,
  updateAiSettings,
  updateEuipoSettings,
  type AiProvider,
  type AiSettingsStatus,
  type EuipoSettingsStatus,
} from "../api/integrations";
import { listRequests, updateRequest } from "../api/requests";
import { generateAiOverview } from "../api/persons";
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
  const [aiGenBusy, setAiGenBusy] = useState(false);
  const [aiGenResult, setAiGenResult] = useState<string | null>(null);
  const [aiSettings, setAiSettings] = useState<AiSettingsStatus | null>(null);
  const [aiProvider, setAiProvider] = useState<AiProvider>("OLLAMA");
  const [aiOllamaUrl, setAiOllamaUrl] = useState("");
  const [aiOllamaModel, setAiOllamaModel] = useState("");
  const [aiOpenaiKey, setAiOpenaiKey] = useState("");
  const [aiOpenaiModel, setAiOpenaiModel] = useState("");
  const [aiOpenaiBaseUrl, setAiOpenaiBaseUrl] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

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

    getAiSettings().then((settings) => {
      if (!active) return;
      applyAiSettings(settings);
    });

    return () => {
      active = false;
    };
  }, []);

  function applyAiSettings(settings: AiSettingsStatus) {
    setAiSettings(settings);
    setAiProvider(settings.provider);
    setAiOllamaUrl(settings.ollama.urlSource === "database" ? settings.ollama.url ?? "" : "");
    setAiOllamaModel(settings.ollama.modelSource === "database" ? settings.ollama.model : "");
    setAiOpenaiKey("");
    setAiOpenaiModel(settings.openai.modelSource === "database" ? settings.openai.model : "");
    setAiOpenaiBaseUrl(settings.openai.baseUrlSource === "database" ? settings.openai.baseUrl : "");
  }

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

  async function saveAi() {
    setAiBusy(true);
    setAiMessage(null);
    try {
      const settings = await updateAiSettings({
        provider: aiProvider,
        ollamaUrl: aiOllamaUrl.trim() || null,
        ollamaModel: aiOllamaModel.trim() || null,
        openaiApiKey: aiOpenaiKey.trim() || undefined,
        openaiModel: aiOpenaiModel.trim() || null,
        openaiBaseUrl: aiOpenaiBaseUrl.trim() || null,
      });
      applyAiSettings(settings);
      setAiMessage(lang === "et" ? "AI seaded salvestatud." : "AI settings saved.");
    } finally {
      setAiBusy(false);
    }
  }

  async function handleGenerateAi() {
    if (!active?.personId) return;
    setAiGenBusy(true);
    setAiGenResult(null);
    try {
      const result = await generateAiOverview(active.personId);
      setAiGenResult(result.overview);
    } catch {
      setAiGenResult(lang === "et" ? "Viga AI genereerimisel." : "Error generating AI overview.");
    } finally {
      setAiGenBusy(false);
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
            <strong>{lang === "et" ? "AI teenusepakkuja" : "AI provider"}</strong>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              {lang === "et"
                ? "Vali kasutatav AI teenus ning seadista vastavad võtmed. Tühjad väljad pärinevad .env failist."
                : "Pick which AI service to use and configure its credentials. Empty fields fall back to .env."}
            </div>
          </div>
          <span
            className={
              "status " +
              ((aiProvider === "OPENAI" ? aiSettings?.openai.configured : aiSettings?.ollama.configured)
                ? "approved"
                : "pending")
            }
          >
            <span className="pulse" />{" "}
            {aiProvider === "OPENAI"
              ? aiSettings?.openai.configured
                ? lang === "et"
                  ? "OpenAI seadistatud"
                  : "OpenAI configured"
                : lang === "et"
                ? "OpenAI seadistamata"
                : "OpenAI not configured"
              : aiSettings?.ollama.configured
              ? aiSettings.ollama.online
                ? lang === "et"
                  ? "Ollama online"
                  : "Ollama online"
                : lang === "et"
                ? "Ollama offline"
                : "Ollama offline"
              : lang === "et"
              ? "Ollama seadistamata"
              : "Ollama not configured"}
          </span>
        </div>
        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <label>
            <div className="mono muted" style={{ fontSize: 10, textTransform: "uppercase", marginBottom: 5 }}>
              {lang === "et" ? "Teenusepakkuja" : "Provider"}
            </div>
            <select
              className="input"
              value={aiProvider}
              onChange={(event) => setAiProvider(event.target.value as AiProvider)}
              style={{ width: "100%" }}
            >
              <option value="OLLAMA">Ollama</option>
              <option value="OPENAI">OpenAI</option>
            </select>
          </label>

          {aiProvider === "OLLAMA" ? (
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: 10 }}>
              <label>
                <div className="mono muted" style={{ fontSize: 10, textTransform: "uppercase", marginBottom: 5 }}>
                  Ollama URL
                </div>
                <input
                  className="input"
                  value={aiOllamaUrl}
                  onChange={(event) => setAiOllamaUrl(event.target.value)}
                  placeholder={aiSettings?.ollama.url ?? "http://192.168.1.42:11434"}
                  style={{ width: "100%" }}
                />
              </label>
              <label>
                <div className="mono muted" style={{ fontSize: 10, textTransform: "uppercase", marginBottom: 5 }}>
                  {lang === "et" ? "Mudel" : "Model"}
                </div>
                <input
                  className="input"
                  value={aiOllamaModel}
                  onChange={(event) => setAiOllamaModel(event.target.value)}
                  placeholder={aiSettings?.ollama.model ?? "llama3"}
                  style={{ width: "100%" }}
                />
              </label>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <label>
                <div className="mono muted" style={{ fontSize: 10, textTransform: "uppercase", marginBottom: 5 }}>
                  API key
                </div>
                <input
                  className="input"
                  type="password"
                  value={aiOpenaiKey}
                  onChange={(event) => setAiOpenaiKey(event.target.value)}
                  placeholder={aiSettings?.openai.apiKeyPreview ?? "sk-..."}
                  style={{ width: "100%" }}
                />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr)", gap: 10 }}>
                <label>
                  <div className="mono muted" style={{ fontSize: 10, textTransform: "uppercase", marginBottom: 5 }}>
                    {lang === "et" ? "Mudel" : "Model"}
                  </div>
                  <input
                    className="input"
                    value={aiOpenaiModel}
                    onChange={(event) => setAiOpenaiModel(event.target.value)}
                    placeholder={aiSettings?.openai.model ?? "gpt-4o-mini"}
                    style={{ width: "100%" }}
                  />
                </label>
                <label>
                  <div className="mono muted" style={{ fontSize: 10, textTransform: "uppercase", marginBottom: 5 }}>
                    Base URL
                  </div>
                  <input
                    className="input"
                    value={aiOpenaiBaseUrl}
                    onChange={(event) => setAiOpenaiBaseUrl(event.target.value)}
                    placeholder={aiSettings?.openai.baseUrl ?? "https://api.openai.com/v1"}
                    style={{ width: "100%" }}
                  />
                </label>
              </div>
            </div>
          )}

          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn primary" onClick={saveAi} disabled={aiBusy}>
              <Icon name="check" size={14} /> {lang === "et" ? "Salvesta" : "Save"}
            </button>
          </div>
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
          {aiMessage ??
            (aiSettings?.source === "environment"
              ? lang === "et"
                ? "Praegu kasutatakse .env väärtuseid; salvestamine asendab need andmebaasi seadistusega."
                : "Currently using .env values; saving here switches to database settings."
              : aiSettings?.source === "none"
              ? lang === "et"
                ? "AI ei ole seadistatud — vali teenusepakkuja ja sisesta võtmed."
                : "AI is not configured yet — pick a provider and enter credentials."
              : lang === "et"
              ? "Salvestatud võtmeid hoitakse serveripoolselt; placeholder näitab viimaseid nelja märki."
              : "Saved credentials are stored server-side; the placeholder shows the last four characters.")}
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
                  <th>{lang === "et" ? "Tüüp" : "Type"}</th>
                  <th>{lang === "et" ? "Esitatud" : "Submitted"}</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => { setActiveId(r.id); setAiGenResult(null); }}
                    style={{
                      cursor: "pointer",
                      background: activeId === r.id ? "var(--bg-2)" : undefined,
                    }}
                  >
                    <td className="mono muted">{r.id.slice(0, 8)}</td>
                    <td>
                      <strong>{r.targetPersonName}</strong>
                    </td>
                    <td>
                      <span className={"chip" + (r.type === "AI_OVERVIEW" ? " active" : "")} style={{ cursor: "default" }}>
                        {r.type === "AI_OVERVIEW" ? "AI" : lang === "et" ? "Uus isik" : "New person"}
                      </span>
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
              {active.type === "AI_OVERVIEW" && active.personId && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                  <div className="mono" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ink-3)", marginBottom: 8 }}>
                    {t.ai_overview_h}
                  </div>
                  <button
                    className="btn sm primary"
                    onClick={handleGenerateAi}
                    disabled={aiGenBusy}
                    style={{ marginBottom: aiGenResult ? 10 : 0 }}
                  >
                    <Icon name="sparkles" size={12} /> {aiGenBusy ? t.admin_gen_ai_busy : t.admin_gen_ai}
                  </button>
                  {aiGenResult && (
                    <p style={{ fontSize: 13, marginTop: 8, whiteSpace: "pre-line", color: "var(--ink-2)" }}>
                      {aiGenResult}
                    </p>
                  )}
                </div>
              )}
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
