import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  PenTool, 
  Lightbulb, 
  Heart, 
  HardDrive, 
  Lock, 
  Unlock, 
  Printer, 
  Sparkles,
  Bell,
  BellOff
} from 'lucide-react';
import { BookView, AppTheme, AppSettings } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { OfflineIndicator } from './OfflineIndicator';
import { AffirmationModal } from './AffirmationModal';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface BookContainerProps {
  children: React.ReactNode;
  currentView: BookView;
  onViewChange: (view: BookView) => void;
  settings: AppSettings;
  onUpdateTheme: (theme: AppTheme) => void;
  openBackupModal: () => void;
  openPinModal: () => void;
  onToggleLock: () => void;
  hasTasksToday: boolean;
  onShowCover?: () => void;
  soundAlertsEnabled?: boolean;
  onToggleSoundAlerts?: () => void;
  onTestChime?: () => void;
}

const THEMES: { id: AppTheme; label: string; dotColor: string }[] = [
  { id: 'rose', label: 'Pastel Rose', dotColor: 'bg-pink-300 border-pink-400' },
  { id: 'paper', label: 'Cream Paper', dotColor: 'bg-amber-100 border-amber-300' },
  { id: 'lavender', label: 'Soft Lavender', dotColor: 'bg-purple-200 border-purple-300' },
  { id: 'leather', label: 'Vintage Leather', dotColor: 'bg-amber-800 border-amber-900' },
  { id: 'midnight', label: 'Midnight Stars', dotColor: 'bg-stone-800 border-stone-700' },
];

