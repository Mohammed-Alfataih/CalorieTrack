import { useState } from "react";
import translations from "../../constants/translations";
import "./GoalModal.css";

/**
 * Shown on first launch (or after a reset) so the user can pick a daily calorie goal.
 *
 * @param {{ lang: "en"|"ar", onSave: (goal: number) => void }} props
 */
export default function GoalModal({ lang, onSave }) {
  const [value, setValue] = useState("");
  const t = translations[lang];

  const handleSubmit = () => {
    const num = parseInt(value, 10);
    if (num >= 500 && num <= 10000) onSave(num);
  };

  return (
    <div className="goal-modal-overlay">
      <div className="goal-modal-card">
        <div className="goal-modal-icon">🔥</div>
        <h2 className="goal-modal-title">{t.setGoalTitle}</h2>
        <p className="goal-modal-hint">{t.setGoalHint}</p>

        <input
          className="goal-modal-input"
          autoFocus
          type="number"
          min={500}
          max={10000}
          placeholder="2000"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />

        <button className="goal-modal-btn" onClick={handleSubmit}>
          {t.startTracking}
        </button>
      </div>
    </div>
  );
}
