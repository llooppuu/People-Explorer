import { useNavigate } from "react-router-dom";
import type { Person } from "../types";
import { Icon, initials } from "./Icon";
import { useUi } from "../context/UiContext";
import { useT } from "../i18n";

interface Props {
  person: Person;
  watching?: boolean;
  onToggleWatch?: (id: string) => void;
}

export function PersonCard({ person, watching, onToggleWatch }: Props) {
  const { lang } = useUi();
  const t = useT(lang);
  const navigate = useNavigate();

  const catClass =
    person.category === "Poliitika" || person.category === "Politics"
      ? "politics"
      : person.category === "Kultuur" || person.category === "Culture"
      ? "culture"
      : "";

  const refs = person.references?.length ?? 0;

  return (
    <div className="person-card" onClick={() => navigate(`/persons/${person.id}`)}>
      <div className="top">
        <div className="pavatar">{initials(person.fullName)}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="name">{person.fullName}</div>
          <div className="role">{person.role}</div>
        </div>
        {onToggleWatch && (
          <button
            className="icon-btn"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWatch(person.id);
            }}
            title={watching ? t.profile_remwatch : t.profile_addwatch}
            style={watching ? { color: "var(--accent)", borderColor: "var(--accent)" } : {}}
          >
            <Icon name="bookmark" size={14} />
          </button>
        )}
      </div>
      <div className="meta-row">
        <span className={"cat-tag " + catClass}>{person.category}</span>
        <span className="dot">·</span>
        <span>
          {refs} {t.refs_short}
        </span>
      </div>
    </div>
  );
}
