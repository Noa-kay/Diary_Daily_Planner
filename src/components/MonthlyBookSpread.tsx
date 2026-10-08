import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Lightbulb, 
  Calendar as CalendarIcon,
  StickyNote,
  Heart,
  Smile
} from 'lucide-react';
import { Task, IdeaEntry, CycleDayLog, DayLog, AppSettings } from '../types';
import { formatDateKey, parseDateKey, calculateCyclePrediction, parseEventItem, getEventStringsForDate } from '../services/storage';
import { getHebrewDateInfo } from '../services/hebrewCalendar';

interface MonthlyBookSpreadProps {
  tasks: Task[];
  ideas: IdeaEntry[];
  cycleLogs: Record<string, CycleDayLog>;
  dayLogs: Record<string, DayLog>;
  settings: AppSettings;
  onSelectDay: (dateStr: string) => void;
  onUpdateMonthlyNote?: (yearMonth: string, note: string) => void;
  onOpenJokesDigest?: () => void;
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
  onOpenJokesDigest,
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
                Hebrew Month: {midHebrew.hebrewMonthName} {midHebrew.hebrewYearLetter}
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
        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenJokesDigest && (
            <button
              onClick={onOpenJokesDigest}
              className="px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/90 text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-2xs hover:scale-102"
              title="View Monthly & Annual Hebrew Jokes Summary"
            >
              <Smile className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Jokes Digest (סיכום בדיחות)</span>
              <span className="sm:hidden">Jokes 🃏</span>
            </button>
          )}

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
          const dayEvents = getEventStringsForDate(cell.key, dayLogs);
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
              className={`group relative h-[120px] sm:h-[135px] p-1.5 sm:p-2 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between border cursor-pointer overflow-hidden ${
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
              <div className="w-full shrink-0">
                <div className="flex items-center justify-between w-full">
                  {/* Gregorian Day Number */}
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 text-xs rounded-full font-medium shrink-0 transition ${
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
                    className={`text-[10px] sm:text-[11px] font-medium shrink-0 text-right px-1 ${
                      cell.isCurrentMonth ? 'text-pink-700/80' : 'text-stone-300'
                    }`}
                  >
                    {cell.hebrewInfo.hebrewDayLetter}
                  </span>
                </div>

                {/* Holiday Badge (Preserved in Hebrew) */}
                {cell.hebrewInfo.holidayName && (
                  <div className="w-full text-center mt-0.5">
                    <span
                      className="inline-block text-[8.5px] px-1 py-0.2 rounded-md bg-amber-100/80 text-amber-900 font-medium truncate max-w-full border border-amber-200/60 leading-tight"
                      title={cell.hebrewInfo.holidayName}
                    >
                      {cell.hebrewInfo.holidayName}
                    </span>
                  </div>
                )}
              </div>

              {/* Middle: Events & Ideas (Contained, never spills out of cell) */}
              <div className="flex-1 min-h-0 w-full my-0.5 overflow-hidden flex flex-col justify-start space-y-1">
                {/* Important Events (Chic Planner Washi Ribbon Tags) */}
                {dayEvents.length > 0 && (
                  <div className="space-y-0.5 w-full">
                    {dayEvents.slice(0, 2).map((evt, idx) => {
                      const parsed = parseEventItem(evt);
                      return (
                        <div
                          key={idx}
                          title={evt}
                          className="group/tag relative flex items-start gap-1 text-[9px] sm:text-[9.5px] px-1.5 py-0.5 rounded-md font-medium bg-[#fff3f6] hover:bg-[#ffeaf0] text-pink-950 border-l-[3px] border-l-pink-400 border-y border-r border-pink-200/70 shadow-2xs transition-all leading-tight break-words text-left w-full overflow-hidden"
                        >
                          <span className="text-[10px] shrink-0 mt-0.5 select-none leading-none">
                            {parsed.icon}
                          </span>
                          <span className="break-words leading-tight flex-1 line-clamp-2">
                            {parsed.title}
                          </span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <span className="text-[8.5px] text-pink-600 font-semibold block text-right px-1 leading-none">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                )}

                {/* Ideas & Thoughts dot */}
                {hasIdeas && (
                  <div className="flex items-center gap-1 text-[9px] text-amber-800 font-medium px-1 truncate">
                    <Lightbulb className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                    <span className="truncate hidden sm:inline">
                      {dayIdeas[0].title}
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom: Tasks pill & Mood/Flower (Fixed at bottom) */}
              <div className="w-full shrink-0 mt-auto pt-0.5 space-y-0.5">
                {/* Tasks pill */}
                {dayTasks.length > 0 && (
                  <div
                    className={`flex items-center gap-1 text-[9.5px] px-1.5 py-0.5 rounded-lg font-medium truncate ${
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

                {/* Day Mood Face & 🌸 Indicator Row */}
                <div className="flex items-center justify-between text-xs px-0.5 min-h-[14px]">
                  {/* Mood Face if chosen for this day */}
                  {dayLogs[cell.key]?.mood ? (
                    <span className="text-xs select-none leading-none" title="Mood Today">
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
