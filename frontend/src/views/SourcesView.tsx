import { useUi } from "../context/UiContext";
import { useT } from "../i18n";

type SourceState = "active" | "limited" | "stub";

interface Source {
  name: string;
  type: "API" | "RSS" | "MANUAL";
  desc: string;
  descEn: string;
  state: SourceState;
  note?: string;
  noteEn?: string;
}

const SOURCES: Source[] = [
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
};

export function SourcesView() {
  const { lang } = useUi();
  const t = useT(lang);

  return (
    <div className="page">
      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <h2>{t.sources_h}</h2>
          <div className="sub" style={{ marginTop: 4 }}>
            {SOURCES.length} · {t.sources_sub}
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
          {SOURCES.map((s) => {
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
          ? "Seis kajastab kliendi-koodi ja võtmete saadavust, mitte reaalajas pingitavat ühendust."
          : "State reflects client-code coverage and credentials, not a live ping."}
      </div>
    </div>
  );
}
