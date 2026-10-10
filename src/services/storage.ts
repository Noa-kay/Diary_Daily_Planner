import { JournalDatabase, Task, IdeaEntry, IdeaCategory, CycleDayLog, DayLog, Habit, AppSettings, EventRecurrence } from '../types';
import { isSameHebrewDayAndMonth } from './hebrewCalendar';

const STORAGE_KEY = 'offline_personal_journal_v1';
const VAULT_KEY = 'journal_emergency_recovery_vault';
const SNAPSHOTS_KEY = 'journal_automatic_snapshots_v1';
const CORRUPTED_BACKUP_KEY = 'journal_corrupted_raw_backup';

export interface StorageSnapshot {
  id: string;
  timestamp: number;
  dateStr: string;
  taskCount: number;
  ideaCount: number;
  dayLogCount: number;
  cycleLogCount: number;
  description: string;
  data: JournalDatabase;
}

export interface CandidateDatabase {
  sourceKey: string;
  sourceType: 'localStorage' | 'sessionStorage' | 'indexedDB' | 'vault';
  score: number;
  taskCount: number;
  ideaCount: number;
  dayLogCount: number;
  cycleLogCount: number;
  lastUpdated: number;
  db: JournalDatabase;
}

// IndexedDB Helper for dual persistence
const IDB_NAME = 'RoyalPersonalJournalIDB';
const IDB_STORE = 'journal_store';
const IDB_VERSION = 1;

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported in this environment'));
    }
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveToIndexedDB(db: JournalDatabase): Promise<void> {
  try {
    const idb = await openIDB();
    const tx = idb.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.put(JSON.stringify(db), 'active_db');
    store.put(JSON.stringify(db), `snapshot_${Date.now()}`);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not save to IndexedDB:', err);
  }
}

