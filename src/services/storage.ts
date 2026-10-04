import { JournalDatabase, Task, IdeaEntry, IdeaCategory, CycleDayLog, DayLog, Habit, AppSettings } from '../types';

const STORAGE_KEY = 'offline_personal_journal_v1';

// Format Date as YYYY-MM-DD in local time
export function formatDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateKey(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatHebrewDateString(dateStr: string): string {
  const date = parseDateKey(dateStr);
  const daysOfWeek = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'יום שבת'];
  const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  
  const dayName = daysOfWeek[date.getDay()];
  const dayNum = date.getDate();
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName}, ${dayNum} ב${monthName} ${year}`;
}

const defaultHabits: Habit[] = [
  { id: 'water', name: 'שתיית מים', icon: '💧', targetPerDay: 8, unit: 'כוסות' },
  { id: 'reading', name: 'קריאת ספר/למידה', icon: '📖', targetPerDay: 1, unit: 'פרק/זמן' },
  { id: 'walk', name: 'הליכה / תנועה', icon: '👟', targetPerDay: 1, unit: 'אימון' },
  { id: 'mindfulness', name: 'רגע של שקט / נשימה', icon: '✨', targetPerDay: 1, unit: 'פעמים' },
];

const defaultSettings: AppSettings = {
  theme: 'rose',
  enableCycleTracker: true,
  cycleDiscreteMode: true,
  averageCycleLength: 28,
  averagePeriodLength: 5,
  isPinLocked: false,
  userDisplayName: 'יומני המלכותי',
};

function createInitialDatabase(): JournalDatabase {
  const today = formatDateKey(new Date());
  
  // Create realistic welcoming sample tasks for today
  const initialTasks: Task[] = [
    {
      id: 'task-1',
      date: today,
      title: "Review today's top priorities & goals",
      completed: true,
      priority: 'high',
      category: 'אישי',
      time: '09:00',
      createdAt: Date.now() - 3600000,
    },
    {
      id: 'task-2',
      date: today,
      title: 'Hydrate & drink fresh water throughout the day',
      completed: false,
      priority: 'high',
      category: 'אישי',
      time: '11:00',
      createdAt: Date.now() - 2400000,
    },
    {
      id: 'task-3',
      date: today,
      title: 'Take a gentle 15-minute stretch or walk',
      completed: false,
      priority: 'medium',
      category: 'בריאות',
      time: '14:00',
      createdAt: Date.now() - 1200000,
    },
    {
      id: 'task-4',
      date: today,
      title: 'Read an inspiring chapter & unwind before bed',
      completed: false,
      priority: 'low',
      category: 'אישי',
      createdAt: Date.now() - 600000,
    },
  ];

  const initialIdeas: IdeaEntry[] = [
    {
      id: 'idea-1',
      date: today,
      title: 'Welcome to Your Private Daily Planner & Journal! 🎀',
      content: 'This planner is 100% private and stored locally on your device. It works completely offline with no cloud or tracking. Capture your daily tasks, schedule, thoughts, creative projects, track your habits, and celebrate every little step.',
      category: 'Inspiration',
      mood: 'creative',
      tags: ['welcome', 'fresh-start', 'mindfulness'],
      pinned: true,
      createdAt: Date.now() - 7200000,
      updatedAt: Date.now() - 7200000,
    },
    {
      id: 'idea-2',
      date: today,
      title: 'Gentle Evening Routine & Creative Calm',
      content: 'Spend 20 quiet screen-free minutes in the evening with a warm cup of herbal tea, soft music, and journaling your gratitude. A tranquil sanctuary for your thoughts.',
      category: 'Idea',
      mood: 'calm',
      tags: ['creativity', 'evening-routine', 'peace'],
      pinned: false,
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now() - 3600000,
    },
  ];

  const initialDayLogs: Record<string, DayLog> = {
    [today]: {
      date: today,
      gratitude: '1. ♡ A peaceful start to the day\n2. ♡ A quiet moment for myself\n3. ♡ My lovely daily planner',
      topPriorities: [
        'Focus on what truly matters today',
        'Take gentle mindful breaks',
        'Celebrate accomplishments',
      ],
      habitsProgress: {
        water: 3,
        reading: 1,
        walk: 0,
        mindfulness: 1,
      },
    },
  };

  // Sample cycle log from last cycle for prediction demonstration
  const prevCycleStart = new Date();
  prevCycleStart.setDate(prevCycleStart.getDate() - 25);
  const cycleLogs: Record<string, CycleDayLog> = {};

  for (let i = 0; i < 5; i++) {
    const d = new Date(prevCycleStart);
    d.setDate(d.getDate() + i);
    const key = formatDateKey(d);
    cycleLogs[key] = {
      date: key,
      isPeriod: true,
      flow: i === 0 ? 'light' : i < 3 ? 'heavy' : i === 3 ? 'medium' : 'spotting',
      symptoms: i === 1 ? ['התכווצויות', 'עייפות'] : ['רגישות בחזה'],
      notes: i === 1 ? 'יום ראשון חזק, מנוחה עם כרית חמה' : '',
    };
  }

  return {
    version: 1,
    tasks: initialTasks,
    ideas: initialIdeas,
    cycleLogs,
    dayLogs: initialDayLogs,
    habits: defaultHabits,
    settings: defaultSettings,
    lastUpdated: Date.now(),
  };
}

export function loadJournalDatabase(): JournalDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createInitialDatabase();
      saveJournalDatabase(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as JournalDatabase;
    // ensure migrations or missing fields
    if (!parsed.settings) parsed.settings = defaultSettings;
    if (!parsed.habits) parsed.habits = defaultHabits;
    if (!parsed.cycleLogs) parsed.cycleLogs = {};
    if (!parsed.dayLogs) parsed.dayLogs = {};
    if (!parsed.tasks) parsed.tasks = [];
    if (!parsed.ideas) parsed.ideas = [];

    // Migrate any legacy Hebrew starter cards to English
    parsed.ideas = parsed.ideas.map((entry) => {
      if (entry.title.includes('ברוכים הבאים ליומן')) {
        return {
          ...entry,
          title: 'Welcome to Your Private Daily Planner & Journal! 🎀',
          content: 'This planner is 100% private and stored locally on your device. It works completely offline with no cloud or tracking. Capture your daily tasks, schedule, thoughts, creative projects, track your habits, and celebrate every little step.',
          category: 'Inspiration',
          tags: ['welcome', 'fresh-start', 'mindfulness'],
        };
      }
      if (entry.title.includes('רעיון לפרויקט חדש')) {
        return {
          ...entry,
          title: 'Gentle Evening Routine & Creative Calm',
          content: 'Spend 20 quiet screen-free minutes in the evening with a warm cup of herbal tea, soft music, and journaling your gratitude. A tranquil sanctuary for your thoughts.',
          category: 'Idea',
          tags: ['creativity', 'evening-routine', 'peace'],
        };
      }
      // Map Hebrew categories to English
      const catMap: Record<string, IdeaCategory> = {
        'מחשבה': 'Reflection',
        'רעיון': 'Idea',
        'פרויקט': 'Project',
        'השראה': 'Inspiration',
        'תובנה': 'Insight',
        'חלום': 'Dream',
        'יצירה': 'Creative',
      };
      if (catMap[entry.category]) {
        return {
          ...entry,
          category: catMap[entry.category],
        };
      }
      return entry;
    });

    return parsed;
  } catch (err) {
    console.error('Failed to read from localStorage:', err);
    return createInitialDatabase();
  }
}

export function saveJournalDatabase(db: JournalDatabase): void {
  try {
    db.lastUpdated = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export function exportToJsonFile(db: JournalDatabase): void {
  const jsonStr = JSON.stringify(db, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStr = formatDateKey(new Date());
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `my_planner_backup_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function importFromJsonFile(file: File): Promise<JournalDatabase> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('קובץ לא תקין');
        }
        // Minimal integrity check
        if (!Array.isArray(parsed.tasks) && !Array.isArray(parsed.ideas)) {
          throw new Error('מבנה קובץ היומן אינו מזוהה');
        }
        resolve(parsed as JournalDatabase);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('שגיאה בקריאת הקובץ מהמחשב'));
    reader.readAsText(file);
  });
}

