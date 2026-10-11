# 🌸 Diary Daily Planner — Aesthetic Personal Journal

<p align="center">
  <b>יומן אישי מעוצב, חודשי ויומי • 100% אופליין וללא צורך באינטרנט</b><br>
  <i>A chic, private, offline-first personal digital planner in soft pastel blush pink with realistic 3D book flip physics, Hebrew & Gregorian calendar, tasks, habits, and daily reflections.</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-pink?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8-purple?style=flat-square&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat-square&logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Hebrew_Calendar-Hebcal-amber?style=flat-square" alt="Hebcal" />
  <img src="https://img.shields.io/badge/Storage-100%25_Local_&_Offline-emerald?style=flat-square" alt="100% Offline" />
  <img src="https://img.shields.io/badge/PWA-Installable-rose?style=flat-square" alt="PWA Ready" />
</p>

---

## 🚀 הורדה והרצה מהירה על המחשב (Quick Start)

ניתן להריץ את היומן ישירות מהמחשב שלך ללא תלות באינטרנט:

```bash
# 1. שכפול הפרויקט מה-GitHub למחשב
git clone https://github.com/Noa-kay/Diary_Daily_Planner.git

# 2. כניסה לתיקיית הפרויקט
cd Diary_Daily_Planner

# 3. התקנת הספריות הנדרשות
npm install --legacy-peer-deps

# 4. הפעלת היומן מקומית
npm run dev
```

לאחר ההפעלה, פתחו את הדפדפן (Chrome / Safari) בכתובת:  
👉 **`http://localhost:3000`**

---

## ✨ תכונות עיקריות (Key Features)

* **📖 כריכת תלת-ממד ריאליסטית (3D Book Flip):**
  * פתיחה אותנטית המסתובבת 175° סביב שדרת הספירלה השמאלית וחשיפת הדפים הפנימיים.
  * מנעול קומבינציה וקוד PIN פרטי להגנה על היומן (ברירת מחדל: `2006`).
* **📅 פריסה חודשית עם לוח עברי ולועזי (Monthly Spread):**
  * תאריכים עבריים מדויקים, חגים ומועדים, ראשי חודשים ופרשות שבוע בעזרת `@hebcal/core`.
  * סנכרון אירועים חשובים מהדפים היומיים שמוצגים ישירות בתוך משבצות החודש.
* **✍️ דף יומי עשיר (Daily Spread):**
  * **⭐ אירועים חשובים וימי הולדת:** תיעוד אירועים עם אפשרות עריכה, מחיקה וסימון אייקונים.
  * **🎯 סדר עדיפויות יומי:** הגדרת 3 המטרות המרכזיות להיום.
  * **📋 רשימת משימות:** צ'קליסט משימות אינטראקטיבי עם אפקט קונפטי בסיום כל המשימות.
  * **⏰ לוח זמנים שעתי (Hourly Schedule):** שורות מחברת קלאסיות מתרחבות אוטומטית רק לפי אורך הטקסט.
  * **😂 מאגר בדיחות, פתגמים ומשפטים שאהבתי:** שמירת בדיחות בשורה אחת ואפשרות לצפייה בריכוז חודשי ושנתי לפי חודשי השנה העברית.
  * **💧 מעקב שתיית מים והרגלים:** 8 כוסות מים ומעקב שגרת בריאות יומית.
  * **🍽️ יומן תזונה וארוחות:** בוקר, צהריים, ערב, נשנושים ופינוק מתוק.
  * **💭 מצב רוח, תודה יומית והרהורים:** תיעוד רגשות ומחשבות יומיות.
* **💡 לוח רעיונות והשראות (Ideas Board):** לוח פתקיות מעוצב עם חלוקה לקטגוריות ותגיות.
* **🌸 מעקב מחזור ובריאות (Wellness & Cycle):** מעקב דיסקרטי ועדין.
* **🔒 פרטיות מוחלטת ואבטחה כפולה (Offline-First):**
  * המידע נשמר אך ורק במכשיר שלך באמצעות שילוב כפול של `localStorage` ו-`IndexedDB`.
  * שום נתון אישי לא נשלח לרשת, אין צורך ביצירת חשבון ואין מעקב.