export async function loadFromIndexedDB(): Promise<JournalDatabase | null> {
  try {
    const idb = await openIDB();
    const tx = idb.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    const req = store.get('active_db');
    return new Promise((resolve) => {
      req.onsuccess = () => {
        if (req.result && typeof req.result === 'string') {
          try {
            resolve(JSON.parse(req.result) as JournalDatabase);
          } catch {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// Calculate how much real user-written content exists in a database
export function scoreUserData(db: JournalDatabase | null | undefined): number {
  if (!db) return 0;
  let score = 0;

  // Initial starter tasks IDs & titles
  const sampleTaskTitles = [
    "Review today's top priorities & goals",
    'Hydrate & drink fresh water throughout the day',
    'Take a gentle 15-minute stretch or walk',
    'Read an inspiring chapter & unwind before bed',
  ];

  if (Array.isArray(db.tasks)) {
    for (const t of db.tasks) {
      if (t && t.title) {
        if (!sampleTaskTitles.includes(t.title)) {
          score += 10; // Real user task!
        } else {
          score += 1;
        }
      }
    }
  }

  // Initial starter idea titles
  const sampleIdeaTitles = [
    'Welcome to Your Private Daily Planner & Journal! 🎀',
    'Gentle Evening Routine & Creative Calm',
    'ברוכים הבאים ליומן',
    'רעיון לפרויקט חדש',
  ];

  if (Array.isArray(db.ideas)) {
    for (const idea of db.ideas) {
      if (idea && idea.title) {
        const isSample = sampleIdeaTitles.some((s) => idea.title.includes(s));
        if (!isSample) {
          score += 20; // Real user note/idea!
        } else {
          score += 1;
        }
      }
    }
  }

  if (db.dayLogs && typeof db.dayLogs === 'object') {
    for (const dateKey of Object.keys(db.dayLogs)) {
      const log = db.dayLogs[dateKey];
      if (log) {
        if (log.dailyNote || log.dailyThoughts) score += 15;
        if (log.gratitude && !log.gratitude.includes('peaceful start to the day')) score += 10;
        if (log.importantEvents && log.importantEvents.length > 0) score += 10 * log.importantEvents.length;
        if (log.witItems && log.witItems.length > 0) score += 10 * log.witItems.length;
        if (log.middayCheckIn) score += 10;
      }
    }
  }

  if (db.cycleLogs && typeof db.cycleLogs === 'object') {
    const cycleKeys = Object.keys(db.cycleLogs);
    if (cycleKeys.length > 0) {
      score += cycleKeys.length * 5;
    }
  }

  return score;
}

// Deep scanner that scans ALL localStorage and sessionStorage keys for any journal data
export function scanAllStorageForJournals(): CandidateDatabase[] {
  const candidates: CandidateDatabase[] = [];

  function evaluateItem(raw: string | null, key: string, type: CandidateDatabase['sourceType']) {
    if (!raw || typeof raw !== 'string') return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        // Does it look like a journal database?
        const hasTasks = Array.isArray(parsed.tasks);
        const hasIdeas = Array.isArray(parsed.ideas);
        const hasDayLogs = Boolean(parsed.dayLogs && typeof parsed.dayLogs === 'object');
        const hasCycleLogs = Boolean(parsed.cycleLogs && typeof parsed.cycleLogs === 'object');

        if (hasTasks || hasIdeas || hasDayLogs || hasCycleLogs) {
          const validatedDb: JournalDatabase = {
            version: parsed.version || 1,
            tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
            ideas: Array.isArray(parsed.ideas) ? parsed.ideas : [],
            cycleLogs: parsed.cycleLogs || {},
            dayLogs: parsed.dayLogs || {},
            habits: parsed.habits || defaultHabits,
            settings: parsed.settings || defaultSettings,
            lastUpdated: parsed.lastUpdated || Date.now(),
          };

          const score = scoreUserData(validatedDb);
          candidates.push({
            sourceKey: key,
            sourceType: type,
            score,
            taskCount: validatedDb.tasks.length,
            ideaCount: validatedDb.ideas.length,
            dayLogCount: Object.keys(validatedDb.dayLogs).length,
            cycleLogCount: Object.keys(validatedDb.cycleLogs).length,
            lastUpdated: validatedDb.lastUpdated,
            db: validatedDb,
          });
        }
      }
    } catch {
      // not JSON or not a journal, ignore
    }
  }

  // 1. Scan all localStorage keys
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        evaluateItem(localStorage.getItem(key), key, key === VAULT_KEY ? 'vault' : 'localStorage');
      }
    }
  } catch (err) {
    console.warn('Error reading localStorage keys during scan:', err);
  }

  // 2. Scan sessionStorage keys
  try {
    if (typeof sessionStorage !== 'undefined') {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          evaluateItem(sessionStorage.getItem(key), key, 'sessionStorage');
        }
      }
    }
  } catch (err) {
    console.warn('Error reading sessionStorage keys during scan:', err);
  }

  // Sort descending by score, then by lastUpdated
  candidates.sort((a, b) => b.score - a.score || b.lastUpdated - a.lastUpdated);
  return candidates;
}

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

