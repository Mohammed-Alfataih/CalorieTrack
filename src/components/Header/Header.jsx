import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getUserCredits } from "../../utils/api";
import translations from "../../constants/translations";
import "./Header.css";

const LANGUAGES = ["en", "ar"];
const LANG_LABELS = { en: "EN", ar: "العربية" };

/**
 * Top bar: branding, user info, credits, language toggle + logout
 */
export default function Header({ lang, onLangChange, onReset }) {
  const t = translations[lang];
  const { user, logout } = useAuth();
  const [credits, setCredits] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch user credits on mount
  useEffect(() => {
    loadCredits();
  }, []);

  async function loadCredits() {
    const data = await getUserCredits();
    setCredits(data);
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="header">
      {/* title */}
      <div>
        <div className="header__logo-row">
          <span className="header__icon">🔥</span>
          <h1 className="header__title">{t.title}</h1>
        </div>
        <p className="header__subtitle">{t.subtitle}</p>
      </div>

      {/* controls */}
      <div className="header__controls">
        {/* AI Credits Badge */}
        {credits && (
          <div className="header__credits" title={`You have ${credits.remaining} AI calls remaining today (${credits.used}/${credits.limit} used)`}>
            🤖 {credits.remaining} left
          </div>
        )}

        {/* Language Toggle */}
        {LANGUAGES.map((l) => (
          <button
            key={l}
            className={`header__lang-btn ${lang === l ? "header__lang-btn--active" : ""}`}
            onClick={() => onLangChange(l)}
          >
            {LANG_LABELS[l]}
          </button>
        ))}

        {/* User Profile Dropdown */}
        <div className="header__user-menu">
          <button
            className="header__user-btn"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="header__user-avatar" />
            ) : (
              <div className="header__user-avatar-placeholder">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </div>
            )}
          </button>

          {showDropdown && (
            <div className="header__dropdown">
              <div className="header__dropdown-user">
                <div className="header__dropdown-name">{user?.displayName || "User"}</div>
                <div className="header__dropdown-email">{user?.email}</div>
              </div>
              <div className="header__dropdown-divider" />
              <button className="header__dropdown-item" onClick={onReset}>
                ⚙️ Reset Data
              </button>
              <button className="header__dropdown-item header__dropdown-item--danger" onClick={handleLogout}>
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
