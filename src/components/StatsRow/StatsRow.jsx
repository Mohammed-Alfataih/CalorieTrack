import translations from "../../constants/translations";
import "./StatsRow.css";

/**
 * Three-card row showing Goal, Eaten, and Remaining calories.
 *
 * @param {{
 *   lang: "en"|"ar",
 *   goal: number,
 *   totalEaten: number,
 *   remaining: number,
 *   overGoal: boolean,
 * }} props
 */
export default function StatsRow({ lang, goal, totalEaten, remaining, overGoal }) {
  const t = translations[lang];

  const cards = [
    { label: t.goal,  value: goal,        icon: "🎯", accent: "#ff6b35" },
    { label: t.eaten, value: totalEaten,  icon: "🔥", accent: "#ffb627" },
    {
      label: t.left,
      value: remaining,
      icon: overGoal ? "⚠️" : "✨",
      accent: overGoal ? "#ff4444" : "#00d9a5",
    },
  ];

  return (
    <div className="stats-row">
      {cards.map((card, i) => (
        <div key={i} className="stat-card">
          <div className="stat-card__icon">{card.icon}</div>
          <div className="stat-card__label">{card.label}</div>
          <div className="stat-card__value" style={{ color: card.accent }}>
            {card.value}
          </div>
          <div className="stat-card__unit">{t.cal}</div>
        </div>
      ))}
    </div>
  );
}
