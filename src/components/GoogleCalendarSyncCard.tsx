import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  RefreshCw, 
  CheckCircle2, 
  WifiOff, 
  Wifi, 
  LogOut, 
  Send,
  AlertCircle 
} from 'lucide-react';
import { 
  auth, 
  googleSignIn, 
  googleSignOut, 
  getAccessToken, 
  subscribeQueueChanges, 
  processOfflineQueue, 
  isAutoSyncEnabled, 
  setAutoSyncEnabled, 
  pushAllImportantEventsToCalendar,
  QueuedCalendarAction,
  getOfflineQueue
} from '../services/googleCalendarService';
import { JournalDatabase } from '../types';
import { User } from 'firebase/auth';

interface GoogleCalendarSyncCardProps {
  database: JournalDatabase;
  onShowMessage?: (msg: string) => void;
}

export const GoogleCalendarSyncCard: React.FC<GoogleCalendarSyncCardProps> = ({
  database,
  onShowMessage,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [hasToken, setHasToken] = useState<boolean>(!!getAccessToken());
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [queueCount, setQueueCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [autoSync, setAutoSync] = useState<boolean>(isAutoSyncEnabled());
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isBulkSyncing, setIsBulkSyncing] = useState<boolean>(false);

  useEffect(() => {
    // Monitor online/offline state
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Auth state listener
    const unsubAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setHasToken(!!getAccessToken());
    });

    // Queue subscription
    const unsubQueue = subscribeQueueChanges((count, syncing, msg) => {
      setQueueCount(count);
      setIsSyncing(syncing);
      if (msg) {
        setStatusMessage(msg);
        setTimeout(() => setStatusMessage(null), 4000);
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubAuth();
      unsubQueue();
    };
  }, []);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setHasToken(true);
        setStatusMessage('Connected to Google Calendar! 🌸');
        onShowMessage?.('Connected to Google Calendar! 🌸');
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setStatusMessage(err?.message || 'Failed to sign in to Google');
    } finally {
      setIsLoggingIn(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleSignOut();
      setCurrentUser(null);
      setHasToken(false);
      setStatusMessage('Disconnected from Google Calendar');
      onShowMessage?.('Disconnected from Google Calendar');
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAutoSync = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setAutoSync(val);
    setAutoSyncEnabled(val);
  };

  const handleManualSyncNow = async () => {
    if (!hasToken) {
      await handleSignIn();
      return;
    }
    setIsSyncing(true);
    try {
      const res = await processOfflineQueue();
      if (res.processed > 0) {
        setStatusMessage(`Successfully synced ${res.processed} event(s)! ✨`);
      } else if (res.remaining > 0) {
        setStatusMessage(`${res.remaining} event(s) waiting in queue`);
      } else {
        setStatusMessage('All events are up to date! 🌸');
      }
    } catch (err: any) {
      setStatusMessage('Sync failed. Please check internet connection.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handlePushAllEvents = async () => {
    if (!hasToken) {
      await handleSignIn();
      return;
    }
    setIsBulkSyncing(true);
    try {
      const res = await pushAllImportantEventsToCalendar(database);
      setStatusMessage(`Synced ${res.synced} events to Google Calendar! (Queued: ${res.queued}) 🌸`);
    } catch (err: any) {
      setStatusMessage(err?.message || 'Error exporting to Google Calendar');
    } finally {
      setIsBulkSyncing(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const isConnected = !!currentUser && hasToken;

  return (
    <div className="p-3.5 rounded-2xl bg-sky-50/50 border border-sky-200/90 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-white border border-sky-200 text-sky-600 shadow-2xs">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-sky-950 flex items-center gap-1.5">
              <span>Google Calendar Sync</span>
              {isConnected ? (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Connected
                </span>
              ) : (
                <span className="text-[10px] bg-stone-100 text-stone-600 font-medium px-2 py-0.5 rounded-full border border-stone-200">
                  Not Connected
                </span>
              )}
            </h4>
          </div>
        </div>

        {/* Network indicator */}
        <div className="flex items-center gap-1 text-[11px] font-medium text-stone-500">
          {isOnline ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
              <Wifi className="w-3 h-3 text-emerald-600" />
              <span>Online</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
              <WifiOff className="w-3 h-3 text-amber-600" />
              <span>Offline</span>
            </span>
          )}
        </div>
      </div>

      {/* Description / Instructions */}
      <p className="text-[11px] text-sky-900 leading-relaxed">
        Automatically push your important events & occasions to Google Calendar. When offline, all changes are saved in a local queue and synced the instant your connection returns.
      </p>

      {/* Connection State / Button */}
      {isConnected ? (
        <div className="p-2.5 rounded-xl bg-white border border-sky-200/80 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Profile"
                className="w-7 h-7 rounded-full border border-sky-200 shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center shrink-0">
                {currentUser?.email?.[0]?.toUpperCase() || 'G'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-sky-950 truncate">
                {currentUser?.displayName || 'Google Account'}
              </p>
              <p className="text-[10px] text-stone-500 truncate">{currentUser?.email}</p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
            title="Disconnect Google Calendar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Official Google Sign-in Button Style */
        <button
          onClick={handleSignIn}
          disabled={isLoggingIn}
          className="w-full py-2 px-3 rounded-xl bg-white hover:bg-sky-50/50 border border-sky-200 text-stone-700 text-xs font-semibold shadow-2xs transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          <span>{isLoggingIn ? 'Connecting to Google...' : 'Sign in with Google to Sync Calendar'}</span>
        </button>
      )}

      {/* Auto-sync & Offline Queue Bar */}
      <div className="space-y-2 pt-1 border-t border-sky-200/60">
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-sky-950 font-medium">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={handleToggleAutoSync}
              className="accent-sky-600 w-3.5 h-3.5 rounded"
            />
            <span>Auto-sync when saving events</span>
          </label>

          {queueCount > 0 && (
            <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-200 inline-flex items-center gap-1">
              <span>⏳</span>
              <span>{queueCount} queued offline</span>
            </span>
          )}
        </div>

        {/* Sync actions row */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleManualSyncNow}
            disabled={isSyncing}
            className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-sky-50 border border-sky-200 text-sky-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Queue Now'}</span>
          </button>

          <button
            onClick={handlePushAllEvents}
            disabled={isBulkSyncing}
            className="py-1.5 px-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-60"
            title="Upload all important events from this planner to Google Calendar"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isBulkSyncing ? 'Uploading...' : 'Push All Events'}</span>
          </button>
        </div>
      </div>

      {/* Feedback status message */}
      {statusMessage && (
        <div className="p-2 rounded-xl bg-sky-100/80 text-sky-950 text-[11px] font-bold text-center border border-sky-200 animate-in fade-in">
          {statusMessage}
        </div>
      )}
    </div>
  );
};
