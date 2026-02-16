import { useState, useEffect, useCallback } from "react";

// ── auth ──────────────────────────────────────────────────────────────────────
import { useAuth } from "./contexts/AuthContext";
import Login from "./components/Login/Login";

// ── data & utilities ──────────────────────────────────────────────────────────
import translations from "./constants/translations";
import { callAI, fileToBase64, buildScanPrompt, buildEstimatePrompt } from "./utils/api";
import { getEntryName } from "./utils/helpers";
import useUserStorage from "./hooks/useUserStorage";

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
  if (!user) return <Login />;
  return <MainApp />;
}

function MainApp() {
  const [lang, setLang] = useUserStorage("ct_lang", "en");
  const [goal, setGoal] = useUserStorage("ct_goal", null);
  const [entries, setEntries] = useUserStorage("ct_entries", []);

  const [foodName, setFoodName] = useState("");
  const [foodNameEn, setFoodNameEn] = useState("");
  const [foodNameAr, setFoodNameAr] = useState("");
  const [calories, setCalories] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);

  const [scanning, setScanning] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [toast, setToast] = useState(null);

  const t = translations[lang];
  const totalEaten = entries.reduce((sum, e) => sum + e.calories, 0);
  const remaining = Math.max(goal - totalEaten, 0);
  const pct = goal ? Math.min((totalEaten / goal) * 100, 100) : 0;
  const overGoal = goal !== null && totalEaten > goal;

  const showToast = useCallback((msg) => setToast(msg), []);

  useEffect(() => {
    if (foodNameEn || foodNameAr) {
      setFoodName(lang === "ar" ? foodNameAr || foodNameEn : foodNameEn || foodNameAr);
    }
  }, [lang, foodNameEn, foodNameAr]);

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

  // Safe JSON parser
  function safeParse(text, contextLabel) {
    if (!text || typeof text !== "string") {
      console.warn(`${contextLabel} returned empty response`);
      return null;
    }

    try {
      return JSON.parse(text);
    } catch (err) {
      console.warn(`${contextLabel} returned non-JSON:`, text);
      return null;
    }
  }

  // ── AI Image Scan ───────────────────────────────
  async function handlePhotoSelect(file) {
    setPreviewUrl(URL.createObjectURL(file));
    setScanning(true);

    try {
      const base64 = await fileToBase64(file);
      const text = await callAI(buildScanPrompt(base64, file.type));

      const result = safeParse(text, "Photo scan");

      if (!result) {
        showToast("AI returned an invalid response. Please try again.");
        return;
      }

      const en = result.foodName || "";
      const ar = result.foodNameAr || en;

      setFoodNameEn(en);
      setFoodNameAr(ar);
      setFoodName(lang === "ar" ? ar : en);
      setCalories(result.calories ? String(result.calories) : "");

      if (result.calories) {
        showToast(t.aiScanned(lang === "ar" ? ar : en, result.calories));
      } else {
        showToast("Could not detect calories. Please try again.");
      }

    } catch (err) {
      console.error("Photo scan error:", err);
      showToast(t.aiError);
    } finally {
      setScanning(false);
    }
  }

  // ── AI Text Estimate ─────────────────────────────
  async function handleEstimate() {
    if (!foodName.trim()) return;

    setEstimating(true);

    try {
      const text = await callAI(buildEstimatePrompt(foodName.trim()));
      const result = safeParse(text, "Estimate");

      if (!result) {
        showToast("AI returned an invalid response. Please try again.");
        return;
      }

      const en = result.foodName || foodNameEn || foodName;
      const ar = result.foodNameAr || foodNameAr || foodName;

      setFoodNameEn(en);
      setFoodNameAr(ar);
      setFoodName(lang === "ar" ? ar : en);

      if (result.calories) {
        setCalories(String(result.calories));
        showToast(t.aiEstimated(lang === "ar" ? ar : en, result.calories));
      } else {
        showToast("Could not estimate calories. Please try again.");
      }

    } catch (err) {
      console.error("Estimate error:", err);
      showToast(t.aiError);
    } finally {
      setEstimating(false);
    }
  }

  // ── Add Food Entry ─────────────────────────────
  async function handleAdd() {
    if (!foodName.trim()) return;

    let en = foodNameEn || foodName.trim();
    let ar = foodNameAr || foodName.trim();
    let cal = parseInt(calories, 10);

    if (!cal) {
      setEstimating(true);
      try {
        const text = await callAI(buildEstimatePrompt(foodName.trim()));
        const result = safeParse(text, "Auto-estimate");

        if (result) {
          en = result.foodName || en;
          ar = result.foodNameAr || ar;
          cal = result.calories || 0;
        }
      } catch (err) {
        console.error("Auto-estimate error:", err);
        showToast(t.aiError);
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

  function handleDelete(id) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    showToast(t.deleted);
  }

  function handleReset() {
    if (window.confirm("Reset all data? This cannot be undone.")) {
      setGoal(null);
      setEntries([]);
      showToast("Data reset successfully");
    }
  }

  function resetForm() {
    setFoodName("");
    setFoodNameEn("");
    setFoodNameAr("");
    setCalories("");
    setPreviewUrl(null);
  }

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
