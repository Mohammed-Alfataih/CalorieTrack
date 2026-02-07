import translations from "../../constants/translations";
import "./ProgressBar.css";

/**
 * Animated daily-progress bar.  Turns red and shows "Over goal!" when exceeded.
 *
 * @param {{
 *   lang: "en"|"ar",
 *   percent: number,   // 0–100 (clamped by parent)
 *   overGoal: boolean,
 * }} props
 */
export default function ProgressBar({ lang, percent, overGoal }) {
  const t = translations[lang];

  return (
    <div className="progress-bar-section">
      <div className="progress-bar__header">
        <span className="progress-bar__label">{t.progress}</span>
        <span className={`progress-bar__percent ${overGoal ? "progress-bar__percent--over" : ""}`}>
          {overGoal ? t.overGoal : `${Math.round(percent)}%`}
        </span>
      </div>

      <div className="progress-bar__track">
        <div
          className={`progress-bar__fill ${overGoal ? "progress-bar__fill--over" : ""}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
