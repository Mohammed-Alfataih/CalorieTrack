const translations = {
  en: {
    title: "CalorieTrack",
    subtitle: "AI-Powered Nutrition Tracker",
    goal: "Goal",
    eaten: "Eaten",
    left: "Left",
    cal: "cal",
    progress: "Daily Progress",
    addFood: "Add Food",
    foodName: "Food Name",
    foodPlaceholder: "e.g. Chicken Salad, Pizza…",
    calories: "Calories",
    calPlaceholder: "e.g. 350",
    orScan: "or scan your meal",
    scanPhoto: "📸 Take / Upload Photo",
    scanHint: "AI will identify the food & estimate calories",
    addEntry: "Add Entry",
    noEntries: "No entries yet",
    noEntriesHint: "Add your first meal above to start tracking",
    analyzing: "AI is analyzing your meal…",
    setGoalTitle: "Set Your Daily Goal",
    setGoalHint: "How many calories do you want to consume today?",
    startTracking: "Start Tracking",
    goalSet: "Goal set! Let's go 🎯",
    added: (name, cal) => `Added ${name} — ${cal} cal 🎉`,
    aiEstimated: (name, cal) => `AI estimated: ${name} — ${cal} cal 🤖`,
    aiScanned: (name, cal) => `Scanned: ${name} — ${cal} cal 🔥`,
    deleted: "Entry removed",
    aiError: "AI couldn't analyze. Try again or enter manually.",
    delete: "Delete",
    overGoal: "Over goal!",
    tapChange: "Tap to change photo",
  },
  ar: {
    title: "تتبع السعرات",
    subtitle: "متتبع التغذية المدعوم بالذكاء الاصطناعي",
    goal: "الهدف",
    eaten: "المستهلك",
    left: "المتبقي",
    cal: "سعرة",
    progress: "التقدم اليومي",
    addFood: "إضافة طعام",
    foodName: "اسم الطعام",
    foodPlaceholder: "مثلاً: سلطة دجاج، بيتزا…",
    calories: "السعرات الحرارية",
    calPlaceholder: "مثلاً: 350",
    orScan: "أو صور وجبتك",
    scanPhoto: "📸 التقط / ارفع صورة",
    scanHint: "الذكاء الاصطناعي سيحدد الطعام ويقدر السعرات",
    addEntry: "إضافة وجبة",
    noEntries: "لا توجد وجبات بعد",
    noEntriesHint: "أضف أول وجبة أعلاه لبدء التتبع",
    analyzing: "الذكاء الاصطناعي يحلل وجبتك…",
    setGoalTitle: "حدد هدفك اليومي",
    setGoalHint: "كم سعرة حرارية تريد أن تستهلكها اليوم؟",
    startTracking: "ابدأ التتبع",
    goalSet: "تم تعيين الهدف! هيا 🎯",
    added: (name, cal) => `تمت إضافة ${name} — ${cal} سعرة 🎉`,
    aiEstimated: (name, cal) => `قدّر الذكاء الاصطناعي: ${name} — ${cal} سعرة 🤖`,
    aiScanned: (name, cal) => `تم المسح: ${name} — ${cal} سعرة 🔥`,
    deleted: "تم حذف الوجبة",
    aiError: "لم يتمكن الذكاء الاصطناعي من التحليل. حاول مجدداً أو أدخل يدوياً.",
    delete: "حذف",
    overGoal: "تجاوزت الهدف!",
    tapChange: "اضغط لتغيير الصورة",
  },
};

export default translations;
