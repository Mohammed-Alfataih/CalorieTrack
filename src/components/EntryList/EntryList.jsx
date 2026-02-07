import translations from "../../constants/translations";
import { getEntryName } from "../../utils/helpers";
import "./EntryList.css";

/**
 * Displays all saved food entries, or an empty state when there are none.
 * Entry names switch language instantly when `lang` changes.
 *
 * @param {{
 *   lang: "en"|"ar",
 *   entries: Array<{ id: number, nameEn: string, nameAr: string, calories: number, time: string }>,
 *   onDelete: (id: number) => void,
 * }} props
 */
export default function EntryList({ lang, entries, onDelete }) {
  const t = translations[lang];

  /* ── Empty state ────────────────────────────────────────────────────── */
  if (entries.length === 0) {
    return (
      <div className="entry-list-section">
        <div className="entry-list__empty">
          <div className="entry-list__empty-icon">🔥</div>
          <p className="entry-list__empty-title">{t.noEntries}</p>
          <p className="entry-list__empty-hint">{t.noEntriesHint}</p>
        </div>
      </div>
    );
  }

  /* ── Entry cards ────────────────────────────────────────────────────── */
  return (
    <div className="entry-list-section">
      <div className="entry-list">
        {entries.map((entry, i) => (
          <div
            key={entry.id}
            className="entry-card"
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            {/* info */}
            <div className="entry-card__info">
              <div className="entry-card__name">{getEntryName(entry, lang)}</div>
              <div className="entry-card__time">{entry.time}</div>
            </div>

            {/* calories */}
            <div className="entry-card__calories">
              {entry.calories}{" "}
              <span className="entry-card__calories-unit">{t.cal}</span>
            </div>

            {/* delete */}
            <button
              className="entry-card__delete"
              onClick={() => onDelete(entry.id)}
              title={t.delete}
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
