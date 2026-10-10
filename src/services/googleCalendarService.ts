import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { DayLog, JournalDatabase } from '../types';
import { parseEventItem } from './storage';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Google Calendar Events scope
provider.addScope('https://www.googleapis.com/auth/calendar.events');

// In-memory token cache (NEVER in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Offline queue storage keys (non-sensitive sync records)
const GCAL_QUEUE_KEY = 'gcal_offline_queue_v1';
const GCAL_EVENT_MAP_KEY = 'gcal_synced_events_map_v1';
const GCAL_AUTO_SYNC_KEY = 'gcal_auto_sync_enabled';

export interface QueuedCalendarAction {
  id: string;
  action: 'insert' | 'update' | 'delete';
  date: string; // YYYY-MM-DD
  title: string;
  rawEventText: string;
  googleEventId?: string;
  createdAt: number;
  retryCount: number;
}

export type QueueListener = (queueCount: number, isSyncing: boolean, lastSyncMsg?: string) => void;
const queueListeners: Set<QueueListener> = new Set();

export function subscribeQueueChanges(listener: QueueListener): () => void {
  queueListeners.add(listener);
  listener(getOfflineQueue().length, isSyncingQueue);
  return () => {
    queueListeners.delete(listener);
  };
}

function notifyQueueListeners(msg?: string) {
  const count = getOfflineQueue().length;
  queueListeners.forEach((fn) => fn(count, isSyncingQueue, msg));
}

// Memory tracking of sync state
let isSyncingQueue = false;

// Auth listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
        // Process offline queue once authenticated
        processOfflineQueue();
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
    notifyQueueListeners();
  });
};

// Sign in with Google (Google Calendar scope)
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not retrieve access token from Google sign in');
    }
    cachedAccessToken = credential.accessToken;
    // Trigger offline queue sync once signed in
    setTimeout(() => {
      processOfflineQueue();
    }, 500);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
    notifyQueueListeners();
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const isCalendarConnected = (): boolean => {
  return !!auth.currentUser && !!cachedAccessToken;
};

export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
  notifyQueueListeners('Signed out of Google Calendar');
};

// Auto-sync setting preference
export function isAutoSyncEnabled(): boolean {
  const val = localStorage.getItem(GCAL_AUTO_SYNC_KEY);
  return val === null ? true : val === 'true'; // default enabled
}

export function setAutoSyncEnabled(enabled: boolean): void {
  localStorage.setItem(GCAL_AUTO_SYNC_KEY, String(enabled));
}