export const BookContainer: React.FC<BookContainerProps> = ({
  children,
  currentView,
  onViewChange,
  settings,
  onUpdateTheme,
  openBackupModal,
  openPinModal,
  onToggleLock,
  hasTasksToday,
  onShowCover,
  soundAlertsEnabled = true,
  onToggleSoundAlerts,
  onTestChime,
}) => {
  const [showAffirmation, setShowAffirmation] = useState(false);
  const { isInstalled } = usePWAInstall();

  return (
    <div className="min-h-screen py-4 sm:py-8 px-2 sm:px-6 flex flex-col items-center justify-start select-text">
      
      {/* Top Desk Utility Strip */}
      <div className="w-full max-w-5xl mb-3 flex items-center justify-between gap-2 px-2 no-print">
        {/* Left: App Identity */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center shadow-md shadow-pink-300/40">
            <span className="text-base">🌸</span>
          </div>
          <div>
            <span className="font-medium text-pink-950 text-sm hidden sm:inline flex items-center gap-1">
              <span>My Planner</span>
              <Sparkles className="w-3 h-3 text-pink-400 inline" />
            </span>
          </div>
          <OfflineIndicator />
        </div>

        {/* Right: Desk Controls & PWA Install */}
        <div className="flex items-center gap-2">
          {/* Daily Affirmation Sparkle Button */}
          <button
            onClick={() => setShowAffirmation(true)}
            className="p-1.5 px-2.5 rounded-xl bg-gradient-to-r from-pink-100 to-rose-100 hover:from-pink-200 hover:to-rose-200 text-pink-900 text-xs font-medium transition cursor-pointer flex items-center gap-1.5 border border-pink-200/80 shadow-2xs"
            title="Daily Positive Affirmation & Inspiration"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-500 animate-spin duration-3000" />
            <span className="hidden sm:inline">Affirmation</span>
          </button>

          {onShowCover && (
            <button
              onClick={onShowCover}
              className="p-1.5 px-2.5 rounded-xl bg-pink-100/70 hover:bg-pink-100 text-pink-950 text-xs font-medium transition cursor-pointer flex items-center gap-1 border border-pink-200"
              title="Close planner and view book cover"
            >
              <span>📖</span>
              <span className="hidden sm:inline">Cover</span>
            </button>
          )}

          {/* Only shown in browser before installing to computer */}
          {!isInstalled && <PWAInstallButton />}

          {/* Backup to file button - hidden on installed desktop app as requested */}
          {!isInstalled && (
            <button
              onClick={openBackupModal}
              className="p-1.5 px-2 rounded-xl bg-pink-100/60 hover:bg-pink-100 text-pink-900 text-xs font-medium transition cursor-pointer flex items-center gap-1 border border-pink-200/60"
              title="Backup to local file / Restore"
            >
              <HardDrive className="w-3.5 h-3.5 text-pink-700" />
              <span className="hidden md:inline">Backup</span>
            </button>
          )}

          {/* Sound Alert Toggle with Test Option */}
          {onToggleSoundAlerts && (
            <button
              onClick={onToggleSoundAlerts}
              className={`p-1.5 px-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                soundAlertsEnabled
                  ? 'text-rose-900 bg-gradient-to-r from-rose-100 to-pink-100 hover:from-rose-200 hover:to-pink-200 border-rose-300'
                  : 'text-stone-400 bg-stone-100/70 hover:bg-stone-200/70 border-stone-200'
              }`}
              title={
                soundAlertsEnabled
                  ? 'Chime Reminders ON (Gentle audio alert for upcoming tasks/events). Click to mute.'
                  : 'Chime Reminders MUTED. Click to turn ON.'
              }
            >
              {soundAlertsEnabled ? (
                <Bell className="w-3.5 h-3.5 text-rose-600 fill-rose-300" />
              ) : (
                <BellOff className="w-3.5 h-3.5 text-stone-400" />
              )}
              <span className="hidden md:inline text-xs font-medium">
                {soundAlertsEnabled ? 'Chime ON' : 'Muted'}
              </span>
            </button>
          )}

          {/* Print button */}
          <button
            onClick={() => window.print()}
            className="p-1.5 rounded-xl bg-pink-100/60 hover:bg-pink-100 text-pink-900 transition cursor-pointer hidden sm:flex border border-pink-200/60"
            title="Print this page"
          >
            <Printer className="w-3.5 h-3.5 text-pink-700" />
          </button>

          {/* PIN Lock */}
          <button
            onClick={() => {
              if (settings.pinCode) {
                onToggleLock();
              } else {
                openPinModal();
              }
            }}
            className={`p-1.5 rounded-xl transition cursor-pointer border ${
              settings.pinCode
                ? 'text-pink-600 bg-pink-50 hover:bg-pink-100 border-pink-300'
                : 'text-stone-400 hover:text-stone-700 bg-white border-stone-200'
            }`}
            title={settings.pinCode ? 'Lock planner with PIN' : 'Set privacy PIN code'}
          >
            {settings.pinCode ? <Lock className="w-3.5 h-3.5 text-pink-600" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* The Physical Planner Spread Container */}
      <div className="relative w-full max-w-5xl flex items-stretch">
        
        {/* Book Hardcover in Soft Royal Rose */}
        <div className="relative flex-1 rounded-[32px] p-3 sm:p-6 bg-gradient-to-br from-[#f8d7e0] via-[#f3c2ce] to-[#eeb0be] shadow-2xl ring-1 ring-pink-300/60 border-2 border-pink-200/90">
          
          {/* Golden stitched border around cover */}
          <div className="absolute inset-2 sm:inset-3 rounded-[26px] border border-dashed border-amber-500/30 pointer-events-none" />

          {/* Silk Ribbon Bookmark */}
          <div
            onClick={() => onViewChange(currentView === 'calendar' ? 'day' : 'calendar')}
            title="Ribbon Bookmark: Click to flip between Calendar and Today"
            className="absolute top-0 right-14 sm:right-20 z-40 cursor-pointer group flex flex-col items-center no-print"
          >
            <div className="w-7 sm:w-8 h-16 sm:h-20 bg-gradient-to-b from-pink-600 via-rose-500 to-pink-500 shadow-md shadow-pink-500/20 transition-transform group-hover:translate-y-1 rounded-b-xs relative flex flex-col items-center pt-2">
              {/* Vertical Ribbon Text strictly inside the ribbon */}
              <span className="text-[9px] sm:text-[10px] font-bold text-white tracking-widest uppercase [writing-mode:vertical-rl] select-none opacity-95">
                RIBBON 🌸
              </span>
              {/* Bottom ribbon chevron cutout */}
              <div className="absolute -bottom-2 w-0 h-0 border-l-[14px] sm:border-l-[16px] border-l-transparent border-r-[14px] sm:border-r-[16px] border-r-transparent border-b-[8px] sm:border-b-[10px] border-b-transparent" />
            </div>
          </div>

          {/* INNER PAGES (Blush cream paper journal spread) */}
          <div className="relative rounded-2xl bg-[#fffbfc] shadow-inner p-4 sm:p-6 min-h-[580px] overflow-visible border border-pink-200/70">
            
            {/* Center Spine Crease */}
            <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 sm:w-12 bg-gradient-to-r from-transparent via-pink-900/[0.03] to-transparent hidden md:block" />

            {/* Mobile Navigation Tabs */}
            <div className="flex sm:hidden items-center justify-between pb-3 mb-3 border-b border-pink-100 no-print">
              <button
                onClick={() => onViewChange('calendar')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  currentView === 'calendar' ? 'bg-pink-500 text-white font-bold' : 'text-pink-900'
                }`}
              >
                Calendar
              </button>
              <button
                onClick={() => onViewChange('day')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  currentView === 'day' ? 'bg-pink-500 text-white font-bold' : 'text-pink-900'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => onViewChange('ideas')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  currentView === 'ideas' ? 'bg-pink-500 text-white font-bold' : 'text-pink-900'
                }`}
              >
                Journal
              </button>
              {settings.enableCycleTracker && (
                <button
                  onClick={() => onViewChange('cycle')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    currentView === 'cycle' ? 'bg-pink-500 text-white font-bold' : 'text-pink-900'
                  }`}
                >
                  🌸
                </button>
              )}
            </div>

            {/* Tab Navigation on Desktop Header - Centered as requested */}
            <div className="hidden sm:flex items-center justify-center gap-2 pb-3 mb-4 border-b border-pink-100 no-print">
              <button
                onClick={() => onViewChange('calendar')}
                className={`px-4 py-2 rounded-2xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'calendar'
                    ? 'bg-pink-500 text-white shadow-xs font-semibold scale-102 ring-2 ring-pink-300/60'
                    : 'bg-pink-50/80 hover:bg-pink-100 text-pink-950 border border-pink-200/80'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Monthly Calendar</span>
              </button>
              <button
                onClick={() => onViewChange('day')}
                className={`px-4 py-2 rounded-2xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'day'
                    ? 'bg-pink-500 text-white shadow-xs font-semibold scale-102 ring-2 ring-pink-300/60'
                    : 'bg-pink-50/80 hover:bg-pink-100 text-pink-950 border border-pink-200/80'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Today's Page</span>
              </button>
              <button
                onClick={() => onViewChange('ideas')}
                className={`px-4 py-2 rounded-2xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'ideas'
                    ? 'bg-pink-500 text-white shadow-xs font-semibold scale-102 ring-2 ring-pink-300/60'
                    : 'bg-pink-50/80 hover:bg-pink-100 text-pink-950 border border-pink-200/80'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Ideas & Journal</span>
              </button>
              {settings.enableCycleTracker && (
                <button
                  onClick={() => onViewChange('cycle')}
                  className={`px-4 py-2 rounded-2xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    currentView === 'cycle'
                      ? 'bg-pink-500 text-white shadow-xs font-semibold scale-102 ring-2 ring-pink-300/60'
                      : 'bg-pink-50/80 hover:bg-pink-100 text-pink-950 border border-pink-200/80'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5 text-pink-500" />
                  <span>Personal Tracker 🌸</span>
                </button>
              )}
            </div>

            {/* Child content: Day page, calendar, ideas */}
            <div className="relative z-10">{children}</div>
          </div>
        </div>
      </div>

      {/* Desk ambient footer */}
      <div className="w-full max-w-5xl mt-3 flex items-center justify-between text-[11px] text-pink-900/60 px-4 no-print">
        <div className="flex items-center gap-2">
          <span>🌸 Offline Planner</span>
          <span>•</span>
          <span>Saved directly on your computer</span>
        </div>
        <div>
          <span>Mac & Windows Compatible ✨</span>
        </div>
      </div>

      {/* Daily Affirmation Modal */}
      <AffirmationModal
        isOpen={showAffirmation}
        onClose={() => setShowAffirmation(false)}
      />
    </div>
  );
};
