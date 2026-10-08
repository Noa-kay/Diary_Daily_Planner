import React from 'react';
import { Bell, X, Clock, Sparkles, BellOff } from 'lucide-react';
import { ApproachingReminder } from '../hooks/useTimeReminders';

interface ReminderChimeAlertProps {
  alert: ApproachingReminder;
  onDismiss: () => void;
  onMuteFuture: (baseId: string) => void;
}

export const ReminderChimeAlert: React.FC<ReminderChimeAlertProps> = ({
  alert,
  onDismiss,
  onMuteFuture,
}) => {
  const isNow = alert.stage === '0m';
  const is5m = alert.stage === '5m';
  const is10m = alert.stage === '10m';

  return (
    <aside
      aria-label="Upcoming reminder notification"
      className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] animate-in slide-in-from-top-4 duration-300 pointer-events-auto"
    >
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white/95 backdrop-blur-md border-2 border-rose-300 shadow-xl shadow-rose-200/50 flex flex-col gap-2.5">
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs animate-bounce duration-1000 ${
              isNow
                ? 'bg-gradient-to-tr from-rose-500 to-pink-600 text-white'
                : is5m
                ? 'bg-gradient-to-tr from-pink-400 to-rose-400 text-white'
                : 'bg-gradient-to-tr from-amber-400 to-rose-400 text-white'
            }`}
          >
            <Bell className="w-5 h-5 fill-white" />
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${
                  isNow
                    ? 'bg-rose-500 text-white border-rose-600'
                    : is5m
                    ? 'bg-rose-100 text-rose-900 border-rose-300 font-semibold'
                    : 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                }`}
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span>{alert.stageLabel}</span>
              </span>

              <span className="flex items-center gap-1 text-[11px] text-stone-500 font-medium">
                <Clock className="w-3 h-3 text-stone-400" />
                <span>{alert.timeLabel}</span>
              </span>
            </div>

            <p className="text-sm font-bold text-rose-950 truncate leading-snug">
              {alert.title}
            </p>

            <p className="text-[11px] text-pink-700/80 mt-0.5">
              {isNow
                ? "Time for your scheduled event or activity 🌸"
                : `Gentle reminder: ~${alert.minutesLeft} minutes remaining`}
            </p>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-pink-50 transition cursor-pointer shrink-0"
            title="Dismiss reminder"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons: Mute future alerts or Dismiss */}
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-rose-100 text-xs">
          <button
            type="button"
            onClick={() => onMuteFuture(alert.baseId)}
            className="px-2.5 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-900 font-medium transition cursor-pointer flex items-center gap-1 border border-pink-200"
            title="Mute remaining alerts for this item"
          >
            <BellOff className="w-3.5 h-3.5 text-pink-600" />
            <span>Mute Remaining</span>
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="px-3 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-medium transition cursor-pointer shadow-2xs"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </aside>
  );
};
