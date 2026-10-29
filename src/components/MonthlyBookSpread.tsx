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
import { 
  getHebrewDateInfo, 
  getHebrewMonthAndYear, 
  generateHebrewMonthCalendar, 
  getNextHebrewMonth, 
  getPrevHebrewMonth, 
  formatHebrewMonthTitle,
  HEBREW_DAYS_OF_WEEK_SHORT 
} from '../services/hebrewCalendar';

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
  // Calendar view mode: Gregorian vs Hebrew Month
  const [calendarViewMode, setCalendarViewMode] = useState<'gregorian' | 'hebrew'>(
    settings.calendarSystem || 'gregorian'
  );

  const initialDate = parseDateKey(selectedDate);
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth()); // 0-indexed

  const initialHebrew = getHebrewMonthAndYear(initialDate);
  const [currentHebrewYear, setCurrentHebrewYear] = useState<number>(initialHebrew.hebrewYear);
  const [currentHebrewMonth, setCurrentHebrewMonth] = useState<number>(initialHebrew.hebrewMonth);

  const todayKey = formatDateKey(new Date());
  const yearMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const monthlyNote = settings.monthlyNotes?.[yearMonthKey] || '';

  const prediction = settings.enableCycleTracker
    ? calculateCyclePrediction(cycleLogs, settings.averageCycleLength, settings.averagePeriodLength)
    : {};

  // Gregorian month navigation
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

  // Hebrew month navigation
  const handlePrevHebrewMonth = () => {
    const prev = getPrevHebrewMonth(currentHebrewYear, currentHebrewMonth);
    setCurrentHebrewYear(prev.year);
    setCurrentHebrewMonth(prev.month);
  };

  const handleNextHebrewMonth = () => {
    const next = getNextHebrewMonth(currentHebrewYear, currentHebrewMonth);
    setCurrentHebrewYear(next.year);
    setCurrentHebrewMonth(next.month);
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    const nowHeb = getHebrewMonthAndYear(now);
    setCurrentHebrewYear(nowHeb.hebrewYear);
    setCurrentHebrewMonth(nowHeb.hebrewMonth);
    onSelectDay(formatDateKey(now));
  };

  // Generate Gregorian calendar cells
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  interface NormalizedCalendarCell {
    key: string;
    date: Date;
    isCurrentMonth: boolean;
    mainBadge: string;
    cornerBadge: string;
    holidayName?: string;
  }

  const gregorianCells: NormalizedCalendarCell[] = [];

  // Previous month trailing days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - 1, prevMonthDays - i);
    const heb = getHebrewDateInfo(d);
    gregorianCells.push({
      key: formatDateKey(d),
      date: d,
      isCurrentMonth: false,
      mainBadge: String(d.getDate()),
      cornerBadge: heb.hebrewDayLetter,
      holidayName: heb.holidayName,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const d = new Date(currentYear, currentMonth, day);
    const heb = getHebrewDateInfo(d);
    gregorianCells.push({
      key: formatDateKey(d),
      date: d,
      isCurrentMonth: true,
      mainBadge: String(d.getDate()),
      cornerBadge: heb.hebrewDayLetter,
      holidayName: heb.holidayName,
    });
  }

  // Next month trailing days to complete rows
  const remainingGreg = 7 - (gregorianCells.length % 7);
  if (remainingGreg < 7) {
    for (let day = 1; day <= remainingGreg; day++) {
      const d = new Date(currentYear, currentMonth + 1, day);
      const heb = getHebrewDateInfo(d);
      gregorianCells.push({
        key: formatDateKey(d),
        date: d,
        isCurrentMonth: false,
        mainBadge: String(d.getDate()),
        cornerBadge: heb.hebrewDayLetter,
        holidayName: heb.holidayName,
      });
    }
  }

  // Generate Hebrew calendar cells
  const rawHebrewCells = generateHebrewMonthCalendar(currentHebrewYear, currentHebrewMonth);
  const hebrewNormalizedCells: NormalizedCalendarCell[] = rawHebrewCells.map((hc) => ({
    key: hc.dateKey,
    date: hc.date,
    isCurrentMonth: hc.isCurrentHebrewMonth,
    mainBadge: hc.hebrewDayLetter, // Prominent Hebrew letter (e.g. א׳, ט״ו, כ״ד)
    cornerBadge: `${hc.date.getDate()}/${hc.date.getMonth() + 1}`, // Subtle Gregorian date
    holidayName: hc.holidayName,
  }));

  // Active cells based on view mode
  const activeCells = calendarViewMode === 'gregorian' ? gregorianCells : hebrewNormalizedCells;
  const activeDaysOfWeek = calendarViewMode === 'gregorian' ? DAYS_OF_WEEK : HEBREW_DAYS_OF_WEEK_SHORT;

  // Hebrew month range for Gregorian header
  const midDate = new Date(currentYear, currentMonth, 15);
  const midHebrew = getHebrewDateInfo(midDate);

  // Gregorian date range for Hebrew month header
  const hebrewDateSpan = rawHebrewCells.length > 0
    ? `${rawHebrewCells[0].date.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })} - ${rawHebrewCells[rawHebrewCells.length - 1].date.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' })}`
    : '';

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
              onClick={calendarViewMode === 'gregorian' ? handlePrevMonth : handlePrevHebrewMonth}
              className="p-1.5 rounded-xl hover:bg-pink-100 text-pink-900 transition cursor-pointer border border-pink-200/80 bg-white shadow-2xs"
              title={calendarViewMode === 'gregorian' ? 'Previous Month' : 'חודש עברי קודם'}
            >
              <ChevronLeft className="w-4 h-4 text-pink-700" />
            </button>

            <div className="text-center md:text-left px-2">
              {calendarViewMode === 'gregorian' ? (
                <>
                  <div className="flex items-center justify-center md:justify-start gap-1.5">
                    <span className="text-sm">🎀</span>
                    <h2 className="text-xl sm:text-2xl font-medium text-pink-950 tracking-tight">
                      {ENGLISH_MONTHS[currentMonth]} {currentYear}
                    </h2>
                  </div>
                  <p className="text-xs text-pink-700/80 mt-0.5">
                    Hebrew Month: {midHebrew.hebrewMonthName} {midHebrew.hebrewYearLetter}
                  </p>
                </>
              ) : (
                <div dir="rtl">
                  <div className="flex items-center justify-center md:justify-start gap-1.5">
                    <span className="text-sm">🎀</span>
                    <h2 className="text-xl sm:text-2xl font-medium text-pink-950 tracking-tight font-sans">
                      {formatHebrewMonthTitle(currentHebrewYear, currentHebrewMonth)}
                    </h2>
                  </div>
                  <p className="text-xs text-pink-700/80 mt-0.5 font-sans">
                    טווח תאריכים לועזי: {hebrewDateSpan}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={calendarViewMode === 'gregorian' ? handleNextMonth : handleNextHebrewMonth}
              className="p-1.5 rounded-xl hover:bg-pink-100 text-pink-900 transition cursor-pointer border border-pink-200/80 bg-white shadow-2xs"
              title={calendarViewMode === 'gregorian' ? 'Next Month' : 'חודש עברי הבא'}
            >
              <ChevronRight className="w-4 h-4 text-pink-700" />
            </button>
          </div>
        </div>

        {/* View Mode Choice Toggle & Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          
          {/* Choice Toggle: Gregorian Month vs Hebrew Month - Small, elegant, English */}
          {/* Choice Toggle: Gregorian Month vs Hebrew Month - Small, elegant, English without emojis */}
          <div className="flex items-center p-0.5 bg-pink-100/70 rounded-full border border-pink-200/90 shadow-2xs">
            <button
              type="button"
              onClick={() => setCalendarViewMode('gregorian')}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium transition cursor-pointer ${
                calendarViewMode === 'gregorian'
                  ? 'bg-white text-pink-950 font-bold shadow-2xs'
                  : 'text-pink-900/70 hover:text-pink-950'
              }`}
              title="Gregorian Month View"
            >
              Gregorian
            </button>
            <button
              type="button"
              onClick={() => setCalendarViewMode('hebrew')}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium transition cursor-pointer ${
                calendarViewMode === 'hebrew'
                  ? 'bg-white text-pink-950 font-bold shadow-2xs'
                  : 'text-pink-900/70 hover:text-pink-950'
              }`}
              title="Hebrew Month View"
            >
              Hebrew
            </button>
          </div>

          {onOpenJokesDigest && (
            <button
              onClick={onOpenJokesDigest}
              className="px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/90 text-xs font-medium transition cursor-pointer flex items-center gap-1 shadow-2xs hover:scale-102"
              title="View Daily Gems & Quotes"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Gems</span>
            </button>
          )}

          <button
            onClick={handleJumpToToday}
            className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-400 via-rose-300 to-pink-400 text-white text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-xs hover:scale-102"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>{calendarViewMode === 'hebrew' ? 'היום' : 'Today'}</span>
          </button>

          <div className="hidden lg:flex items-center gap-3 text-[11px] text-pink-900/80 border-l border-pink-200 pl-3">
            <span className="flex items-center gap-1 font-medium text-rose-950">
              <span className="text-xs">⭐</span>
              {calendarViewMode === 'hebrew' ? 'אירועים' : 'Events'}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-pink-400" />
              {calendarViewMode === 'hebrew' ? 'משימות' : 'Tasks'}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {calendarViewMode === 'hebrew' ? 'פתקים' : 'Notes'}
            </span>
            <span className="flex items-center gap-1">
              <span className="text-xs">🌸</span>
              <span>{calendarViewMode === 'hebrew' ? 'אישי' : 'Personal'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Royal Calendar Grid: Days in soft pastel pink cards */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        
        {/* Days of week header */}
        {activeDaysOfWeek.map((dayName, idx) => (
          <div
            key={dayName}
            className={`py-1.5 text-center text-xs font-medium rounded-xl ${
              idx === 0 || idx === 6
                ? 'text-pink-950 bg-pink-200/60 border border-pink-300/60 font-semibold'
                : 'text-pink-900 bg-pink-100/40 border border-pink-200/50'
            }`}
          >
            {dayName}
          </div>
        ))}

        {/* Days Cells */}
        {activeCells.map((cell) => {
          const isToday = cell.key === todayKey;
          const isSelected = cell.key === selectedDate;

          const dayTasks = tasks.filter((t) => t.date === cell.key);
          const completedCount = dayTasks.filter((t) => t.completed).length;
          const dayIdeas = ideas.filter((i) => i.date === cell.key);
          const hasIdeas = dayIdeas.length > 0;
          const allDateEvents = getEventStringsForDate(cell.key, dayLogs);
          // Filter out daily recurring routines so they do not clutter the monthly calendar boxes
          const dayEvents = allDateEvents.filter((evt) => {
            const parsed = parseEventItem(evt);
            return parsed.recurrence !== 'daily';
          });
          const cycleLog = cycleLogs[cell.key];
          const isFlower = Boolean(cycleLog?.isPeriod && !cycleLog?.didNotOccur);
          const isDidNotOccur = Boolean(cycleLog?.didNotOccur);
          const cellHabits = dayLogs[cell.key]?.habitsProgress || {};
          const isDuolingoDone = Boolean(cellHabits['duolingo']);

          const isPredictedFlower =
            settings.enableCycleTracker &&
            !isDidNotOccur &&
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
              {/* Header row in cell: Prominent Badge & Secondary Badge */}
              <div className="w-full shrink-0">
                <div className={`flex items-center justify-between w-full ${calendarViewMode === 'hebrew' ? 'flex-row-reverse' : ''}`}>
                  {/* Primary Day Badge */}
                  <span
                    className={`inline-flex items-center justify-center text-xs rounded-full font-medium shrink-0 transition ${
                      calendarViewMode === 'hebrew' ? 'px-1.5 py-0.5 min-w-6 font-bold text-sm' : 'w-5 h-5 sm:w-6 sm:h-6'
                    } ${
                      isToday
                        ? 'bg-pink-500 text-white shadow-2xs font-bold'
                        : isFlower
                        ? 'bg-pink-400 text-white font-bold'
                        : cell.isCurrentMonth
                        ? 'text-pink-950 group-hover:text-pink-600'
                        : 'text-stone-400'
                    }`}
                  >
                    {cell.mainBadge}
                  </span>

                  {/* Secondary Date in Corner */}
                  <span
                    className={`text-[10px] sm:text-[11px] font-medium shrink-0 px-1 ${
                      cell.isCurrentMonth ? 'text-pink-700/80' : 'text-stone-300'
                    }`}
                  >
                    {cell.cornerBadge}
                  </span>
                </div>

                {/* Holiday Badge (Preserved in Hebrew) */}
                {cell.holidayName && (
                  <div className="w-full text-center mt-0.5">
                    <span
                      className="inline-block text-[8.5px] px-1 py-0.2 rounded-md bg-amber-100/80 text-amber-900 font-medium truncate max-w-full border border-amber-200/60 leading-tight"
                      title={cell.holidayName}
                    >
                      {cell.holidayName}
                    </span>
                  </div>
                )}
              </div>

              {/* Middle: Events & Ideas (Contained, never spills out of cell) */}
              <div className="flex-1 min-h-0 w-full my-0.5 overflow-hidden flex flex-col justify-start space-y-1">
                {/* Events & Routines (Distinguishing recurring tasks/workouts from milestone events) */}
                {dayEvents.length > 0 && (
                  <div className="space-y-0.5 w-full">
                    {dayEvents.slice(0, 2).map((evt, idx) => {
                      const parsed = parseEventItem(evt);
                      const isRoutine =
                        parsed.recurrence === 'weekly-custom' ||
                        parsed.recurrence === 'weekly' ||
                        parsed.recurrence === 'daily';

                      if (isRoutine) {
                        return (
                          <div
                            key={idx}
                            title={`${parsed.title} (מטלה / שגרה קבועה)`}
                            className="group/tag relative flex items-center gap-1 text-[8.5px] sm:text-[9px] px-1.5 py-0.5 rounded-md font-normal bg-stone-50/90 hover:bg-pink-50/70 text-stone-700 border border-dashed border-stone-300/80 shadow-2xs transition-all leading-tight break-words text-left w-full overflow-hidden"
                          >
                            <span className="w-1.5 h-1.5 rounded-full border border-pink-400 bg-pink-100 shrink-0" />
                            <span className="text-[9.5px] shrink-0 select-none leading-none">
                              {parsed.icon}
                            </span>
                            <span className="break-words leading-tight flex-1 line-clamp-1 text-stone-700 font-medium">
                              {parsed.title}
                            </span>
                          </div>
                        );
                      }

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

                {/* Day Mood Face, Duolingo 🦉 & 🌸 Indicator Row */}
                <div className="flex items-center justify-between text-xs px-0.5 min-h-[14px]">
                  <div className="flex items-center gap-1">
                    {/* Mood Face(s) if chosen for this day */}
                    {(() => {
                      const log = dayLogs[cell.key];
                      const moodsList: string[] = log?.moods && log.moods.length > 0
                        ? log.moods
                        : log?.mood
                        ? [log.mood]
                        : [];

                      if (moodsList.length === 0) return null;

                      const moodToEmoji = (m: string) => {
                        switch (m) {
                          case 'great': return '💖';
                          case 'creative': return '🌷';
                          case 'calm': return '✨';
                          case 'tired': return '🥱';
                          case 'stressed': return '🌧️';
                          case 'angry': return '😠';
                          default: return '✨';
                        }
                      };

                      return (
                        <div className="flex items-center gap-0.5 text-[11px] select-none leading-none" title="Mood(s) Today">
                          {moodsList.slice(0, 3).map((m, idx) => (
                            <span key={idx}>{moodToEmoji(m)}</span>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Discreet Duolingo indicator - shown ONLY when completed on that day! */}
                    {isDuolingoDone && (
                      <span className="text-[11px] select-none leading-none" title="Duolingo practice completed ♡">
                        🦉
                      </span>
                    )}
                  </div>

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
