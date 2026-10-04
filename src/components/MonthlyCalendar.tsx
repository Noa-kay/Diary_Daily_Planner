import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle, 
  Lightbulb, 
  Heart, 
  ArrowLeft,
  Sparkles,
  CircleDot
} from 'lucide-react';
import { Task, IdeaEntry, CycleDayLog, DayLog, AppSettings } from '../types';
import { formatDateKey, formatHebrewDateString, parseDateKey, calculateCyclePrediction } from '../services/storage';

interface MonthlyCalendarProps {
  tasks: Task[];
  ideas: IdeaEntry[];
  cycleLogs: Record<string, CycleDayLog>;
  dayLogs: Record<string, DayLog>;
  settings: AppSettings;
  onSelectDateAndNavigateToDay: (dateStr: string) => void;
}

const HEBREW_DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const HEBREW_MONTHS = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
];

export const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({
  tasks,
  ideas,
  cycleLogs,
  dayLogs,
  settings,
  onSelectDateAndNavigateToDay,
}) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDayKey, setSelectedDayKey] = useState<string>(formatDateKey(today));

  const prediction = settings.enableCycleTracker
    ? calculateCyclePrediction(cycleLogs, settings.averageCycleLength, settings.averagePeriodLength)
    : {};

  // Handlers for month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDayKey(formatDateKey(now));
  };

  // Generate calendar grid dates
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Days from previous month
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
  const calendarCells: { date: Date; isCurrentMonth: boolean; key: string }[] = [];

  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - 1, prevMonthDays - i);
    calendarCells.push({ date: d, isCurrentMonth: false, key: formatDateKey(d) });
  }

  // Days in this month
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const d = new Date(currentYear, currentMonth, day);
    calendarCells.push({ date: d, isCurrentMonth: true, key: formatDateKey(d) });
  }

  // Fill remaining cells for standard 35 or 42 grid
  const remaining = 7 - (calendarCells.length % 7);
  if (remaining < 7) {
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(currentYear, currentMonth + 1, day);
      calendarCells.push({ date: d, isCurrentMonth: false, key: formatDateKey(d) });
    }
  }

  const todayKey = formatDateKey(today);

  // Month Statistics
  const monthTasks = tasks.filter((t) => {
    const [y, m] = t.date.split('-').map(Number);
    return y === currentYear && m === currentMonth + 1;
  });
  const monthCompletedTasks = monthTasks.filter((t) => t.completed).length;

  const monthIdeas = ideas.filter((idea) => {
    const [y, m] = idea.date.split('-').map(Number);
    return y === currentYear && m === currentMonth + 1;
  });

  // Selected Day Details
  const selectedDayTasks = tasks.filter((t) => t.date === selectedDayKey);
  const selectedDayIdeas = ideas.filter((i) => i.date === selectedDayKey);
  const selectedDayCycle = cycleLogs[selectedDayKey];
  const selectedDayLog = dayLogs[selectedDayKey];

  return (
    <div className="space-y-6">
      {/* Month Navigation & Stats Header */}
      <div className="p-5 rounded-2xl bg-white shadow-xs border border-stone-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl hover:bg-stone-100 text-stone-600 transition cursor-pointer"
              title="חודש קודם"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 min-w-40 text-center">
              {HEBREW_MONTHS[currentMonth]} {currentYear}
            </h2>

            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl hover:bg-stone-100 text-stone-600 transition cursor-pointer"
              title="חודש הבא"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleJumpToday}
              className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition cursor-pointer"
            >
              חזרה להיום
            </button>

            {/* Quick legend */}
            <div className="hidden md:flex items-center gap-3 text-[11px] text-stone-500 border-r border-stone-200 pr-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                משימות
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                רעיונות
              </span>
              {settings.enableCycleTracker && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  מעקב 🌸
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Month Summary Bar */}
        <div className="mt-4 pt-3 border-t border-stone-100 grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs text-stone-600">
          <div className="p-2 rounded-xl bg-stone-50">
            <span className="font-bold text-stone-900 ml-1">{monthTasks.length}</span>
            משימות החודש ({monthCompletedTasks} הושלמו)
          </div>
          <div className="p-2 rounded-xl bg-stone-50">
            <span className="font-bold text-stone-900 ml-1">{monthIdeas.length}</span>
            רעיונות ומחשבות שתועדו
          </div>
          <div className="p-2 rounded-xl bg-stone-50 col-span-2 sm:col-span-1">
            <span className="font-bold text-stone-900 ml-1">
              {monthTasks.length > 0
                ? Math.round((monthCompletedTasks / monthTasks.length) * 100)
                : 0}
              %
            </span>
            אחוז ביצוע חודשי
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white shadow-xs border border-stone-200">
        {/* Days of week headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
          {HEBREW_DAYS.map((dayName, idx) => (
            <div
              key={idx}
              className={`py-2 text-xs font-bold ${
                idx === 6 ? 'text-indigo-600' : 'text-stone-500'
              }`}
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Grid Cells */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarCells.map((cell) => {
            const isToday = cell.key === todayKey;
            const isSelected = cell.key === selectedDayKey;

            const dayTasks = tasks.filter((t) => t.date === cell.key);
            const completedCount = dayTasks.filter((t) => t.completed).length;
            const hasIdeas = ideas.some((i) => i.date === cell.key);
            const dayEvents = dayLogs[cell.key]?.importantEvents || [];
            const cycleLog = cycleLogs[cell.key];
            const isPeriod = cycleLog?.isPeriod;

            // Prediction highlight
            const isPredictedPeriod =
              settings.enableCycleTracker &&
              prediction.nextPeriodStart &&
              prediction.nextPeriodEnd &&
              cell.key >= prediction.nextPeriodStart &&
              cell.key <= prediction.nextPeriodEnd;

            const isPredictedOvulation =
              settings.enableCycleTracker && cell.key === prediction.ovulationDay;

            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelectedDayKey(cell.key)}
                className={`relative min-h-[70px] sm:min-h-[90px] p-1.5 sm:p-2 rounded-xl border text-right transition-all flex flex-col justify-between cursor-pointer select-none ${
                  isSelected
                    ? 'ring-2 ring-indigo-500 border-indigo-400 bg-indigo-50/30'
                    : cell.isCurrentMonth
                    ? 'bg-white hover:bg-stone-50 border-stone-200'
                    : 'bg-stone-50/50 text-stone-400 border-stone-100'
                } ${isPeriod ? 'bg-rose-50/40 border-rose-200' : ''}`}
              >
                {/* Day Number and Badges */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded-full font-bold ${
                      isToday
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : isPeriod
                        ? 'bg-rose-500 text-white'
                        : cell.isCurrentMonth
                        ? 'text-stone-800'
                        : 'text-stone-400'
                    }`}
                  >
                    {cell.date.getDate()}
                  </span>

                  {/* Period icon or discrete flower */}
                  {isPeriod && (
                    <span className="text-[11px]" title="🌸">
                      🌸
                    </span>
                  )}
                  {!isPeriod && isPredictedPeriod && (
                    <span
                      className="text-[9px] px-1 py-0.2 rounded-sm bg-rose-100 text-rose-700 font-semibold"
                      title="צפי 🌸"
                    >
                      צפי
                    </span>
                  )}
                  {!isPeriod && isPredictedOvulation && (
                    <span
                      className="text-[10px]"
                      title="ביוץ משוער"
                    >
                      ✨
                    </span>
                  )}
                </div>

                {/* Indicators inside the cell */}
                <div className="mt-1 space-y-1">
                  {dayEvents.length > 0 && (
                    <div className="space-y-1">
                      {dayEvents.map((evt, idx) => (
                        <div
                          key={idx}
                          title={evt}
                          className="flex items-start gap-1 text-[10px] px-1 py-0.5 rounded-md font-semibold bg-rose-100 text-rose-900 border border-rose-200 whitespace-normal break-words leading-tight"
                        >
                          <span className="shrink-0 text-[10px] mt-0.5">⭐</span>
                          <span className="break-words">{evt}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {dayTasks.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-stone-600 font-medium truncate">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          completedCount === dayTasks.length
                            ? 'bg-emerald-500'
                            : 'bg-indigo-500'
                        }`}
                      />
                      <span className="truncate hidden sm:inline">
                        {completedCount}/{dayTasks.length} משימות
                      </span>
                      <span className="sm:hidden font-bold">{dayTasks.length}</span>
                    </div>
                  )}

                  {hasIdeas && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                      <Lightbulb className="w-2.5 h-2.5 shrink-0" />
                      <span className="hidden sm:inline">רעיון</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Inspector Panel */}
      {selectedDayKey && (
        <div className="p-5 rounded-2xl bg-white shadow-xs border border-stone-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-stone-900">
                  {formatHebrewDateString(selectedDayKey)}
                </h3>
                {selectedDayKey === todayKey && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-rose-100 text-rose-700 rounded-full">
                    היום
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                סיכום מה שקורה ביום זה
              </p>
            </div>

            <button
              onClick={() => onSelectDateAndNavigateToDay(selectedDayKey)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              <span>מעבר לתכנון יום זה</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Day Tasks Preview */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
              <h4 className="font-semibold text-xs text-stone-800 mb-2 flex items-center justify-between">
                <span>משימות ({selectedDayTasks.length})</span>
                <span className="text-stone-500">
                  {selectedDayTasks.filter((t) => t.completed).length} הושלמו
                </span>
              </h4>
              {selectedDayTasks.length === 0 ? (
                <p className="text-xs text-stone-400">אין משימות מתוכננות ליום זה</p>
              ) : (
                <ul className="space-y-1.5 text-xs text-stone-700">
                  {selectedDayTasks.slice(0, 4).map((t) => (
                    <li
                      key={t.id}
                      className={`truncate flex items-center gap-1.5 ${
                        t.completed ? 'line-through text-stone-400' : ''
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          t.completed ? 'bg-emerald-500' : 'bg-indigo-400'
                        }`}
                      />
                      <span className="truncate">{t.title}</span>
                    </li>
                  ))}
                  {selectedDayTasks.length > 4 && (
                    <li className="text-[11px] text-stone-400 pt-0.5">
                      ועוד {selectedDayTasks.length - 4} משימות...
                    </li>
                  )}
                </ul>
              )}
            </div>

            {/* Day Ideas Preview */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
              <h4 className="font-semibold text-xs text-stone-800 mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                <span>רעיונות ומחשבות ({selectedDayIdeas.length})</span>
              </h4>
              {selectedDayIdeas.length === 0 ? (
                <p className="text-xs text-stone-400">לא נכתבו רעיונות ביום זה</p>
              ) : (
                <ul className="space-y-1.5 text-xs text-stone-700">
                  {selectedDayIdeas.slice(0, 3).map((idea) => (
                    <li key={idea.id} className="truncate">
                      • {idea.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Cycle / Personal Day Notes */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
              <h4 className="font-semibold text-xs text-stone-800 mb-2 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span>מעקב אישי 🌸</span>
              </h4>
              {selectedDayCycle?.isPeriod ? (
                <div className="text-xs text-rose-700 space-y-1">
                  <p className="font-semibold">
                    יום אישי 🌸 • זרימה:{' '}
                    {selectedDayCycle.flow === 'heavy'
                      ? 'מוגברת'
                      : selectedDayCycle.flow === 'medium'
                      ? 'בינונית'
                      : selectedDayCycle.flow === 'light'
                      ? 'קלה'
                      : 'הכתמות'}
                  </p>
                  {selectedDayCycle.symptoms.length > 0 && (
                    <p className="text-stone-500 text-[11px]">
                      תסמינים: {selectedDayCycle.symptoms.join(', ')}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-stone-400">אין סימון 🌸 ביום זה</p>
              )}

              {selectedDayLog?.gratitude && (
                <div className="mt-2 pt-2 border-t border-stone-200/60 text-xs text-stone-600">
                  <span className="font-semibold text-rose-600">הודיה:</span>{' '}
                  <span className="italic">{selectedDayLog.gratitude}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
