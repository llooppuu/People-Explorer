import { useUi } from "../context/UiContext";
import { useT } from "../i18n";

interface Source {
  name: string;
  type: "API" | "RSS" | "MANUAL";
  desc: string;
  descEn: string;
}

const SOURCES: Source[] = [
  {
    name: "Äriregister",
    type: "API",
    desc: "Juhatuse liikmed, omanikud",
    descEn: "Board members, owners",
  },
  {
    name: "Riigikogu API",
    type: "API",
    desc: "Liikmed, hääletused, kõned",
    descEn: "Members, votes, speeches",
  },
  {
    name: "Riigi Teataja",
    type: "API",
    desc: "Õigusaktid, kohtulahendid",
    descEn: "Legal acts, court decisions",
  },
  {
    name: "Wikipedia / Wikidata",
    type: "API",
    desc: "Biograafiad, metaandmed",
    descEn: "Biographies, metadata",
  },
];

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
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {SOURCES.map((s) => (
            <tr key={s.name}>
              <td>
                <strong>{s.name}</strong>
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
                <span className="status approved">
                  <span className="pulse" /> online
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