// Synced events map: local key -> Google Calendar Event ID
export function getEventMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(GCAL_EVENT_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveEventMap(map: Record<string, string>): void {
  try {
    localStorage.setItem(GCAL_EVENT_MAP_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function makeEventKey(date: string, title: string): string {
  return `${date}__${title.trim().toLowerCase()}`;
}

// Offline Queue helpers
export function getOfflineQueue(): QueuedCalendarAction[] {
  try {
    const raw = localStorage.getItem(GCAL_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOfflineQueue(queue: QueuedCalendarAction[]): void {
  try {
    localStorage.setItem(GCAL_QUEUE_KEY, JSON.stringify(queue));
    notifyQueueListeners();
  } catch {
    // ignore
  }
}

export function enqueueCalendarAction(
  action: 'insert' | 'update' | 'delete',
  date: string,
  title: string,
  rawEventText: string,
  googleEventId?: string
): QueuedCalendarAction {
  const queue = getOfflineQueue();
  const item: QueuedCalendarAction = {
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    action,
    date,
    title,
    rawEventText,
    googleEventId,
    createdAt: Date.now(),
    retryCount: 0,
  };
  queue.push(item);
  saveOfflineQueue(queue);
  notifyQueueListeners('Action queued offline');
  return item;
}

// Compute next day string for Google Calendar all-day event end date
function getNextDay(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return dateStr;
  }
}

// Core Google Calendar API calls
export async function createGoogleCalendarEvent(
  date: string,
  title: string,
  icon?: string
): Promise<{ id: string }> {
  const token = cachedAccessToken;
  if (!token) throw new Error('Not authenticated with Google');

  const summary = icon && icon !== '✦' ? `${icon} ${title}` : title;
  const nextDay = getNextDay(date);

  const payload = {
    summary,
    description: `Important event saved in My Planner\nDate: ${date}`,
    start: {
      date: date,
    },
    end: {
      date: nextDay,
    },
    transparency: 'transparent', // shows as free or busy, doesn't block whole day
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Google Calendar API error: ${res.status}`);
  }

  const data = await res.json();
  return { id: data.id };
}

export async function updateGoogleCalendarEvent(
  googleEventId: string,
  date: string,
  title: string,
  icon?: string
): Promise<void> {
  const token = cachedAccessToken;
  if (!token) throw new Error('Not authenticated with Google');

  const summary = icon && icon !== '✦' ? `${icon} ${title}` : title;
  const nextDay = getNextDay(date);

  const payload = {
    summary,
    start: {
      date: date,
    },
    end: {
      date: nextDay,
    },
  };

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Google Calendar API error: ${res.status}`);
  }
}

export async function deleteGoogleCalendarEvent(googleEventId: string): Promise<void> {
  const token = cachedAccessToken;
  if (!token) throw new Error('Not authenticated with Google');

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  // 404 or 410 is already gone, consider success
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Google Calendar API error: ${res.status}`);
  }
}

// Process the offline queue when online and authenticated
export async function processOfflineQueue(): Promise<{ processed: number; remaining: number }> {
  if (isSyncingQueue) return { processed: 0, remaining: getOfflineQueue().length };
  if (!navigator.onLine || !cachedAccessToken) {
    return { processed: 0, remaining: getOfflineQueue().length };
  }

  isSyncingQueue = true;
  notifyQueueListeners('Syncing with Google Calendar...');

  const queue = getOfflineQueue();
  if (queue.length === 0) {
    isSyncingQueue = false;
    notifyQueueListeners();
    return { processed: 0, remaining: 0 };
  }

  const map = getEventMap();
  const remainingQueue: QueuedCalendarAction[] = [];
  let processedCount = 0;

  for (const item of queue) {
    try {
      const key = makeEventKey(item.date, item.title);
      const parsed = parseEventItem(item.rawEventText);

      if (item.action === 'insert') {
        const { id } = await createGoogleCalendarEvent(item.date, item.title, parsed.icon);
        map[key] = id;
        processedCount++;
      } else if (item.action === 'update') {
        const eventId = item.googleEventId || map[key];
        if (eventId) {
          await updateGoogleCalendarEvent(eventId, item.date, item.title, parsed.icon);
        } else {
          // If not created yet, create it
          const { id } = await createGoogleCalendarEvent(item.date, item.title, parsed.icon);
          map[key] = id;
        }
        processedCount++;
      } else if (item.action === 'delete') {
        const eventId = item.googleEventId || map[key];
        if (eventId) {
          await deleteGoogleCalendarEvent(eventId);
          delete map[key];
        }
        processedCount++;
      }
    } catch (err: any) {
      console.warn('Queue item sync failed:', item, err);
      // If network error, keep in queue
      if (!navigator.onLine || err?.message?.includes('network') || err?.message?.includes('Failed to fetch')) {
        item.retryCount = (item.retryCount || 0) + 1;
        remainingQueue.push(item);
      } else {
        // Fatal error or already resolved, drop item after 3 tries
        if (item.retryCount < 3) {
          item.retryCount++;
          remainingQueue.push(item);
        }
      }
    }
  }

  saveEventMap(map);
  saveOfflineQueue(remainingQueue);
  isSyncingQueue = false;

  const msg = processedCount > 0 
    ? `Synced ${processedCount} event(s) to Google Calendar! 🌸` 
    : undefined;
  notifyQueueListeners(msg);

  return { processed: processedCount, remaining: remainingQueue.length };
}

// User-facing sync dispatcher for newly added / edited / removed important events
export async function syncEventAction(
  action: 'insert' | 'update' | 'delete',
  date: string,
  rawEventText: string,
  oldTitle?: string
): Promise<{ status: 'synced' | 'queued' | 'skipped'; message: string }> {
  const parsed = parseEventItem(rawEventText);
  const title = parsed.title;
  const map = getEventMap();
  const key = makeEventKey(date, title);
  const oldKey = oldTitle ? makeEventKey(date, oldTitle) : key;
  const existingGoogleId = map[key] || (oldTitle ? map[oldKey] : undefined);

  // If user disabled auto-sync and is not signed in
  if (!isAutoSyncEnabled()) {
    return { status: 'skipped', message: 'Auto-sync is disabled' };
  }

  const isOnline = navigator.onLine;
  const isAuth = !!cachedAccessToken;

  // If offline or not signed in, queue action
  if (!isOnline || !isAuth) {
    enqueueCalendarAction(action, date, title, rawEventText, existingGoogleId);
    return {
      status: 'queued',
      message: isOnline
        ? 'Sign in to Google to sync events with your calendar'
        : 'Saved offline. Will sync to Google Calendar once connected ⏳',
    };
  }

  // Online and signed in: execute directly
  try {
    if (action === 'insert') {
      const { id } = await createGoogleCalendarEvent(date, title, parsed.icon);
      map[key] = id;
      saveEventMap(map);
      return { status: 'synced', message: 'Synced to Google Calendar ✨' };
    } else if (action === 'update') {
      if (existingGoogleId) {
        await updateGoogleCalendarEvent(existingGoogleId, date, title, parsed.icon);
        if (oldKey !== key) {
          delete map[oldKey];
          map[key] = existingGoogleId;
          saveEventMap(map);
        }
        return { status: 'synced', message: 'Updated on Google Calendar ✨' };
      } else {
        const { id } = await createGoogleCalendarEvent(date, title, parsed.icon);
        map[key] = id;
        saveEventMap(map);
        return { status: 'synced', message: 'Created in Google Calendar ✨' };
      }
    } else if (action === 'delete') {
      if (existingGoogleId) {
        await deleteGoogleCalendarEvent(existingGoogleId);
        delete map[key];
        if (oldKey !== key) delete map[oldKey];
        saveEventMap(map);
        return { status: 'synced', message: 'Removed from Google Calendar' };
      }
      return { status: 'synced', message: 'Removed' };
    }
    return { status: 'synced', message: 'Done' };
  } catch (err: any) {
    console.error('Direct sync failed, falling back to queue:', err);
    enqueueCalendarAction(action, date, title, rawEventText, existingGoogleId);
    return {
      status: 'queued',
      message: 'Network issue. Queued to sync once connection stabilizes ⏳',
    };
  }
}

// Move events from oldDate to newDate in Google Calendar & offline queue
export async function syncMoveEvents(
  oldDate: string,
  newDate: string,
  eventTexts: string[]
): Promise<{ movedCount: number; message: string }> {
  if (!eventTexts || eventTexts.length === 0) {
    return { movedCount: 0, message: '' };
  }

  const map = getEventMap();
  let movedCount = 0;

  for (const raw of eventTexts) {
    const parsed = parseEventItem(raw);
    const title = parsed.title;
    if (!title) continue;

    const oldKey = makeEventKey(oldDate, title);
    const newKey = makeEventKey(newDate, title);
    const existingGoogleId = map[oldKey];

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;
    const isAuth = !!cachedAccessToken;

    if (existingGoogleId) {
      if (isOnline && isAuth) {
        try {
          await updateGoogleCalendarEvent(existingGoogleId, newDate, title, parsed.icon);
          delete map[oldKey];
          map[newKey] = existingGoogleId;
          saveEventMap(map);
          movedCount++;
        } catch (err) {
          console.warn('Failed to move event directly on Google Calendar:', err);
          enqueueCalendarAction('update', newDate, title, raw, existingGoogleId);
          delete map[oldKey];
          map[newKey] = existingGoogleId;
          saveEventMap(map);
        }
      } else {
        // Offline or unauthenticated: queue update to new date
        enqueueCalendarAction('update', newDate, title, raw, existingGoogleId);
        delete map[oldKey];
        map[newKey] = existingGoogleId;
        saveEventMap(map);
      }
    } else {
      // If not in map yet, queue or insert it for newDate
      if (isAutoSyncEnabled()) {
        if (isOnline && isAuth) {
          try {
            const { id } = await createGoogleCalendarEvent(newDate, title, parsed.icon);
            map[newKey] = id;
            saveEventMap(map);
            movedCount++;
          } catch (err) {
            enqueueCalendarAction('insert', newDate, title, raw);
          }
        } else {
          enqueueCalendarAction('insert', newDate, title, raw);
        }
      }
    }
  }

  const msg = movedCount > 0
    ? `Moved ${movedCount} event(s) to ${newDate} in Google Calendar ✨`
    : 'Events moved. Offline queue updated for Google Calendar ⏳';
  notifyQueueListeners(msg);
  return { movedCount, message: msg };
}

// Bulk sync all existing important events from planner to Google Calendar
export async function pushAllImportantEventsToCalendar(
  database: JournalDatabase
): Promise<{ total: number; synced: number; queued: number }> {
  const eventsToSync: { date: string; raw: string }[] = [];

  for (const [date, log] of Object.entries(database.dayLogs || {})) {
    if (log?.importantEvents && log.importantEvents.length > 0) {
      for (const raw of log.importantEvents) {
        eventsToSync.push({ date, raw });
      }
    }
  }

  let synced = 0;
  let queued = 0;

  for (const item of eventsToSync) {
    const res = await syncEventAction('insert', item.date, item.raw);
    if (res.status === 'synced') synced++;
    else if (res.status === 'queued') queued++;
  }

  return { total: eventsToSync.length, synced, queued };
}

// Global online listener to auto-trigger queue
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[Google Calendar] Back online! Processing queue...');
    processOfflineQueue();
  });
}
