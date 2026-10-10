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
  BellOff,
  Smile,
  LifeBuoy,
  Settings
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
  openSettingsModal: () => void;
  openBackupModal?: () => void;
  openRecoveryModal?: () => void;
  openPinModal?: () => void;
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
  openSettingsModal,
  openBackupModal,
  openRecoveryModal,
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
            <span className="font-bold text-pink-950 text-sm hidden sm:inline flex items-center gap-1">
              <span>My Planner</span>
              <Sparkles className="w-3 h-3 text-pink-400 inline" />
            </span>
          </div>
          <OfflineIndicator />
        </div>

        {/* Right: Desk Controls - Icon-only buttons (Inspiration, Cover, Settings rightmost) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* 1. Daily Affirmation Sparkle Button */}
          <button
            onClick={() => setShowAffirmation(true)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-r from-pink-100 to-rose-100 hover:from-pink-200 hover:to-rose-200 text-pink-900 transition cursor-pointer flex items-center justify-center border border-pink-200/80 shadow-2xs"
            title="Daily Inspiration"
            aria-label="Daily Inspiration"
          >
            <Sparkles className="w-4 h-4 text-pink-500 animate-spin duration-3000" />
          </button>

          {/* 2. Close Book to Cover Button */}
          {onShowCover && (
            <button
              onClick={onShowCover}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-pink-100/70 hover:bg-pink-100 text-pink-950 transition cursor-pointer flex items-center justify-center border border-pink-200 shadow-2xs"
              title="Close to Book Cover"
              aria-label="Close to Book Cover"
            >
              <span className="text-sm">📖</span>
            </button>
          )}

          {/* 3. Settings Button (Rightmost!) */}
          <button
            onClick={openSettingsModal}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-r from-pink-100/90 to-rose-100/80 hover:from-pink-200 hover:to-rose-200 text-pink-950 transition cursor-pointer flex items-center justify-center border border-pink-200 shadow-2xs"
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4 text-pink-600" />
          </button>
        </div>
      </div>

      {/* The Physical Planner Spread Container with Top Divider Tabs */}
      <div className="relative w-full max-w-5xl flex flex-col items-stretch">
        
        {/* 4 Elegant Planner Top Divider Tabs - Protruding neatly from the top edge */}
        <nav
          aria-label="Planner Sections Navigation"
          className="flex items-end justify-start gap-1.5 sm:gap-2 px-4 sm:px-8 -mb-0.5 z-20 no-print select-none overflow-x-auto scrollbar-none"
        >
          {[
            {
              id: 'calendar' as BookView,
              title: 'Monthly Calendar',
              shortTitle: 'Calendar',
              icon: <CalendarIcon className="w-3.5 h-3.5" />,
            },
            {
              id: 'day' as BookView,
              title: "Today's Page",
              shortTitle: 'Today',
              icon: <PenTool className="w-3.5 h-3.5" />,
            },
            {
              id: 'ideas' as BookView,
              title: 'Sparks & Vision Studio ✨',
              shortTitle: 'Sparks ✨',
              icon: <Lightbulb className="w-3.5 h-3.5 text-amber-500" />,
            },
            {
              id: 'jokes-digest' as BookView,
              title: 'Jokes & Quotes Treasury 🃏',
              shortTitle: 'Jokes 🃏',
              icon: <Smile className="w-3.5 h-3.5 text-amber-500" />,
            },
            ...(settings.enableCycleTracker
              ? [
                  {
                    id: 'cycle' as BookView,
                    title: 'Personal Tracker 🌸',
                    shortTitle: 'Tracker 🌸',
                    icon: <Heart className="w-3.5 h-3.5 text-pink-500" />,
                  },
                ]
              : []),
          ].map((tab) => {
            const isActive = currentView === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onViewChange(tab.id)}
                className={`group px-3.5 sm:px-5 py-2 rounded-t-2xl font-serif text-xs transition-all duration-200 cursor-pointer flex items-center gap-1.5 border-t-2 border-x-2 shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-t from-[#f8d7e0] to-[#fae1e8] text-pink-950 font-bold border-pink-300 shadow-xs z-30 translate-y-0.5'
                    : 'bg-white/85 hover:bg-white text-pink-900/80 hover:text-pink-950 border-pink-200/70 shadow-2xs'
                }`}
              >
                <span className="shrink-0 transition-transform group-hover:scale-110">
                  {tab.icon}
                </span>
                <span className="hidden sm:inline tracking-wide font-medium">
                  {tab.title}
                </span>
                <span className="sm:hidden tracking-wide font-medium">
                  {tab.shortTitle}
                </span>
                {isActive && (
                  <span className="text-[10px] text-pink-600 font-bold ml-0.5">
                    ✦
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Book Hardcover in Soft Royal Rose */}
        <div className="relative flex-1 rounded-[32px] p-3 sm:p-6 bg-gradient-to-br from-[#f8d7e0] via-[#f3c2ce] to-[#eeb0be] shadow-2xl ring-1 ring-pink-300/60 border-2 border-pink-200/90">
          
          {/* Golden stitched border around cover */}
          <div className="absolute inset-2 sm:inset-3 rounded-[26px] border border-dashed border-amber-500/30 pointer-events-none" />

          {/* INNER PAGES (Blush cream paper journal spread) */}
          <div className="relative rounded-2xl bg-[#fffbfc] shadow-inner p-4 sm:p-6 min-h-[580px] overflow-visible border border-pink-200/70">
            
            {/* Center Spine Crease */}
            <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 sm:w-12 bg-gradient-to-r from-transparent via-pink-900/[0.03] to-transparent hidden md:block" />

            {/* Child content: Day page, calendar, ideas (Gains extra vertical space!) */}
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