* **📦 גיבוי, שחזור וקובץ עצמאי (.html):**
  * הורדת קובץ HTML עצמאי אחד המכיל את כל היומן ומאפשר פתיחה בלחיצה כפולה ללא שום שרת וללא אינטרנט.
  * ייצוא ושחזור קובצי JSON מלאים בכל עת.

---

## 💻 התקנה כאפליקציית שולחן עבודה (Desktop App)

### אפשרות 1: התקנת PWA ישירות מהדפדפן
1. פתחו את היומן בדפדפן (Chrome / Edge / Safari).
2. לחצו על כפתור **"התקן אפליקציה" 📲** בסרגל העליון (או על אייקון המחשב 🖥️ בסרגל הכתובות).
3. **ב-Mac (Safari):** לחצו בתפריט העליון `File` ➔ `Add to Dock`.
4. האפליקציה תופיע בשולחן העבודה / Dock ותיפתח בחלון עצמאי לחלוטין.

### אפשרות 2: קובץ יומן עצמאי (Single HTML File)
מתוך היומן, לחצו על **"התקן אפליקציה"** (או הגדרות ➔ גיבוי) ובחרו **"הורד קובץ יומן (.html)"**.  
הקובץ שיירד מכיל את כל היומן שלכם ופועל בכל מחשב בלחיצה כפולה ללא צורך בשום חיבור רשת!

---

## 🛠️ טכנולוגיות (Tech Stack)

* **UI & Core:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
* **Build Tool:** [Vite 8](https://vitejs.dev/)
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Hebrew Calendar API:** [@hebcal/core](https://github.com/hebcal/hebcal-es6)
* **Animations & Effects:** [canvas-confetti](https://github.com/catdad/canvas-confetti), [Motion](https://motion.dev/)
* **Offline & PWA:** [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)

---

## 📂 מבנה התיקיות (Project Structure)

```text
Diary_Daily_Planner/
├── public/                     # אייקונים, קובצי PWA ו-standalone template
├── src/
│   ├── components/             # רכיבי הממשק
│   │   ├── BookContainer.tsx      # מבנה היומן הראשי, הלשוניות והסרגל העליון
│   │   ├── PlannerCover.tsx       # כריכת הספר התלת-ממדית ומנעול ה-PIN
│   │   ├── MonthlyBookSpread.tsx  # פריסת לוח השנה החודשי והתאריכים העבריים
│   │   ├── DayBookPage.tsx        # עמוד היומן היומי, לוח זמנים, משימות ובדיחות
│   │   ├── JokesDigest.tsx        # מאגר וסיכום הבדיחות והפתגמים לפי חודש עברי
│   │   ├── IdeasJournal.tsx       # לוח הפתקיות והרעיונות
│   │   ├── CycleTracker.tsx       # יומן מעקב מחזור ובריאות
│   │   ├── BackupModal.tsx        # חלון גיבויים, שחזור וקובץ עצמאי
│   │   ├── RecoveryModal.tsx      # מרכז שחזור נתונים אוטומטי מזיכרון הדפדפן
│   │   └── PWAInstallButton.tsx   # כפתור ומודל התקנת אפליקציה למחשב/נייד
│   ├── services/
│   │   ├── storage.ts             # מנגנוני אחסון, IndexedDB, גיבויים ושחזור
│   │   ├── hebrewCalendar.ts      # חישובי תאריכים עבריים וחגים
│   │   └── soundService.ts        # צליל פתיחה וצ'יימס עדין
│   ├── types.ts                   # הגדרות טיפוסי TypeScript
│   ├── App.tsx                    # רכיב האפליקציה הראשי
│   └── main.tsx                   # נקודת כניסה
├── package.json
└── README.md
```

---

## 📜 רישיון ופרטיות (License & Privacy)

קוד זה מופץ תחת רישיון MIT. כל הנתונים שלכם נשארים אך ורק במכשיר האישי שלכם — 100% פרטי, עצמאי ובטוח! 🌸

