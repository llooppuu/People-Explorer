import { useEffect, useState } from "react";
import { useUi } from "../context/UiContext";
import { useT } from "../i18n";
import { getOllamaStatus, type OllamaStatus } from "../api/health";

type SourceState = "active" | "limited" | "stub" | "online" | "offline";

interface Source {
  name: string;
  type: "API" | "RSS" | "MANUAL" | "LLM";
  desc: string;
  descEn: string;
  state: SourceState;
  note?: string;
  noteEn?: string;
}

const STATIC_SOURCES: Source[] = [
  {
    name: "Wikidata",
    type: "API",
    desc: "Biograafiad, metaandmed",
    descEn: "Biographies, metadata",
    state: "active",
  },
  {
    name: "Riigikogu API",
    type: "API",
    desc: "Liikmed, hääletused, kõned",
    descEn: "Members, votes, speeches",
    state: "active",
  },
  {
    name: "Riigi Teataja",
    type: "API",
    desc: "Õigusaktid, kohtulahendid",
    descEn: "Legal acts, court decisions",
    state: "active",
  },
  {
    name: "Äriregister",
    type: "API",
    desc: "Juhatuse liikmed, omanikud",
    descEn: "Board members, owners",
    state: "limited",
    note: "Vajab API-lepingut RIK-iga; praegu päring ei tagasta kandidaate.",
    noteEn: "Requires a contract with RIK; currently returns no candidates.",
  },
  {
    name: "EUIPO Persons",
    type: "API",
    desc: "Kaubamärgi ja disaini taotlejad ning esindajad",
    descEn: "Trademark and design applicants and representatives",
    state: "limited",
    note: "Vajab EUIPO klient-ID ja OAuth2 võtmeid.",
    noteEn: "Requires EUIPO client ID and OAuth2 credentials.",
  },
];

const STATE_LABELS: Record<SourceState, { et: string; en: string; cls: string }> = {
  active: { et: "aktiivne", en: "active", cls: "approved" },
  limited: { et: "piiratud", en: "limited", cls: "pending" },
  stub: { et: "väljatöötamisel", en: "stub", cls: "pending" },
  online: { et: "online", en: "online", cls: "approved" },
  offline: { et: "offline", en: "offline", cls: "rejected" },
};

function ollamaSource(status: OllamaStatus | null, loading: boolean): Source {
  if (loading || !status) {
    return {
      name: "Ollama",
      type: "LLM",
      desc: "Kohalik LLM AI-ülevaadete ja veebipäringu kokkuvõtete jaoks",
      descEn: "Local LLM for AI overviews and web search summaries",
      state: "stub",
      note: "Olekut kontrollitakse…",
      noteEn: "Checking status…",
    };
  }

  if (!status.configured) {
    return {
      name: "Ollama",
      type: "LLM",
      desc: "Kohalik LLM AI-ülevaadete ja veebipäringu kokkuvõtete jaoks",
      descEn: "Local LLM for AI overviews and web search summaries",
      state: "limited",
      note: `OLLAMA_URL puudub. Mudel: ${status.model}.`,
      noteEn: `OLLAMA_URL not set. Model: ${status.model}.`,
    };
  }

  const note = status.url ? `${status.url} · ${status.model}` : status.model;
  return {
    name: "Ollama",
    type: "LLM",
    desc: "Kohalik LLM AI-ülevaadete ja veebipäringu kokkuvõtete jaoks",
    descEn: "Local LLM for AI overviews and web search summaries",
    state: status.online ? "online" : "offline",
    note,
    noteEn: note,
  };
}

export function SourcesView() {
  const { lang } = useUi();
  const t = useT(lang);
  const [ollama, setOllama] = useState<OllamaStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getOllamaStatus()
      .then((status) => {
        if (active) setOllama(status);
      })
      .catch(() => {
        if (active) setOllama({ configured: false, online: false, model: "" });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const sources = [...STATIC_SOURCES, ollamaSource(ollama, loading)];

  return (
    <div className="page">
      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <h2>{t.sources_h}</h2>
          <div className="sub" style={{ marginTop: 4 }}>
            {sources.length} · {t.sources_sub}
          </div>
        </div>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>{lang === "et" ? "Allikas" : "Source"}</th>
            <th>{lang === "et" ? "Tüüp" : "Type"}</th>
            <th>{lang === "et" ? "Kirjeldus" : "Description"}</th>
            <th>{lang === "et" ? "Seis" : "State"}</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s) => {
            const stateMeta = STATE_LABELS[s.state];
            const note = lang === "et" ? s.note : s.noteEn;
            return (
              <tr key={s.name}>
                <td>
                  <strong>{s.name}</strong>
                  {note && (
                    <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>
                      {note}
                    </div>
                  )}
                </td>
                <td>
                  <span
                    className="ref-type api"
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      padding: "2px 6px",
                      border: "1px solid var(--line-2)",
                      borderRadius: 3,
                    }}
                  >
                    {s.type}
                  </span>
                </td>
                <td className="muted">{lang === "et" ? s.desc : s.descEn}</td>
                <td>
                  <span className={"status " + stateMeta.cls}>
                    <span className="pulse" /> {lang === "et" ? stateMeta.et : stateMeta.en}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="muted" style={{ fontSize: 12, marginTop: 12, lineHeight: 1.5 }}>
        {lang === "et"
          ? "Avalikud allikad: seis kajastab kliendi-koodi ja võtmete saadavust. Ollama seis kajastab live ühenduse kontrolli."
          : "Public sources: state reflects client code and credentials. Ollama state reflects a live connectivity check."}
      </div>
    </div>
  );
}
