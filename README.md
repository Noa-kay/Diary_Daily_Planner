# 🌸 My Planner — Aesthetic Daily & Wellness Journal

> A chic, private, offline-first personal digital planner designed in soft pastel blush pinks with ribbon bookmarks, gold spiral spine, Hebrew calendar dates, daily schedule, habit tracking, and reflection board.

![Cover Aesthetic](https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/book-open.svg)

---

## ✨ Features

- **📖 3D Book Experience:** Open-book desk layout with spiral binding, ribbon bookmark, tabbed navigation, and pastel desk textures.
- **📅 Monthly Calendar Spread:** Full interactive monthly calendar featuring both Gregorian dates and Hebrew dates (including Jewish holidays and Rosh Chodesh) powered by `@hebcal/core`.
- **✍️ Today's Page (Daily Spread):**
  - **⭐ Important Events & Occasions:** Dedicated section to record, edit (with inline pencil ✏️), and manage key dates, birthdays, appointments, and meetings that automatically sync and display the full text inside the day's square in the **Monthly Calendar**.
  - **🔔 Gentle Audio Chime Reminders:** Soft melodic chime (synthesized offline via Web Audio API) notifying you when scheduled events or tasks approach their planned time, with one-click mute in the desk toolbar.
  - **Today's Priorities:** Top 3 focus goals for the day.
  - **To-Do List:** Checklist with celebratory confetti upon completing all tasks.
  - **Hourly Time-Block Schedule:** 06:00 to 22:00 timeline planner.
  - **Water & Habits Tracker:** 8-cup water tracker and daily wellness habits.
  - **Meal & Nourishment Planner:** Breakfast, lunch, dinner, snacks, and sweet treats.
  - **Mood & Daily Reflections:** Mood selector, daily gratitude, and daily thoughts.
  - **Notes & Inspiration Strip:** Notes pad with pastel washi tape styling.
- **💡 Ideas & Journal Board:** Aesthetic cork-style board with pastel sticky notes, categorized entries (Reflections, Projects, Inspirations, Creative Ideas), and writing prompts.
- **🌸 Wellness & Cycle Tracker:** Subtle, discrete cycle and mood tracking with wellness reminders.
- **🔒 PIN Code Privacy Lock:** Keep your private diary protected with an optional PIN lock.
- **💾 100% Offline & Private (Zero-Cloud):** All diary data is stored locally in your browser/device `localStorage`. No accounts, no servers, zero data tracking.
- **📦 Backup & Restore:** Export your complete journal as a standalone `.json` backup file or restore it anytime.
- **🖨️ Print Ready:** Clean CSS print styles for printing daily pages onto paper.

---

## 💻 How to Install & Run as a Desktop App on Mac & Windows (Without Coding)

You can run **My Planner** directly on your computer as a standalone desktop app that opens in its own window with an app icon on your Desktop or Dock.

### Option 1: Chrome Standalone Desktop App (Recommended for Chrome Users)

1. Open the planner in **Google Chrome**.
2. Click the **three dots menu (⋮)** in the top right corner of Chrome.
3. Hover over **Save and share** (שמירה ושיתוף) and click **Create shortcut...** (יצירת קיצור דרך...).
4. In the dialog that pops up:
   - Name it: `My Planner`
   - ✅ **IMPORTANT:** Check the box: **"Open as window"** (פתח כחלון).
5. Click **Create** (צור).

> 🎉 **Done!** A native desktop app shortcut with the pink ribbon icon is created on your desktop / Mac Applications. Double-clicking it opens My Planner in its own independent window, completely separate from the browser. It works 100% offline even without internet.

---

### Option 2: Running Locally from Source (For Developers)

If you cloned this repository from GitHub and want to run it locally on your computer:

#### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher)
- npm or pnpm / yarn

#### Installation

```bash
# Clone your repository
git clone https://github.com/your-username/my-planner.git
cd my-planner

# Install dependencies
npm install

# Start the local development server
npm run dev
```

Open your browser at `http://localhost:3000`.

#### Build for Production

```bash
# Create an optimized production build
npm run build

# Preview production build locally
npm run preview
```

---

## 🛠️ Tech Stack

- **Framework:** [React 19](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Bundler:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Calendar & Hebrew Dates:** [@hebcal/core](https://github.com/hebcal/hebcal-es6)
- **Effects:** [canvas-confetti](https://github.com/catdad/canvas-confetti)
- **PWA & Offline:** [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)

---

## 📁 Project Structure

```text
my-planner/
├── public/               # Static assets (icons, manifest)
├── src/
│   ├── components/       # UI Components
│   │   ├── BookContainer.tsx      # Main notebook layout & desk frame
│   │   ├── DayBookPage.tsx        # Daily planner spread
│   │   ├── MonthlyBookSpread.tsx  # Monthly calendar with Hebrew dates
│   │   ├── IdeasJournal.tsx       # Creative ideas & reflections board
│   │   ├── CycleTracker.tsx       # Wellness & cycle tracking
│   │   ├── PlannerCover.tsx       # 3D interactive book cover
│   │   ├── BackupModal.tsx        # JSON backup and restore modal
│   │   └── PinLockModal.tsx       # Privacy PIN protection
│   ├── services/
│   │   └── storage.ts             # LocalStorage database & migrations
│   ├── types.ts                   # TypeScript interfaces & types
│   ├── App.tsx                    # Root application component
│   └── main.tsx                   # React DOM entry point
├── package.json
└── README.md
```

---

## 🛡️ Privacy & Security

Your thoughts and personal entries belong strictly to you. **My Planner** never sends data over the internet. Everything stays on the local device where it was entered.

---

## 📜 License

MIT License. Free to use, personalize, and enjoy! 🌸
