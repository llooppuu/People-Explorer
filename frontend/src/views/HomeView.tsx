import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../components/Icon";
import { PersonCard } from "../components/PersonCard";
import { useUi } from "../context/UiContext";
import { useT } from "../i18n";
import { listPersons } from "../api/persons";
import { addToWatchlist, listWatchlist, removeFromWatchlist } from "../api/watchlist";
import { useAuth } from "../context/AuthContext";
import type { Person, WatchlistItem } from "../types";

export function HomeView() {
  const { lang } = useUi();
  const t = useT(lang);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [people, setPeople] = useState<Person[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listPersons({ limit: 20 })
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
    if (!isAuthenticated) {
      setWatchlist([]);
      return;
    }
    listWatchlist().then(setWatchlist).catch(() => setWatchlist([]));
  }, [isAuthenticated]);

  const filtered = useMemo(() => {
    if (!query.trim()) return people.slice(0, 8);
    const q = query.toLowerCase();
    return people.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [people, query]);

  const watchingIds = new Set(watchlist.map((w) => w.personId));

  async function toggleWatch(personId: string) {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
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
    <>
      <div className="hero">
        <div className="hero-eyebrow">
          {t.hero_eyebrow} · v0.4 · {lang === "et" ? "avalik beeta" : "public beta"}
        </div>
        <h1>
          {t.hero_h1_a}{" "}
          <em>{lang === "et" ? "Eesti avalikke isikuid" : "Estonian public figures"}</em>{" "}
          {t.hero_h1_em}.
        </h1>
        <div className="hero-lede">{t.hero_lede}</div>
        <div className="search-row">
          <div className="search-input">
            <Icon name="search" size={18} />
            <input
              placeholder={t.search_ph}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button className="btn primary" onClick={() => navigate("/persons")}>
            {lang === "et" ? "Sirvi kõiki" : "Browse all"}
          </button>
        </div>
      </div>

      <div className="page">
        <div className="section-head">
          <div>
            <h2>
              {query
                ? lang === "et"
                  ? `Tulemused: "${query}"`
                  : `Results: "${query}"`
                : t.suggested}
            </h2>
            <div className="sub" style={{ marginTop: 4 }}>
              {query
                ? `${filtered.length} ${lang === "et" ? "vastet" : "matches"}`
                : t.suggested_sub}
            </div>
          </div>
          <button className="btn ghost" onClick={() => navigate("/persons")}>
            {lang === "et" ? "Kõik isikud" : "All people"} <Icon name="arrow" size={14} />
          </button>
        </div>

        {loading ? (
          <div className="empty">{t.loading}</div>
        ) : filtered.length === 0 ? (
          <div className="empty">{t.no_results}</div>
        ) : (
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
        )}
      </div>
    </>
  );
}
