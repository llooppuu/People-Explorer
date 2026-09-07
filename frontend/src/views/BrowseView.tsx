import { useEffect, useMemo, useState } from "react";
import { Icon, initials } from "../components/Icon";
import { PersonCard } from "../components/PersonCard";
import { useUi } from "../context/UiContext";
import { useT } from "../i18n";
import { listPersons } from "../api/persons";
import { addToWatchlist, listWatchlist, removeFromWatchlist } from "../api/watchlist";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import type { Person, WatchlistItem } from "../types";

type Sort = "recent" | "az" | "refs";

export function BrowseView() {
  const { lang } = useUi();
  const t = useT(lang);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [people, setPeople] = useState<Person[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => {
    let active = true;
    setLoading(true);
    listPersons({ limit: 100 })
      .then((data) => {
        if (active) setPeople(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return setWatchlist([]);
    listWatchlist().then(setWatchlist).catch(() => setWatchlist([]));
  }, [isAuthenticated]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    people.forEach((p) => counts.set(p.category, (counts.get(p.category) ?? 0) + 1));
    return [
      { key: "all", label: lang === "et" ? "Kõik" : "All", count: people.length },
      ...Array.from(counts.entries()).map(([key, count]) => ({ key, label: key, count })),
    ];
  }, [people, lang]);

  const filtered = useMemo(() => {
    let list = people.slice();
    if (cat !== "all") list = list.filter((p) => p.category === cat);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) => p.fullName.toLowerCase().includes(q) || p.role.toLowerCase().includes(q)
      );
    }
    if (sort === "az") list.sort((a, b) => a.fullName.localeCompare(b.fullName));
    if (sort === "refs")
      list.sort((a, b) => (b.references?.length ?? 0) - (a.references?.length ?? 0));
    return list;
  }, [people, cat, sort, query]);

  const watchingIds = new Set(watchlist.map((w) => w.personId));

  async function toggleWatch(personId: string) {
    if (!isAuthenticated) return navigate("/login");
    const existing = watchlist.find((w) => w.personId === personId);
    if (existing) {
      await removeFromWatchlist(existing.id);
      setWatchlist((list) => list.filter((w) => w.id !== existing.id));
    } else {
      const created = await addToWatchlist(personId);
      setWatchlist((list) => [...list, created]);
    }
  }

  return (
    <div className="page">
      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <h2>{t.browse_h}</h2>
          <div className="sub" style={{ marginTop: 4 }}>
            {filtered.length} / {people.length} · {t.browse_sub}
          </div>
        </div>
        <div className="row">
          <div className="search-input" style={{ height: 32, padding: "0 10px", maxWidth: 240 }}>
            <Icon name="search" size={14} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search_ph}
              style={{ fontSize: 13 }}
            />
          </div>
        </div>
      </div>

      <div className="toolbar">
        <span className="mono muted">{t.filter_cat}:</span>
        <div className="filter-group">
          {categories.map((c) => (
            <button
              key={c.key}
              className={"chip" + (cat === c.key ? " active" : "")}
              onClick={() => setCat(c.key)}
              style={{ cursor: "pointer", border: 0 }}
            >
              {c.label}
              <span style={{ opacity: 0.6 }}>· {c.count}</span>
            </button>
          ))}
        </div>
        <span className="spacer" />
        <span className="mono muted">{t.filter_sort}:</span>
        <select
          className="input"
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
        >
          <option value="recent">{t.sort_recent}</option>
          <option value="az">{t.sort_az}</option>
          <option value="refs">{lang === "et" ? "Kõige rohkem allikaid" : "Most sources"}</option>
        </select>
        <div
          className="row"
          style={{ border: "1px solid var(--line-2)", borderRadius: 5, overflow: "hidden" }}
        >
          <button
            className="icon-btn"
            style={{
              border: 0,
              borderRadius: 0,
              background: view === "grid" ? "var(--bg-3)" : "transparent",
            }}
            onClick={() => setView("grid")}
          >
            <Icon name="grid" size={14} />
          </button>
          <button
            className="icon-btn"
            style={{
              border: 0,
              borderRadius: 0,
              background: view === "list" ? "var(--bg-3)" : "transparent",
            }}
            onClick={() => setView("list")}
          >
            <Icon name="chev" size={14} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty">{t.loading}</div>
      ) : filtered.length === 0 ? (
        <div className="empty">{t.no_results}</div>
      ) : view === "grid" ? (
        <div className="people-grid">
          {filtered.map((p) => (
            <PersonCard
              key={p.id}
              person={p}
              watching={watchingIds.has(p.id)}
              onToggleWatch={isAuthenticated ? toggleWatch : undefined}
            />
          ))}
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 36 }}></th>
              <th>{lang === "et" ? "Nimi" : "Name"}</th>
              <th>{t.role_label}</th>
              <th>{t.cat_label}</th>
              <th>{t.sources_count}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.id}
                onClick={() => navigate(`/persons/${p.id}`)}
                style={{ cursor: "pointer" }}
              >
                <td>
                  <div className="pavatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                    {initials(p.fullName)}
                  </div>
                </td>
                <td>
                  <strong>{p.fullName}</strong>
                </td>
                <td className="muted">{p.role}</td>
                <td>
                  <span
                    className={
                      "cat-tag " +
                      (p.category === "Poliitika" ? "politics" : p.category === "Kultuur" ? "culture" : "")
                    }
                  >
                    {p.category}
                  </span>
                </td>
                <td className="mono">{p.references?.length ?? 0}</td>
                <td>
                  <Icon name="chev" size={14} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
