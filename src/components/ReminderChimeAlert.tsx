import React from 'react';
import { Bell, X, Clock, Sparkles } from 'lucide-react';
import { ApproachingReminder } from '../hooks/useTimeReminders';

interface ReminderChimeAlertProps {
  alert: ApproachingReminder;
  onDismiss: () => void;
}

export const ReminderChimeAlert: React.FC<ReminderChimeAlertProps> = ({ alert, onDismiss }) => {
  return (
    <aside
      aria-label="Upcoming reminder notification"
      className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] animate-in slide-in-from-top-4 duration-300 pointer-events-auto"
    >
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white/95 backdrop-blur-md border-2 border-rose-300 shadow-xl shadow-rose-200/50 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-400 to-pink-500 text-white flex items-center justify-center shrink-0 shadow-xs animate-bounce duration-1000">
          <Bell className="w-5 h-5 fill-white" />
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600 uppercase tracking-wider mb-0.5">
            <Sparkles className="w-3 h-3 text-rose-500" />
            <span>Upcoming Reminder</span>
            <span className="text-stone-300">•</span>
            <span className="flex items-center gap-0.5 text-stone-600 lowercase font-medium">
              <Clock className="w-3 h-3 text-stone-500" />
              {alert.minutesLeft === 0 ? 'Starting now' : `In ~${alert.minutesLeft} min (${alert.timeLabel})`}
            </span>
          </div>

          <p className="text-sm font-semibold text-rose-950 truncate leading-snug">
            {alert.title}
          </p>

          <p className="text-[11px] text-pink-700/80 mt-0.5">
            Gentle chime reminder for your scheduled plan 🌸
          </p>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-pink-50 transition cursor-pointer shrink-0"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
