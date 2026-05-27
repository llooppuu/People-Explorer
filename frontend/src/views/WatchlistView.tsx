import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, initials } from "../components/Icon";
import { useUi } from "../context/UiContext";
import { useT } from "../i18n";
import { listWatchlist, removeFromWatchlist } from "../api/watchlist";
import type { WatchlistItem } from "../types";

export function WatchlistView() {
  const { lang } = useUi();
  const t = useT(lang);
  const navigate = useNavigate();

  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listWatchlist()
      .then((data) => {
        if (active) setItems(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function remove(id: string) {
    await removeFromWatchlist(id);
    setItems((list) => list.filter((w) => w.id !== id));
  }

  return (
    <div className="page">
      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <h2>{t.watchlist_h}</h2>
          <div className="sub" style={{ marginTop: 4 }}>
            {items.length} · {t.watchlist_sub}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="empty">{t.loading}</div>
      ) : items.length === 0 ? (
        <div className="empty">
          <Icon name="bookmark" size={20} />
          <div style={{ marginTop: 8 }}>
            {lang === "et"
              ? "Sinu watchlist on tühi. Lisa isikuid profiilist."
              : "Your watchlist is empty. Add people from any profile."}
          </div>
          <button className="btn" style={{ marginTop: 16 }} onClick={() => navigate("/persons")}>
            {lang === "et" ? "Sirvi isikuid" : "Browse people"}
          </button>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>{lang === "et" ? "Nimi" : "Name"}</th>
              <th>{t.role_label}</th>
              <th>{t.watchlist_note}</th>
              <th>{lang === "et" ? "Lisatud" : "Added"}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((w) => (
              <tr
                key={w.id}
                onClick={() => w.person && navigate(`/persons/${w.person.id}`)}
                style={{ cursor: "pointer" }}
              >
                <td>
                  <div className="pavatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                    {initials(w.person?.fullName ?? "?")}
                  </div>
                </td>
                <td>
                  <strong>{w.person?.fullName ?? w.personId}</strong>
                </td>
                <td className="muted">{w.person?.role ?? ""}</td>
                <td className="muted" style={{ fontStyle: "italic" }}>
                  {w.note ?? ""}
                </td>
                <td className="mono muted">
                  {new Date(w.createdAt).toISOString().slice(0, 10)}
                </td>
                <td>
                  <button
                    className="btn sm danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(w.id);
                    }}
                  >
                    <Icon name="x" size={12} /> {lang === "et" ? "Eemalda" : "Remove"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
