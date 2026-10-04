import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Lightbulb, 
  Calendar as CalendarIcon,
  StickyNote,
  Heart
} from 'lucide-react';
import { Task, IdeaEntry, CycleDayLog, DayLog, AppSettings } from '../types';
import { formatDateKey, parseDateKey, calculateCyclePrediction } from '../services/storage';
import { getHebrewDateInfo } from '../services/hebrewCalendar';

interface MonthlyBookSpreadProps {
  tasks: Task[];
  ideas: IdeaEntry[];
  cycleLogs: Record<string, CycleDayLog>;
  dayLogs: Record<string, DayLog>;
  settings: AppSettings;
  onSelectDay: (dateStr: string) => void;
  onUpdateMonthlyNote?: (yearMonth: string, note: string) => void;
  selectedDate: string;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ENGLISH_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const MonthlyBookSpread: React.FC<MonthlyBookSpreadProps> = ({
  tasks,
  ideas,
  cycleLogs,
  dayLogs,
  settings,
  onSelectDay,
  onUpdateMonthlyNote,
  selectedDate,
}) => {
  const initialDate = parseDateKey(selectedDate);
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth()); // 0-indexed

  const todayKey = formatDateKey(new Date());
  const yearMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const monthlyNote = settings.monthlyNotes?.[yearMonthKey] || '';

