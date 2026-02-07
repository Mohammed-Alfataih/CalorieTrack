import { useState, useEffect, useCallback } from "react";

// ── auth ──────────────────────────────────────────────────────────────────────
import { useAuth } from "./contexts/AuthContext";
import Login from "./components/Login/Login";

// ── data & utilities ──────────────────────────────────────────────────────────
import translations from "./constants/translations";
import { callClaude, fileToBase64, buildScanPrompt, buildEstimatePrompt } from "./utils/api";
import { getEntryName } from "./utils/helpers";
import useUserStorage from "./hooks/useUserStorage"; // User-specific storage

// ── components ────────────────────────────────────────────────────────────────
import Toast from "./components/Toast/Toast";
import GoalModal from "./components/GoalModal/GoalModal";
import Header from "./components/Header/Header";
import StatsRow from "./components/StatsRow/StatsRow";
import ProgressBar from "./components/ProgressBar/ProgressBar";
import AddFoodForm from "./components/AddFoodForm/AddFoodForm";
import EntryList from "./components/EntryList/EntryList";

export default function App() {
  const { user } = useAuth();

  // Show login page if not authenticated
  if (!user) {
    return <Login />;
  }

  return <MainApp />;
}

function MainApp() {
  /* ── persisted state (user-specific) ───────────────────────────────────── */
  const [lang, setLang] = useUserStorage("ct_lang", "en");
  const [goal, setGoal] = useUserStorage("ct_goal", null);
  const [entries, setEntries] = useUserStorage("ct_entries", []);

  /* ── form state ────────────────────────────────────────────────────────── */
  const [foodName, setFoodName] = useState("");      // what the input shows
  const [foodNameEn, setFoodNameEn] = useState("");  // english slot
  const [foodNameAr, setFoodNameAr] = useState("");  // arabic slot
  const [calories, setCalories] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);

  /* ── UI flags ──────────────────────────────────────────────────────────── */
  const [scanning, setScanning] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [toast, setToast] = useState(null);

  /* ── derived ───────────────────────────────────────────────────────────── */
  const t = translations[lang];
  const totalEaten = entries.reduce((sum, e) => sum + e.calories, 0);
  const remaining = Math.max(goal - totalEaten, 0);
  const pct = goal ? Math.min((totalEaten / goal) * 100, 100) : 0;
  const overGoal = goal !== null && totalEaten > goal;

  /* ── toast helper ──────────────────────────────────────────────────────── */
  const showToast = useCallback((msg) => setToast(msg), []);

  /* ── lang switch: swap the visible input to match the active slot ──────── */
  useEffect(() => {
    if (foodNameEn || foodNameAr) {
      setFoodName(lang === "ar" ? foodNameAr || foodNameEn : foodNameEn || foodNameAr);
    }
  }, [lang, foodNameEn, foodNameAr]);

  /* ═══════════════════════════════════════════════════════════════════════════
     HANDLERS
     ═══════════════════════════════════════════════════════════════════════════ */

  /** User types in the food-name input → update only the active-lang slot. */
  function handleFoodNameChange(value) {
    setFoodName(value);
    if (lang === "ar") {
      setFoodNameAr(value);
      setFoodNameEn("");
    } else {
      setFoodNameEn(value);
      setFoodNameAr("");
    }
  }

  /** User picked a photo → preview it and kick off AI scan. */
  async function handlePhotoSelect(file) {
    setPreviewUrl(URL.createObjectURL(file));
    setScanning(true);

    try {
      const base64 = await fileToBase64(file);
      const json = await callClaude(buildScanPrompt(base64, file.type));
      const result = JSON.parse(json);

      const en = result.foodName || "";
      const ar = result.foodNameAr || en;
      setFoodNameEn(en);
      setFoodNameAr(ar);
      setFoodName(lang === "ar" ? ar : en);
      setCalories(String(result.calories || ""));
      showToast(t.aiScanned(lang === "ar" ? ar : en, result.calories));
    } catch (error) {
      console.error("Photo scan error:", error);
      showToast(error.message || t.aiError);
    } finally {
      setScanning(false);
    }
  }

  /** 🤖 AI button next to calories → estimate calories + normalise names. */
  async function handleEstimate() {
    if (!foodName.trim()) return;
    setEstimating(true);

    try {
      const json = await callClaude(buildEstimatePrompt(foodName.trim()));
      const result = JSON.parse(json);

      const en = result.foodName || foodNameEn || foodName;
      const ar = result.foodNameAr || foodNameAr || foodName;
      setFoodNameEn(en);
      setFoodNameAr(ar);
      setFoodName(lang === "ar" ? ar : en);

      if (result.calories) {
        setCalories(String(result.calories));
        showToast(t.aiEstimated(lang === "ar" ? ar : en, result.calories));
      }
    } catch (error) {
      console.error("Estimate error:", error);
      showToast(error.message || t.aiError);
    } finally {
      setEstimating(false);
    }
  }

  /** ➕ Add Entry button → if no calories yet, auto-estimate first. */
  async function handleAdd() {
    if (!foodName.trim()) return;

    let en = foodNameEn || foodName.trim();
    let ar = foodNameAr || foodName.trim();
    let cal = parseInt(calories, 10);

    /* auto-estimate when calories field is empty */
    if (!cal) {
      setEstimating(true);
      try {
        const json = await callClaude(buildEstimatePrompt(foodName.trim()));
        const result = JSON.parse(json);
        en = result.foodName || en;
        ar = result.foodNameAr || ar;
        cal = result.calories || 0;
      } catch (error) {
        console.error("Auto-estimate error:", error);
        showToast(error.message || t.aiError);
        cal = 0;
      } finally {
        setEstimating(false);
      }
    }

    const entry = {
      id: Date.now(),
      nameEn: en,
      nameAr: ar,
      calories: cal,
      time: new Date().toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setEntries((prev) => [entry, ...prev]);
    showToast(t.added(getEntryName(entry, lang), entry.calories));
    resetForm();
  }

  /** Delete a single entry by id. */
  function handleDelete(id) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    showToast(t.deleted);
  }

  /** Reset goal + entries (triggered by dropdown). */
  function handleReset() {
    if (window.confirm("Reset all data? This cannot be undone.")) {
      setGoal(null);
      setEntries([]);
      // Only clear current user's data (keys are already prefixed with user ID)
      showToast("Data reset successfully");
    }
  }

  /* ── private helpers ─────────────────────────────────────────────────── */
  function resetForm() {
    setFoodName("");
    setFoodNameEn("");
    setFoodNameAr("");
    setCalories("");
    setPreviewUrl(null);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════════ */

  /* first-launch gate */
  if (goal === null) {
    return (
      <GoalModal
        lang={lang}
        onSave={(g) => {
          setGoal(g);
          showToast(t.goalSet);
        }}
      />
    );
  }

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} style={{ minHeight: "100vh" }}>
      {/* toast notification */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "28px 18px 60px" }}>
        <Header lang={lang} onLangChange={setLang} onReset={handleReset} />

        <StatsRow
          lang={lang}
          goal={goal}
          totalEaten={totalEaten}
          remaining={remaining}
          overGoal={overGoal}
        />

        <ProgressBar lang={lang} percent={pct} overGoal={overGoal} />

        <AddFoodForm
          lang={lang}
          foodName={foodName}
          calories={calories}
          previewUrl={previewUrl}
          scanning={scanning}
          estimating={estimating}
          onFoodNameChange={handleFoodNameChange}
          onCaloriesChange={setCalories}
          onEstimate={handleEstimate}
          onPhotoSelect={handlePhotoSelect}
          onAdd={handleAdd}
        />

        <EntryList lang={lang} entries={entries} onDelete={handleDelete} />
      </div>
    </div>
  );
}
