import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUi } from "../context/UiContext";
import { useT } from "../i18n";
import { useAuth } from "../context/AuthContext";
import { addTagToPerson, getPerson } from "../api/persons";
import { addToWatchlist, listWatchlist, removeFromWatchlist } from "../api/watchlist";
import type { Person, WatchlistItem } from "../types";
import { Icon, initials } from "../components/Icon";

export function ProfileView() {
  const { id } = useParams<{ id: string }>();
  const { lang } = useUi();
  const t = useT(lang);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [person, setPerson] = useState<Person | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [tagError, setTagError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setError(null);
    getPerson(id)
      .then((p) => {
        if (active) setPerson(p);
      })
      .catch(() => {
        if (active) setError(t.error_generic);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, t.error_generic]);

  useEffect(() => {
    if (!isAuthenticated) return setWatchlist([]);
    listWatchlist().then(setWatchlist).catch(() => setWatchlist([]));
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="page">
        <div className="empty">{t.loading}</div>
      </div>
    );
  }
  if (error || !person) {
    return (
      <div className="page">
        <div className="empty">{error ?? t.no_results}</div>
      </div>
    );
  }

  const watchEntry = watchlist.find((w) => w.personId === person.id);
  const watching = !!watchEntry;

  async function toggleWatch() {
    if (!isAuthenticated) return navigate("/login");
    if (watchEntry) {
      await removeFromWatchlist(watchEntry.id);
      setWatchlist((list) => list.filter((w) => w.id !== watchEntry.id));
    } else {
      const created = await addToWatchlist(person!.id);
      setWatchlist((list) => [...list, created]);
    }
  }

  async function submitTag(e: FormEvent) {
    e.preventDefault();
    if (!newTag.trim() || !person) return;
    setTagError(null);
    try {
      await addTagToPerson(person.id, newTag.trim().toLowerCase());
      const fresh = await getPerson(person.id);
      setPerson(fresh);
      setNewTag("");
    } catch {
      setTagError(t.error_generic);
    }
  }

  const catClass =
    person.category === "Poliitika"
      ? "politics"
      : person.category === "Kultuur"
      ? "culture"
      : "";
  const localized = person.localizedProfile?.[lang];
  const displayRole = localized?.role || person.role;
  const displayBiography = localized?.biography || person.biography;

  return (
    <div className="page">
      <div className="profile-head">
        <div className="profile-avatar">{initials(person.fullName)}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1>{person.fullName}</h1>
          <div className="sub">{displayRole}</div>
          <div className="meta">
            <span>
              <span className={"cat-tag " + catClass} style={{ marginRight: 6 }}>
                {person.category}
              </span>
            </span>
            <span>· {t.last_sync} {new Date(person.createdAt).toISOString().slice(0, 10)}</span>
            {person.isPublic && (
              <span>
                ·{" "}
                <span className="status approved">
                  <span className="pulse" /> {t.public}
                </span>
              </span>
            )}
          </div>
        </div>
        <div className="profile-actions">
          <button
            className="btn"
            onClick={toggleWatch}
            style={watching ? { color: "var(--accent)", borderColor: "var(--accent)" } : {}}
          >
            <Icon name="bookmark" size={14} /> {watching ? t.profile_remwatch : t.profile_addwatch}
          </button>
        </div>
      </div>

      <div className="profile-grid">
        <div>
          <h3 style={{ fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-3)", margin: "0 0 12px 0" }}>
            {t.profile_bio}
          </h3>
          {displayBiography ? (
            <p className="bio">{displayBiography}</p>
          ) : (
            <p className="muted">{lang === "et" ? "Biograafia puudub." : "No biography available."}</p>
          )}
          {person.profileSections && person.profileSections.length > 0 && (
            <div className="profile-sections" aria-label={lang === "et" ? "Profiili jaotised" : "Profile sections"}>
              {person.profileSections.map((section) => (
                <details key={`${section.sourceName}-${section.id}`} className="profile-section">
                  <summary>
                    <span>{section.title}</span>
                    <span className="section-source">{section.sourceName}</span>
                  </summary>
                  {section.items && section.items.length > 0 && (
                    <dl>
                      {section.items.map((item) => (
                        <div key={`${item.label}-${item.value}`}>
                          <dt>{item.label}</dt>
                          <dd>{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  {section.text && <p>{section.text}</p>}
                </details>
              ))}
            </div>
          )}

          <div className="aside-card" style={{ marginTop: 24 }}>
            <h3>{t.profile_tags}</h3>
            <div className="row" style={{ flexWrap: "wrap", marginBottom: 10 }}>
              {person.tags && person.tags.length > 0 ? (
                person.tags.map((pt) => (
                  <span key={pt.tag.id} className="chip" style={{ cursor: "default" }}>
                    #{pt.tag.name}
                  </span>
                ))
              ) : (
                <span className="muted" style={{ fontSize: 12 }}>
                  {lang === "et" ? "Silte pole" : "No tags"}
                </span>
              )}
            </div>
            {isAuthenticated && (
              <form onSubmit={submitTag} className="row" style={{ gap: 6 }}>
                <input
                  className="input"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder={t.profile_add_tag}
                  style={{ flex: 1 }}
                />
                <button className="btn sm primary" type="submit" disabled={!newTag.trim()}>
                  <Icon name="plus" size={12} /> {t.profile_add_tag}
                </button>
              </form>
            )}
            {tagError && (
              <div className="muted" style={{ color: "var(--danger)", fontSize: 12, marginTop: 6 }}>
                {tagError}
              </div>
            )}
          </div>
        </div>

        <aside>
          <div className="aside-card">
            <h3>
              {t.profile_refs} · {person.references?.length ?? 0}
            </h3>
            {person.references && person.references.length > 0 ? (
              person.references.map((r) => (
                <div key={r.id} className="ref-item">
                  <span
                    className={"ref-type " + (r.dataSource?.sourceType === "API" ? "api" : "")}
                  >
                    {r.dataSource?.sourceType ?? "-"}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{r.dataSource?.name ?? "Allikas"}</div>
                    <a
                      className="ref-meta"
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ textDecoration: "underline" }}
                    >
                      {r.url}
                    </a>
                    <div className="ref-meta" style={{ color: "var(--ink-4)" }}>
                      {t.last_sync} {new Date(r.fetchedAt).toISOString().slice(0, 10)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <span className="muted" style={{ fontSize: 12 }}>
                {lang === "et" ? "Allikaviiteid pole" : "No references"}
              </span>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