  const prediction = settings.enableCycleTracker
    ? calculateCyclePrediction(cycleLogs, settings.averageCycleLength, settings.averagePeriodLength)
    : {};

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

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    onSelectDay(formatDateKey(now));
  };

  // Generate calendar days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
  const calendarCells: {
    date: Date;
    isCurrentMonth: boolean;
    key: string;
    hebrewInfo: ReturnType<typeof getHebrewDateInfo>;
  }[] = [];

  // Previous month trailing days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - 1, prevMonthDays - i);
    calendarCells.push({
      date: d,
      isCurrentMonth: false,
      key: formatDateKey(d),
      hebrewInfo: getHebrewDateInfo(d),
    });
  }

  // Current month days
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const d = new Date(currentYear, currentMonth, day);
    calendarCells.push({
      date: d,
      isCurrentMonth: true,
      key: formatDateKey(d),
      hebrewInfo: getHebrewDateInfo(d),
    });
  }

  // Next month trailing days to complete rows
  const remaining = 7 - (calendarCells.length % 7);
  if (remaining < 7) {
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(currentYear, currentMonth + 1, day);
      calendarCells.push({
        date: d,
        isCurrentMonth: false,
        key: formatDateKey(d),
        hebrewInfo: getHebrewDateInfo(d),
      });
    }
  }

  // Hebrew month range for header
  const midDate = new Date(currentYear, currentMonth, 15);
  const midHebrew = getHebrewDateInfo(midDate);

  // Month stats
  const monthTasks = tasks.filter((t) => t.date.startsWith(yearMonthKey));
  const completedMonthTasks = monthTasks.filter((t) => t.completed).length;

  return (
    <div className="relative">
      
      {/* Top Banner on Open Book */}
      <div className="pb-4 mb-4 border-b border-pink-200/80 flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Month Title & Prev/Next */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-pink-100 text-pink-900 transition cursor-pointer border border-pink-200/80 bg-white shadow-2xs"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4 text-pink-700" />
            </button>

            <div className="text-center md:text-left px-2">
              <div className="flex items-center justify-center md:justify-start gap-1.5">
                <span className="text-sm">🎀</span>
                <h2 className="text-xl sm:text-2xl font-medium text-pink-950 tracking-tight">
                  {ENGLISH_MONTHS[currentMonth]} {currentYear}
                </h2>
              </div>
              {/* Hebrew month and year preserved in Hebrew */}
              <p className="text-xs text-pink-700/80 mt-0.5">
                חודש {midHebrew.hebrewMonthName} {midHebrew.hebrewYearLetter}
              </p>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-pink-100 text-pink-900 transition cursor-pointer border border-pink-200/80 bg-white shadow-2xs"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4 text-pink-700" />
            </button>
          </div>
        </div>

        {/* Action Controls & Legend */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleJumpToToday}
            className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-400 via-rose-300 to-pink-400 text-white text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-xs hover:scale-102"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Today</span>
          </button>

          <div className="hidden lg:flex items-center gap-3 text-[11px] text-pink-900/80 border-l border-pink-200 pl-3">
            <span className="flex items-center gap-1 font-medium text-rose-950">
              <span className="text-xs">⭐</span>
              Events
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-pink-400" />
              Tasks
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Notes
            </span>
            <span className="flex items-center gap-1">
              <span className="text-xs">🌸</span>
              <span>Personal</span>
            </span>
          </div>
        </div>
      </div>

      {/* Royal Calendar Grid: Days in soft pastel pink cards */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        
        {/* Days of week header */}
        {DAYS_OF_WEEK.map((dayName, idx) => (
          <div
            key={dayName}
            className={`py-1.5 text-center text-xs font-medium rounded-xl ${
              idx === 0 || idx === 6
                ? 'text-pink-950 bg-pink-200/60 border border-pink-300/60'
                : 'text-pink-900 bg-pink-100/40 border border-pink-200/50'
            }`}
          >
            {dayName}
          </div>
        ))}

        {/* Days Cells */}
        {calendarCells.map((cell) => {
          const isToday = cell.key === todayKey;
          const isSelected = cell.key === selectedDate;

          const dayTasks = tasks.filter((t) => t.date === cell.key);
          const completedCount = dayTasks.filter((t) => t.completed).length;
          const dayIdeas = ideas.filter((i) => i.date === cell.key);
          const hasIdeas = dayIdeas.length > 0;
          const dayEvents = dayLogs[cell.key]?.importantEvents || [];
          const cycleLog = cycleLogs[cell.key];
          const isFlower = cycleLog?.isPeriod;

          const isPredictedFlower =
            settings.enableCycleTracker &&
            prediction.nextPeriodStart &&
            prediction.nextPeriodEnd &&
            cell.key >= prediction.nextPeriodStart &&
            cell.key <= prediction.nextPeriodEnd;

          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => onSelectDay(cell.key)}
              className={`group relative min-h-[85px] sm:min-h-[105px] p-2 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between border cursor-pointer overflow-hidden ${
                isToday
                  ? 'bg-gradient-to-br from-pink-100 to-rose-100/90 border-pink-400 ring-2 ring-pink-300 shadow-md shadow-pink-200/50 scale-[1.01]'
                  : isSelected
                  ? 'bg-pink-50 border-pink-300 ring-1 ring-pink-200 shadow-2xs'
                  : cell.isCurrentMonth
                  ? 'bg-white/95 hover:bg-pink-50/80 border-pink-100 hover:border-pink-300 shadow-2xs hover:shadow-xs'
                  : 'bg-stone-50/30 border-stone-200/30 text-stone-300'
              } ${isFlower ? 'bg-pink-100/70 border-pink-300' : ''}`}
            >
              {/* Header row in cell: Gregorian day on left, Hebrew day on right */}
              <div className="w-full">
                <div className="flex items-center justify-between w-full">
                  {/* Gregorian Day Number */}
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded-full font-medium shrink-0 transition ${
                      isToday
                        ? 'bg-pink-500 text-white shadow-2xs font-bold'
                        : isFlower
                        ? 'bg-pink-400 text-white font-bold'
                        : cell.isCurrentMonth
                        ? 'text-pink-950 group-hover:text-pink-600'
                        : 'text-stone-400'
                    }`}
                  >
                    {cell.date.getDate()}
                  </span>

                  {/* Hebrew Date Letter (Strictly preserved in Hebrew) */}
                  <span
                    className={`text-[11px] font-medium shrink-0 text-right px-1 ${
                      cell.isCurrentMonth ? 'text-pink-700/80' : 'text-stone-300'
                    }`}
                  >
                    {cell.hebrewInfo.hebrewDayLetter}
                  </span>
                </div>

                {/* Holiday Badge (Preserved in Hebrew) */}
                {cell.hebrewInfo.holidayName && (
                  <div className="w-full text-center mt-1">
                    <span
                      className="inline-block text-[9px] px-1.5 py-0.2 rounded-md bg-amber-100/80 text-amber-900 font-medium truncate max-w-full border border-amber-200/60 leading-tight"
                      title={cell.hebrewInfo.holidayName}
                    >
                      {cell.hebrewInfo.holidayName}
                    </span>
                  </div>
                )}
              </div>

              {/* Middle & Bottom: Events, Tasks & Mood Indicators inside the day */}
              <div className="mt-1 space-y-1 w-full">
                {/* Important Events Badges (Prominently displayed) */}
                {dayEvents.length > 0 && (
                  <div className="space-y-0.5 w-full">
                    {dayEvents.slice(0, 2).map((evt, idx) => (
                      <div
                        key={idx}
                        title={evt}
                        className="flex items-center gap-1 text-[9.5px] px-1.5 py-0.5 rounded-md font-semibold bg-gradient-to-r from-rose-200/90 to-pink-200/80 text-rose-950 border border-rose-300 shadow-2xs truncate leading-tight"
                      >
                        <span className="shrink-0 text-[10px]">⭐</span>
                        <span className="truncate">{evt}</span>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[8.5px] text-rose-700 font-bold block text-right px-1 leading-none">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                )}

                {/* Tasks pill */}
                {dayTasks.length > 0 && (
                  <div
                    className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-lg font-medium truncate ${
                      completedCount === dayTasks.length
                        ? 'bg-emerald-100/80 text-emerald-800'
                        : 'bg-pink-100 text-pink-900'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        completedCount === dayTasks.length
                          ? 'bg-emerald-500'
                          : 'bg-pink-500'
                      }`}
                    />
                    <span className="truncate hidden sm:inline">
                      {completedCount}/{dayTasks.length} tasks
                    </span>
                    <span className="sm:hidden font-bold">
                      {completedCount}/{dayTasks.length}
                    </span>
                  </div>
                )}

                {/* Ideas & Thoughts dot */}
                {hasIdeas && (
                  <div className="flex items-center gap-1 text-[10px] text-amber-800 font-medium px-1 truncate">
                    <Lightbulb className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                    <span className="truncate hidden sm:inline">
                      {dayIdeas[0].title}
                    </span>
                  </div>
                )}

                {/* Day Mood Face & 🌸 Indicator Row */}
                <div className="flex items-center justify-between text-xs px-1">
                  {/* Mood Face if chosen for this day */}
                  {dayLogs[cell.key]?.mood ? (
                    <span className="text-sm select-none leading-none" title="Mood Today">
                      {dayLogs[cell.key].mood === 'great'
                        ? '💖'
                        : dayLogs[cell.key].mood === 'creative'
                        ? '💡'
                        : dayLogs[cell.key].mood === 'calm'
                        ? '🌸'
                        : dayLogs[cell.key].mood === 'tired'
                        ? '🥱'
                        : dayLogs[cell.key].mood === 'stressed'
                        ? '🌧️'
                        : '🥺'}
                    </span>
                  ) : <span />}

                  {/* 🌸 Marker (symbol only, strictly no words!) */}
                  {isFlower && (
                    <span className="text-xs select-none leading-none animate-pulse" title="🌸">
                      🌸
                    </span>
                  )}

                  {!isFlower && isPredictedFlower && (
                    <span className="text-[10px] opacity-70 select-none leading-none" title="Predicted 🌸">
                      🌸
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Sticky Note for the Month: Monthly Goals & Notes */}
      <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-pink-50/80 via-rose-50/60 to-pink-50/80 border border-pink-200/90 shadow-2xs flex flex-col md:flex-row items-stretch justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <StickyNote className="w-4 h-4 text-pink-600" />
            <h4 className="font-medium text-xs text-pink-950">
              Monthly Goals & Notes ({ENGLISH_MONTHS[currentMonth]}):
            </h4>
          </div>
          <textarea
            rows={2}
            value={monthlyNote}
            onChange={(e) =>
              onUpdateMonthlyNote && onUpdateMonthlyNote(yearMonthKey, e.target.value)
            }
            placeholder="Write your monthly focus, goals, intentions or notes here..."
            className="w-full p-2.5 text-xs bg-white border border-pink-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-pink-400 text-pink-950 resize-none shadow-2xs"
          />
        </div>

        {/* Month Summary Card */}
        <div className="p-3 bg-white/95 rounded-xl border border-pink-200/80 flex flex-col justify-center text-xs text-pink-950/80 min-w-52 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span>Tasks Completed:</span>
            <span className="font-bold text-pink-950">
              {completedMonthTasks} / {monthTasks.length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Progress:</span>
            <span className="font-bold text-pink-700">
              {monthTasks.length > 0
                ? Math.round((completedMonthTasks / monthTasks.length) * 100)
                : 0}
              %
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
