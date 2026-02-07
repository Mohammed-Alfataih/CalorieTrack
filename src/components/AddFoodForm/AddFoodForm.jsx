import { useRef } from "react";
import translations from "../../constants/translations";
import "./AddFoodForm.css";

/**
 * The main food-entry form.
 *
 * All state lives in App — this component is purely presentational + event routing.
 *
 * @param {{
 *   lang: "en"|"ar",
 *   foodName: string,
 *   calories: string,
 *   previewUrl: string | null,
 *   scanning: boolean,
 *   estimating: boolean,
 *   onFoodNameChange: (value: string) => void,
 *   onCaloriesChange: (value: string) => void,
 *   onEstimate: () => void,       // 🤖 AI button
 *   onPhotoSelect: (file: File) => void,
 *   onAdd: () => void,            // ➕ Add Entry
 * }} props
 */
export default function AddFoodForm({
  lang,
  foodName,
  calories,
  previewUrl,
  scanning,
  estimating,
  onFoodNameChange,
  onCaloriesChange,
  onEstimate,
  onPhotoSelect,
  onAdd,
}) {
  const fileRef = useRef(null);
  const t = translations[lang];
  const canSubmit = foodName.trim().length > 0 && !scanning && !estimating;

  /* file input change → hand the File object up */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onPhotoSelect(file);
  };

  return (
    <div className="add-food">
      <h2 className="add-food__title">{t.addFood}</h2>

      {/* ── Food Name ──────────────────────────────────────────────────── */}
      <label className="add-food__label">{t.foodName}</label>
      <input
        className="add-food__input"
        type="text"
        placeholder={t.foodPlaceholder}
        value={foodName}
        onChange={(e) => onFoodNameChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onAdd()}
      />

      {/* ── Calories + AI Estimate Button ──────────────────────────────── */}
      <div className="add-food__calories-row">
        <div className="add-food__input-wrap">
          <label className="add-food__label">{t.calories}</label>
          <input
            className="add-food__input"
            type="number"
            placeholder={t.calPlaceholder}
            value={calories}
            onChange={(e) => onCaloriesChange(e.target.value)}
          />
        </div>

        <button
          className="add-food__ai-btn"
          disabled={estimating || !foodName.trim()}
          onClick={onEstimate}
        >
          {estimating ? "⏳…" : "🤖 AI"}
        </button>
      </div>

      {/* ── Divider ────────────────────────────────────────────────────── */}
      <div className="add-food__divider">
        <div className="add-food__divider-line" />
        <span className="add-food__divider-text">{t.orScan}</span>
        <div className="add-food__divider-line" />
      </div>

      {/* ── Photo Upload / Preview ─────────────────────────────────────── */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <div
        className={`add-food__photo-zone ${previewUrl ? "add-food__photo-zone--preview" : ""}`}
        onClick={() => fileRef.current?.click()}
      >
        {previewUrl ? (
          <div className="add-food__preview-wrap">
            <img className="add-food__preview-img" src={previewUrl} alt="meal" />
            <div className="add-food__preview-overlay">
              <span>🔄 {t.tapChange}</span>
            </div>
          </div>
        ) : (
          <>
            <div className="add-food__photo-icon">📸</div>
            <div className="add-food__photo-label">{t.scanPhoto}</div>
            <div className="add-food__photo-hint">{t.scanHint}</div>
          </>
        )}
      </div>

      {/* ── Scanning Indicator ─────────────────────────────────────────── */}
      {scanning && (
        <div className="add-food__scanning">
          <div className="add-food__spinner" />
          <span className="add-food__scanning-text">{t.analyzing}</span>
        </div>
      )}

      {/* ── Add Button ─────────────────────────────────────────────────── */}
      <button className="add-food__btn" disabled={!canSubmit} onClick={onAdd}>
        {estimating ? "⏳ …" : `➕ ${t.addEntry}`}
      </button>
    </div>
  );
}