// Prediction calculations for menstrual cycle
export interface CyclePrediction {
  lastPeriodStart?: string;
  nextPeriodStart?: string;
  nextPeriodEnd?: string;
  fertileWindowStart?: string;
  fertileWindowEnd?: string;
  ovulationDay?: string;
  daysUntilNext?: number;
  currentCycleDay?: number;
}

export function calculateCyclePrediction(
  cycleLogs: Record<string, CycleDayLog>,
  avgCycleLength: number = 28,
  avgPeriodLength: number = 5
): CyclePrediction {
  const periodDates = Object.keys(cycleLogs)
    .filter((k) => cycleLogs[k]?.isPeriod)
    .sort();

  if (periodDates.length === 0) {
    return {};
  }

  // Find period streaks / distinct starts
  const periodStarts: string[] = [];
  let prevDate: Date | null = null;

  for (const dateStr of periodDates) {
    const curDate = parseDateKey(dateStr);
    if (!prevDate) {
      periodStarts.push(dateStr);
    } else {
      const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 3) {
        // New period cycle started
        periodStarts.push(dateStr);
      }
    }
    prevDate = curDate;
  }

  const lastStartStr = periodStarts[periodStarts.length - 1];
  const lastStartDate = parseDateKey(lastStartStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysSinceLast = Math.round((today.getTime() - lastStartDate.getTime()) / (1000 * 60 * 60 * 24));
  const currentCycleDay = daysSinceLast >= 0 ? daysSinceLast + 1 : undefined;

  const nextStartDate = new Date(lastStartDate);
  nextStartDate.setDate(nextStartDate.getDate() + avgCycleLength);

  const nextEndDate = new Date(nextStartDate);
  nextEndDate.setDate(nextEndDate.getDate() + avgPeriodLength - 1);

  // Ovulation typically ~14 days before next period
  const ovulationDate = new Date(nextStartDate);
  ovulationDate.setDate(ovulationDate.getDate() - 14);

  const fertileStart = new Date(ovulationDate);
  fertileStart.setDate(fertileStart.getDate() - 4);

  const fertileEnd = new Date(ovulationDate);
  fertileEnd.setDate(fertileEnd.getDate() + 1);

  const daysUntilNext = Math.round((nextStartDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return {
    lastPeriodStart: lastStartStr,
    nextPeriodStart: formatDateKey(nextStartDate),
    nextPeriodEnd: formatDateKey(nextEndDate),
    ovulationDay: formatDateKey(ovulationDate),
    fertileWindowStart: formatDateKey(fertileStart),
    fertileWindowEnd: formatDateKey(fertileEnd),
    daysUntilNext,
    currentCycleDay,
  };
}
