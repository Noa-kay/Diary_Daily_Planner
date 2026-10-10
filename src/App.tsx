/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  JournalDatabase, 
  BookView, 
  Task, 
  IdeaEntry, 
  CycleDayLog, 
  DayLog, 
  AppTheme,
  AppSettings
} from './types';
import { 
  loadJournalDatabase, 
  saveJournalDatabase, 
  formatDateKey 
} from './services/storage';
import { BookContainer } from './components/BookContainer';
import { MonthlyBookSpread } from './components/MonthlyBookSpread';
import { DayBookPage } from './components/DayBookPage';
import { IdeasJournal } from './components/IdeasJournal';
import { CycleTracker } from './components/CycleTracker';
import { JokesDigest } from './components/JokesDigest';
import { BackupModal } from './components/BackupModal';
import { RecoveryModal } from './components/RecoveryModal';
import { SettingsModal } from './components/SettingsModal';
import { PinLockScreen, PinSettingsModal } from './components/PinLockModal';
import { PlannerCover } from './components/PlannerCover';
import { useTimeReminders } from './hooks/useTimeReminders';
import { useInactivityLock } from './hooks/useInactivityLock';
import { ReminderChimeAlert } from './components/ReminderChimeAlert';
import { scoreUserData } from './services/storage';

export default function App() {
  const [db, setDb] = useState<JournalDatabase>(() => loadJournalDatabase());
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateKey(new Date()));
  // The home view is the Monthly Book Spread, as requested!
  const [currentView, setCurrentView] = useState<BookView>('calendar');
  const [showCover, setShowCover] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPinSettingsOpen, setIsPinSettingsOpen] = useState(false);
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return Boolean(db.settings?.pinCode && db.settings?.isPinLocked);
  });

  // Auto-lock after 20 minutes of inactivity (redirect to cover page with code)
  const autoLockMinutes = db.settings?.autoLockMinutes ?? 20;
  const isCurrentlyLocked = Boolean((isLocked && db.settings?.pinCode) || showCover);

  useInactivityLock({
    timeoutMinutes: autoLockMinutes,
    enabled: !isCurrentlyLocked && autoLockMinutes > 0,
    onLock: () => {
      if (db.settings?.pinCode) {
        setIsLocked(true);
        handleUpdateSettings({ isPinLocked: true });
        setShowCover(true);
      } else {
        setShowCover(true);
      }
    },
  });

  const soundEnabled = db.settings?.soundAlertsEnabled !== false;
  const { activeAlert, dismissAlert, muteReminder, triggerTestSound } = useTimeReminders(
    db.tasks,
    db.dayLogs,
    soundEnabled
  );

  // Automatically persist to localStorage
  useEffect(() => {
    saveJournalDatabase(db);
  }, [db]);

  // When clicking on a day in the monthly spread: open that day's page!
  const handleSelectDayAndOpenPage = (dateStr: string) => {
    setSelectedDate(dateStr);
    setCurrentView('day');
  };

  // Task Handlers
  const handleAddTask = (newTask: Omit<Task, 'id' | 'createdAt'>) => {
    const task: Task = {
      ...newTask,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
    };
    setDb((prev) => ({
      ...prev,
      tasks: [task, ...prev.tasks],
    }));
  };

  const handleToggleTask = (taskId: string) => {
    setDb((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ),
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    setDb((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
    }));
  };

  const handleCarryOverTasks = (fromDate: string, toDate: string) => {
    setDb((prev) => {
      const unfinished = prev.tasks.filter((t) => t.date === fromDate && !t.completed);
      const cloned = unfinished.map((t) => ({
        ...t,
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        date: toDate,
        createdAt: Date.now(),
      }));
      return {
        ...prev,
        tasks: [...cloned, ...prev.tasks],
      };
    });
    setSelectedDate(toDate);
  };

  // Idea Handlers
  const handleAddIdea = (newIdea: Omit<IdeaEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const entry: IdeaEntry = {
      ...newIdea,
      id: `idea-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setDb((prev) => ({
      ...prev,
      ideas: [entry, ...prev.ideas],
    }));
  };

  const handleUpdateIdea = (id: string, partial: Partial<IdeaEntry>) => {
    setDb((prev) => ({
      ...prev,
      ideas: prev.ideas.map((i) => (i.id === id ? { ...i, ...partial, updatedAt: Date.now() } : i)),
    }));
  };

  const handleDeleteIdea = (id: string) => {
    setDb((prev) => ({
      ...prev,
      ideas: prev.ideas.filter((i) => i.id !== id),
    }));
  };

  const handleTogglePinIdea = (id: string) => {
    setDb((prev) => ({
      ...prev,
      ideas: prev.ideas.map((i) => (i.id === id ? { ...i, pinned: !i.pinned } : i)),
    }));
  };

  // Day Log Handlers
  const handleUpdateDayLog = (date: string, partial: Partial<DayLog>) => {
    setDb((prev) => {
      const current = prev.dayLogs[date] || { date };
      return {
        ...prev,
        dayLogs: {
          ...prev.dayLogs,
          [date]: { ...current, ...partial },
        },
      };
    });
  };

  // Cycle Log Handlers
  const handleUpdateCycleLog = (date: string, partial: Partial<CycleDayLog>) => {
    setDb((prev) => {
      const current = prev.cycleLogs[date] || {
        date,
        isPeriod: false,
        symptoms: [],
      };
      return {
        ...prev,
        cycleLogs: {
          ...prev.cycleLogs,
          [date]: { ...current, ...partial },
        },
      };
    });
  };

  // Settings Handlers
  const handleUpdateSettings = (partial: Partial<AppSettings>) => {
    setDb((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...partial,
      },
    }));
  };

  const handleUpdateMonthlyNote = (yearMonth: string, note: string) => {
    setDb((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        monthlyNotes: {
          ...(prev.settings.monthlyNotes || {}),
          [yearMonth]: note,
        },
      },
    }));
  };

  const handleSetPin = (newPin: string | undefined) => {
    handleUpdateSettings({ pinCode: newPin, isPinLocked: Boolean(newPin) });
  };

  const handleToggleLock = () => {
    if (db.settings.pinCode) {
      setIsLocked(true);
      handleUpdateSettings({ isPinLocked: true });
    }
  };

  const handleUnlock = () => {
    setIsLocked(false);
    handleUpdateSettings({ isPinLocked: false });
  };

  // Ambient desk background based on chosen theme
  const deskBgClass =
    db.settings.theme === 'leather'
      ? 'bg-gradient-to-br from-[#291e18] via-[#3a2c24] to-[#221812]'
      : db.settings.theme === 'rose'
      ? 'bg-gradient-to-br from-[#fcf0f2] via-[#fae3e8] to-[#f7d6de]'
      : db.settings.theme === 'lavender'
      ? 'bg-gradient-to-br from-[#f2effb] via-[#e8e4f8] to-[#ddd7f4]'
      : db.settings.theme === 'midnight'
      ? 'bg-gradient-to-br from-[#121214] via-[#1a1a1f] to-[#0f0f12]'
      : 'bg-gradient-to-br from-[#e8decb] via-[#dfd3bc] to-[#d2c5a8]'; // 'paper' warm wooden desk feel

  const todayKey = formatDateKey(new Date());
  const hasTasksToday = db.tasks.some((t) => t.date === todayKey);

  return (
    <div className={`min-h-screen ${deskBgClass} transition-colors duration-500 font-sans`}>
      {/* Active Audio Reminder Banner */}
      {activeAlert && (
        <ReminderChimeAlert
          alert={activeAlert}
          onDismiss={dismissAlert}
          onMuteFuture={muteReminder}
        />
      )}

      {/* If PIN is locked or cover is active, show the clean Planner Cover with PIN lock */}
      {(isLocked && db.settings.pinCode) || showCover ? (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <PlannerCover
            isLocked={Boolean(isLocked && db.settings.pinCode)}
            currentPin={db.settings.pinCode || '2006'}
            onUnlock={() => {
              handleUnlock();
              setShowCover(false);
            }}
            onOpen={() => {
              handleUnlock();
              setShowCover(false);
            }}
            userDisplayName={db.settings.userDisplayName}
          />
        </div>
      ) : (
        <>
          <BookContainer
            currentView={currentView}
            onViewChange={setCurrentView}
            settings={db.settings}
            onUpdateTheme={(theme) => handleUpdateSettings({ theme })}
            openSettingsModal={() => setIsSettingsOpen(true)}
            onToggleLock={handleToggleLock}
            hasTasksToday={hasTasksToday}
            onShowCover={() => setShowCover(true)}
            soundAlertsEnabled={soundEnabled}
            onToggleSoundAlerts={() =>
              handleUpdateSettings({ soundAlertsEnabled: !soundEnabled })
            }
            onTestChime={triggerTestSound}
          >
            {/* VIEW 1: Home View - Monthly Calendar Spread */}
            {currentView === 'calendar' && (
              <MonthlyBookSpread
                tasks={db.tasks}
                ideas={db.ideas}
                cycleLogs={db.cycleLogs}
                dayLogs={db.dayLogs}
                settings={db.settings}
                selectedDate={selectedDate}
                onSelectDay={handleSelectDayAndOpenPage}
                onUpdateMonthlyNote={handleUpdateMonthlyNote}
                onOpenJokesDigest={() => setCurrentView('jokes-digest')}
              />
            )}

            {/* VIEW 2: The Day Page (Opened when clicking a day) */}
            {currentView === 'day' && (
              <DayBookPage
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onBackToCalendar={() => setCurrentView('calendar')}
                tasks={db.tasks}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
                onCarryOverTasks={handleCarryOverTasks}
                dayLog={db.dayLogs[selectedDate]}
                allDayLogs={db.dayLogs}
                onUpdateDayLog={handleUpdateDayLog}
                cycleLog={db.cycleLogs[selectedDate]}
                onUpdateCycleLog={handleUpdateCycleLog}
                allCycleLogs={db.cycleLogs}
                habits={db.habits}
                settings={db.settings}
                onOpenJokesDigest={() => setCurrentView('jokes-digest')}
              />
            )}

            {/* VIEW 3: Full Ideas & Thoughts Notebook */}
            {currentView === 'ideas' && (
              <IdeasJournal
                ideas={db.ideas}
                onAddIdea={handleAddIdea}
                onUpdateIdea={handleUpdateIdea}
                onDeleteIdea={handleDeleteIdea}
                onTogglePin={handleTogglePinIdea}
              />
            )}

            {/* VIEW 4: Dedicated Cycle Tracker */}
            {currentView === 'cycle' && db.settings.enableCycleTracker && (
              <CycleTracker
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                cycleLogs={db.cycleLogs}
                onUpdateCycleLog={handleUpdateCycleLog}
                settings={db.settings}
                onUpdateSettings={handleUpdateSettings}
              />
            )}

            {/* VIEW 5: Laughter & Wisdom Treasury (Monthly & Annual Hebrew Digest) */}
            {currentView === 'jokes-digest' && (
              <JokesDigest
                allDayLogs={db.dayLogs}
                onNavigateToDay={(dateStr) => {
                  setSelectedDate(dateStr);
                  setCurrentView('day');
                }}
                onDeleteWitItem={(dateKey, witId) => {
                  const dayLog = db.dayLogs[dateKey];
                  if (!dayLog || !dayLog.witItems) return;
                  const filtered = dayLog.witItems.filter((w) => w.id !== witId);
                  handleUpdateDayLog(dateKey, { witItems: filtered });
                }}
              />
            )}
          </BookContainer>

          {/* Unified Planner Settings Modal */}
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={db.settings}
            onUpdateSettings={handleUpdateSettings}
            onUpdateTheme={(theme) => handleUpdateSettings({ theme })}
            onLockNow={() => {
              setIsLocked(true);
              setShowCover(true);
              handleUpdateSettings({ isPinLocked: true });
            }}
            soundAlertsEnabled={soundEnabled}
            onToggleSoundAlerts={() =>
              handleUpdateSettings({ soundAlertsEnabled: !soundEnabled })
            }
            onTestChime={triggerTestSound}
            onOpenRecoveryModal={() => setIsRecoveryOpen(true)}
            database={db}
            onRestoreDatabase={(newDb) => {
              setDb(newDb);
            }}
          />

          {/* Backup & Restore Modal */}
          <BackupModal
            isOpen={isBackupOpen}
            onClose={() => setIsBackupOpen(false)}
            database={db}
            onRestoreDatabase={(newDb) => {
              setDb(newDb);
            }}
            onOpenRecovery={() => setIsRecoveryOpen(true)}
          />

          {/* Emergency Recovery & Rescue Modal */}
          <RecoveryModal
            isOpen={isRecoveryOpen}
            onClose={() => setIsRecoveryOpen(false)}
            currentDatabase={db}
            onRestoreDatabase={(newDb) => {
              setDb(newDb);
            }}
          />

          {/* PIN Lock Settings Modal */}
          <PinSettingsModal
            isOpen={isPinSettingsOpen}
            currentPin={db.settings.pinCode}
            autoLockMinutes={db.settings.autoLockMinutes ?? 20}
            onClose={() => setIsPinSettingsOpen(false)}
            onSavePin={handleSetPin}
            onSaveAutoLockMinutes={(mins) => handleUpdateSettings({ autoLockMinutes: mins })}
          />
        </>
      )}
    </div>
  );
}