export function formatEnglishDateString(dateStr: string): string {
  const date = parseDateKey(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatHebrewDateString(dateStr: string): string {
  const date = parseDateKey(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export interface ParsedEventItem {
  icon: string;
  title: string;
  recurrence: EventRecurrence;
  originalDate?: string;
  raw: string;
}

export function formatEventItem(
  icon: string,
  title: string,
  recurrence: EventRecurrence = 'none',
  originalDate?: string
): string {
  const cleanTitle = title.replace(/\s*@@repeat:[^ ]+/g, '').trim();
  if (recurrence && recurrence !== 'none') {
    const dateSuffix = originalDate ? `@${originalDate}` : '';
    return `${icon} ${cleanTitle} @@repeat:${recurrence}${dateSuffix}`;
  }
  return `${icon} ${cleanTitle}`;
}

// Helper to extract event icon, clean title and recurrence from raw event string
export function parseEventItem(raw: string): ParsedEventItem {
  if (!raw) return { icon: '✦', title: '', recurrence: 'none', raw: '' };

  let working = raw.trim();
  let recurrence: EventRecurrence = 'none';
  let originalDate: string | undefined = undefined;

  // Extract recurrence tag if present: e.g. @@repeat:yearly-gregorian@2026-10-15
  const repeatRegex = /\s*@@repeat:(yearly-gregorian|yearly-hebrew)(?:@(\d{4}-\d{2}-\d{2}))?$/;
  const repeatMatch = working.match(repeatRegex);
  if (repeatMatch) {
    recurrence = repeatMatch[1] as EventRecurrence;
    originalDate = repeatMatch[2];
    working = working.slice(0, repeatMatch.index).trim();
  }

  // 1. Leading emoji: e.g. "🎂 Maya's Birthday" or "✈️ Flight"
  const leadingEmojiRegex = /^([\p{Extended_Pictographic}\u200D\uFE0F\u20E3\uD83C\uDFFB-\uD83C\uDFFF]+)\s*/u;
  const leadMatch = working.match(leadingEmojiRegex);
  if (leadMatch) {
    const icon = leadMatch[1];
    const title = working.slice(leadMatch[0].length).trim();
    return { icon, title: title || working, recurrence, originalDate, raw };
  }

  // 2. Trailing emoji: e.g. "Maya's Birthday 🎂" or "Dentist 14:00 🦷"
  const trailingEmojiRegex = /\s*([\p{Extended_Pictographic}\u200D\uFE0F\u20E3\uD83C\uDFFB-\uD83C\uDFFF]+)$/u;
  const trailMatch = working.match(trailingEmojiRegex);
  if (trailMatch && trailMatch.index !== undefined) {
    const icon = trailMatch[1];
    const title = working.slice(0, trailMatch.index).trim();
    return { icon, title: title || working, recurrence, originalDate, raw };
  }

  return { icon: '✦', title: working, recurrence, originalDate, raw };
}

export interface DayEventItem {
  evt: string;
  parsed: ParsedEventItem;
  isRecurringInstance: boolean;
  originalDate: string;
}

export function getEventsForDate(
  targetDateKey: string,
  dayLogs: Record<string, DayLog>
): DayEventItem[] {
  if (!dayLogs) return [];
  const result: DayEventItem[] = [];
  const directEvents = dayLogs[targetDateKey]?.importantEvents || [];

  for (const raw of directEvents) {
    const parsed = parseEventItem(raw);
    result.push({
      evt: raw,
      parsed,
      isRecurringInstance: false,
      originalDate: parsed.originalDate || targetDateKey,
    });
  }

  // Check recurring events from other dates
  const targetDate = parseDateKey(targetDateKey);
  const targetMonthDay = targetDateKey.slice(5); // "MM-DD"

  for (const [sourceDateKey, log] of Object.entries(dayLogs)) {
    if (sourceDateKey === targetDateKey) continue;
    const events = log?.importantEvents || [];
    for (const raw of events) {
      const parsed = parseEventItem(raw);
      if (parsed.recurrence === 'yearly-gregorian') {
        const sourceMonthDay = (parsed.originalDate || sourceDateKey).slice(5);
        if (sourceMonthDay === targetMonthDay) {
          if (!result.some((r) => r.parsed.title === parsed.title && r.parsed.icon === parsed.icon)) {
            result.push({
              evt: raw,
              parsed,
              isRecurringInstance: true,
              originalDate: parsed.originalDate || sourceDateKey,
            });
          }
        }
      } else if (parsed.recurrence === 'yearly-hebrew') {
        const sourceDate = parseDateKey(parsed.originalDate || sourceDateKey);
        if (isSameHebrewDayAndMonth(sourceDate, targetDate)) {
          if (!result.some((r) => r.parsed.title === parsed.title && r.parsed.icon === parsed.icon)) {
            result.push({
              evt: raw,
              parsed,
              isRecurringInstance: true,
              originalDate: parsed.originalDate || sourceDateKey,
            });
          }
        }
      }
    }
  }

  return result;
}

export function getEventStringsForDate(
  targetDateKey: string,
  dayLogs: Record<string, DayLog>
): string[] {
  return getEventsForDate(targetDateKey, dayLogs).map((item) => item.evt);
}

const defaultHabits: Habit[] = [
  { id: 'water', name: 'Water Intake', icon: '💧', targetPerDay: 8, unit: 'glasses' },
  { id: 'reading', name: 'Reading & Learning', icon: '📖', targetPerDay: 1, unit: 'chapter/time' },
  { id: 'walk', name: 'Gentle Walk & Movement', icon: '👟', targetPerDay: 1, unit: 'walk' },
  { id: 'mindfulness', name: 'Mindfulness & Breathing', icon: '✨', targetPerDay: 1, unit: 'session' },
];

const defaultSettings: AppSettings = {
  theme: 'rose',
  enableCycleTracker: true,
  cycleDiscreteMode: true,
  averageCycleLength: 28,
  averagePeriodLength: 5,
  isPinLocked: false,
  pinCode: '2006',
  autoLockMinutes: 20,
  userDisplayName: 'My Planner',
  soundAlertsEnabled: true,
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
      category: 'Personal',
      time: '09:00',
      createdAt: Date.now() - 3600000,
    },
    {
      id: 'task-2',
      date: today,
      title: 'Hydrate & drink fresh water throughout the day',
      completed: false,
      priority: 'high',
      category: 'Personal',
      time: '11:00',
      createdAt: Date.now() - 2400000,
    },
    {
      id: 'task-3',
      date: today,
      title: 'Take a gentle 15-minute stretch or walk',
      completed: false,
      priority: 'medium',
      category: 'Health',
      time: '14:00',
      createdAt: Date.now() - 1200000,
    },
    {
      id: 'task-4',
      date: today,
      title: 'Read an inspiring chapter & unwind before bed',
      completed: false,
      priority: 'low',
      category: 'Personal',
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
      symptoms: i === 1 ? ['Cramps', 'Fatigue'] : ['Tender'],
      notes: i === 1 ? 'Gentle first day, resting with a cozy hot water bottle' : '',
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

export function getAutomaticSnapshots(): StorageSnapshot[] {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StorageSnapshot[];
  } catch {
    return [];
  }
}

function recordSnapshot(db: JournalDatabase, description: string = 'Auto-Save'): void {
  try {
    const snapshots = getAutomaticSnapshots();
    const newSnapshot: StorageSnapshot = {
      id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      dateStr: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      taskCount: db.tasks.length,
      ideaCount: db.ideas.length,
      dayLogCount: Object.keys(db.dayLogs || {}).length,
      cycleLogCount: Object.keys(db.cycleLogs || {}).length,
      description,
      data: db,
    };
    // Keep max 10 recent snapshots
    const updated = [newSnapshot, ...snapshots.slice(0, 9)];
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not record snapshot:', err);
  }
}

export function loadJournalDatabase(): JournalDatabase {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    let parsed: JournalDatabase | null = null;

    if (raw) {
      try {
        parsed = JSON.parse(raw) as JournalDatabase;
      } catch (parseErr) {
        console.error('Failed to parse STORAGE_KEY, saving corrupt text to vault:', parseErr);
        try {
          localStorage.setItem(CORRUPTED_BACKUP_KEY, raw);
        } catch {
          // ignore
        }
      }
    }

    // If current active DB has no user data (or is missing), check if we have older candidate databases in localStorage/sessionStorage
    const currentScore = scoreUserData(parsed);
    if (currentScore <= 0) {
      const candidates = scanAllStorageForJournals();
      const bestCandidate = candidates.find((c) => c.score > 0);
      if (bestCandidate) {
        console.info(`Found previous user journal in '${bestCandidate.sourceKey}' with score ${bestCandidate.score}. Auto-recovering!`);
        parsed = bestCandidate.db;
        // Resave to primary storage key so it stays permanently active
        saveJournalDatabase(parsed);
      }
    }

    if (!parsed) {
      const embedded = (window as unknown as { __STANDALONE_EMBEDDED_DATA__?: JournalDatabase }).__STANDALONE_EMBEDDED_DATA__;
      const initial = embedded || createInitialDatabase();
      saveJournalDatabase(initial);
      return initial;
    }

    // ensure migrations or missing fields
    if (!parsed.settings) parsed.settings = defaultSettings;
    if (!parsed.settings.pinCode || parsed.settings.pinCode === '1234') {
      parsed.settings.pinCode = '2006';
    }
    if (!parsed.settings.userDisplayName || parsed.settings.userDisplayName === 'יומני המלכותי' || parsed.settings.userDisplayName === 'My Daily Planner') {
      parsed.settings.userDisplayName = 'My Planner';
    }
    if (!parsed.habits) parsed.habits = defaultHabits;
    if (!parsed.cycleLogs) parsed.cycleLogs = {};
    if (!parsed.dayLogs) parsed.dayLogs = {};
    if (!parsed.tasks) parsed.tasks = [];
    if (!parsed.ideas) parsed.ideas = [];

    return parsed;
  } catch (err) {
    console.error('Failed to read from localStorage:', err);
    // Before returning initial, check if vault has data
    try {
      const vaultRaw = localStorage.getItem(VAULT_KEY);
      if (vaultRaw) {
        const vaultDb = JSON.parse(vaultRaw) as JournalDatabase;
        if (scoreUserData(vaultDb) > 0) return vaultDb;
      }
    } catch {
      // ignore
    }
    return createInitialDatabase();
  }
}

export function saveJournalDatabase(db: JournalDatabase): void {
  try {
    db.lastUpdated = Date.now();
    const jsonStr = JSON.stringify(db);
    localStorage.setItem(STORAGE_KEY, jsonStr);

    const userScore = scoreUserData(db);
    // If the database has real user content, protect it aggressively in the emergency vault & snapshots & IndexedDB
    if (userScore > 0) {
      localStorage.setItem(VAULT_KEY, jsonStr);
      recordSnapshot(db, `Auto-saved (${db.tasks.length} tasks, ${db.ideas.length} notes)`);
    }

    // Also persist asynchronously to IndexedDB
    saveToIndexedDB(db).catch(() => {});
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
    // If localStorage quota exceeded, try to still save into IndexedDB
    saveToIndexedDB(db).catch(() => {});
  }
}

export async function copyDatabaseToClipboard(db: JournalDatabase): Promise<boolean> {
  try {
    const payload = JSON.stringify({
      appName: 'MyRoyalJournalBackup',
      version: db.version || 1,
      exportedAt: Date.now(),
      database: db,
    });
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(payload);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error copying to clipboard:', err);
    return false;
  }
}

export function importDatabaseFromText(text: string): JournalDatabase {
  if (!text || !text.trim()) {
    throw new Error('הטקסט שהוזן ריק');
  }
  const clean = text.trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error('פורמט לא תקין. יש לוודא שהעתקת את כל נתוני היומן במלואם');
  }

  // Check if wrapped in payload
  let targetDb: unknown = parsed;
  if (parsed && typeof parsed === 'object' && 'database' in parsed) {
    targetDb = (parsed as { database: unknown }).database;
  }

  if (!targetDb || typeof targetDb !== 'object') {
    throw new Error('מבנה נתוני היומן לא מזוהה');
  }

  const rawDb = targetDb as Partial<JournalDatabase>;
  if (!Array.isArray(rawDb.tasks) && !Array.isArray(rawDb.ideas) && !rawDb.dayLogs) {
    throw new Error('הקובץ אינו מכיל משימות, רעיונות או רשומות יומן');
  }

  const completeDb: JournalDatabase = {
    version: rawDb.version || 1,
    tasks: Array.isArray(rawDb.tasks) ? rawDb.tasks : [],
    ideas: Array.isArray(rawDb.ideas) ? rawDb.ideas : [],
    cycleLogs: rawDb.cycleLogs || {},
    dayLogs: rawDb.dayLogs || {},
    habits: rawDb.habits || defaultHabits,
    settings: rawDb.settings || defaultSettings,
    lastUpdated: Date.now(),
  };

  return completeDb;
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

export async function exportStandaloneHtmlFile(db: JournalDatabase): Promise<void> {
  let template = '';
  try {
    const res = await fetch('/standalone-planner.html');
    if (res.ok) {
      template = await res.text();
    }
  } catch (err) {
    console.warn('Could not fetch /standalone-planner.html', err);
  }

  if (!template) {
    throw new Error('Standalone template is currently preparing. Please try again in a moment or use the JSON backup file.');
  }

  // Embed database into template
  const embeddedDataStr = JSON.stringify(db).replace(/<\/script>/gi, '<\\/script>');
  const injectedScript = `<script>window.__STANDALONE_EMBEDDED_DATA__ = ${embeddedDataStr};</script>`;

  const finalHtml = template.replace('</head>', `${injectedScript}</head>`);

  const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const dateStr = formatDateKey(new Date());

  const link = document.createElement('a');
  link.href = url;
  link.download = `My_Planner_Standalone_${dateStr}.html`;
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
          throw new Error('Invalid backup file');
        }
        // Minimal integrity check
        if (!Array.isArray(parsed.tasks) && !Array.isArray(parsed.ideas)) {
          throw new Error('Unrecognized journal backup structure');
        }
        resolve(parsed as JournalDatabase);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file from computer'));
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
