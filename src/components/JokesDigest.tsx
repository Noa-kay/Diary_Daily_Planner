import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Sparkles, 
  Search, 
  Trash2, 
  CalendarRange, 
  BookOpen, 
  Copy, 
  Check, 
  Share2,
  ChevronRight,
  Smile,
  Quote,
  Pencil,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DayLog, DailyWitItem } from '../types';
import { 
  getHebrewMonthAndYear, 
  getHebrewDateInfo, 
  HEBREW_MONTH_NAMES, 
  HEBREW_MONTH_ORDER,
  getHebrewYearLetter
} from '../services/hebrewCalendar';
import { parseDateKey, formatDateKey } from '../services/storage';

export interface EnrichedWitItem {
  id: string;
  type: 'joke' | 'idiom' | 'quote' | 'witticism';
  text: string;
  meaningOrPunchline?: string;
  createdAt: number;
  dateKey: string;
  gregorianDateStr: string;
  gregorianYear: number;
  gregorianMonth: number;
  hebrewDayLetter: string;
  hebrewMonthName: string;
  hebrewYearLetter: string;
  hebrewMonth: number;
  hebrewYear: number;
  monthYearKey: string; // e.g. "5787-7"
}

export const GREGORIAN_MONTH_NAMES = [
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

interface JokesDigestProps {
  allDayLogs: Record<string, DayLog>;
  onNavigateToDay: (dateStr: string) => void;
  onDeleteWitItem?: (dateKey: string, witId: string) => void;
  onUpdateWitItem?: (dateKey: string, witId: string, updated: Partial<DailyWitItem>) => void;
}

export const JokesDigest: React.FC<JokesDigestProps> = ({
  allDayLogs,
  onNavigateToDay,
  onDeleteWitItem,
  onUpdateWitItem,
}) => {
  const [viewMode, setViewMode] = useState<'hebrew' | 'gregorian' | 'annual'>('hebrew');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit item state
  const [editingItem, setEditingItem] = useState<EnrichedWitItem | null>(null);
  const [editText, setEditText] = useState('');
  const [editPunchline, setEditPunchline] = useState('');
  const [editType, setEditType] = useState<'joke' | 'idiom' | 'quote' | 'witticism'>('idiom');

  const handleStartEdit = (item: EnrichedWitItem) => {
    setEditingItem(item);
    setEditText(item.text);
    setEditPunchline(item.meaningOrPunchline || '');
    setEditType(item.type);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editText.trim()) return;
    if (onUpdateWitItem) {
      onUpdateWitItem(editingItem.dateKey, editingItem.id, {
        text: editText.trim(),
        meaningOrPunchline: editPunchline.trim() || undefined,
        type: editType,
      });
    }
    setEditingItem(null);
  };

  // Current date for default selection
  const now = useMemo(() => new Date(), []);
  const currentHebrew = useMemo(() => getHebrewMonthAndYear(now), [now]);

  const [selectedHebrewYear, setSelectedHebrewYear] = useState<number>(currentHebrew.hebrewYear);
  const [selectedHebrewMonth, setSelectedHebrewMonth] = useState<number>(currentHebrew.hebrewMonth);
  const [selectedGregorianYear, setSelectedGregorianYear] = useState<number>(now.getFullYear());
  const [selectedGregorianMonth, setSelectedGregorianMonth] = useState<number>(now.getMonth());

  // Extract and enrich all wit items across all days in database
  const allEnrichedItems: EnrichedWitItem[] = useMemo(() => {
    const items: EnrichedWitItem[] = [];

    Object.entries(allDayLogs).forEach(([dateKey, dayLog]) => {
      if (!dayLog || !dayLog.witItems || dayLog.witItems.length === 0) return;

      const dateObj = parseDateKey(dateKey);
      const hInfo = getHebrewDateInfo(dateObj);
      const hMonthYear = getHebrewMonthAndYear(dateObj);

      dayLog.witItems.forEach((wit) => {
        items.push({
          id: wit.id,
          type: wit.type,
          text: wit.text,
          meaningOrPunchline: wit.meaningOrPunchline,
          createdAt: wit.createdAt || 0,
          dateKey,
          gregorianDateStr: dateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          gregorianYear: dateObj.getFullYear(),
          gregorianMonth: dateObj.getMonth(),
          hebrewDayLetter: hInfo.hebrewDayLetter,
          hebrewMonthName: hMonthYear.hebrewMonthName,
          hebrewYearLetter: hMonthYear.hebrewYearLetter,
          hebrewMonth: hMonthYear.hebrewMonth,
          hebrewYear: hMonthYear.hebrewYear,
          monthYearKey: hMonthYear.key,
        });
      });
    });

    // Sort descending by date & created time
    return items.sort((a, b) => {
      if (b.dateKey !== a.dateKey) {
        return b.dateKey.localeCompare(a.dateKey);
      }
      return b.createdAt - a.createdAt;
    });
  }, [allDayLogs]);

  // Available Hebrew years in the database (or current year)
  const availableHebrewYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(currentHebrew.hebrewYear);
    allEnrichedItems.forEach((item) => yearsSet.add(item.hebrewYear));
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [allEnrichedItems, currentHebrew.hebrewYear]);

  // Available Gregorian years in the database (or current year)
  const availableGregorianYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(now.getFullYear());
    allEnrichedItems.forEach((item) => yearsSet.add(item.gregorianYear));
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [allEnrichedItems, now]);

  // Filter items based on active view, search, and type
  const displayedItems = useMemo(() => {
    return allEnrichedItems.filter((item) => {
      // 1. Time Scope Filter
      if (viewMode === 'hebrew') {
        if (item.hebrewYear !== selectedHebrewYear || item.hebrewMonth !== selectedHebrewMonth) {
          return false;
        }
      } else if (viewMode === 'gregorian') {
        if (item.gregorianYear !== selectedGregorianYear || item.gregorianMonth !== selectedGregorianMonth) {
          return false;
        }
      } else {
        // annual
        if (item.hebrewYear !== selectedHebrewYear) {
          return false;
        }
      }

      // 2. Type Filter
      if (selectedType !== 'all' && item.type !== selectedType) {
        return false;
      }

      // 3. Search Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesText = item.text.toLowerCase().includes(query);
        const matchesPunch = (item.meaningOrPunchline || '').toLowerCase().includes(query);
        const matchesDate = item.gregorianDateStr.toLowerCase().includes(query) || item.hebrewMonthName.includes(query);
        if (!matchesText && !matchesPunch && !matchesDate) {
          return false;
        }
      }

      return true;
    });
  }, [allEnrichedItems, viewMode, selectedHebrewYear, selectedHebrewMonth, selectedGregorianYear, selectedGregorianMonth, selectedType, searchQuery]);

  // Statistics
  const jokesCount = useMemo(() => displayedItems.filter((i) => i.type === 'joke').length, [displayedItems]);
  const idiomsCount = useMemo(() => displayedItems.filter((i) => i.type === 'idiom').length, [displayedItems]);
  const quotesCount = useMemo(() => displayedItems.filter((i) => i.type === 'quote').length, [displayedItems]);

  const handleCopy = (item: EnrichedWitItem) => {
    const punch = item.meaningOrPunchline ? `\n↳ ${item.meaningOrPunchline}` : '';
    const shareText = `"${item.text}"${punch}\n— From My Planner (${item.hebrewMonthName} ${item.hebrewYearLetter})`;
    navigator.clipboard.writeText(shareText);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleFireConfetti = () => {
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#fbbf24', '#f472b6', '#60a5fa'],
    });
  };

  return (
    <div className="relative max-w-5xl mx-auto rounded-3xl bg-[#fffbfc] p-3 sm:p-7 shadow-xs border border-pink-200/80 animate-in fade-in-50 duration-300">
      {/* Decorative Ribbon Bows */}
      <div className="absolute -top-3.5 left-6 text-2xl select-none">🎀</div>
      <div className="absolute -top-3.5 right-6 text-2xl select-none">🎀</div>

      {/* HEADER */}
      <div className="text-center pb-5 mb-5 border-b border-pink-200/80">
        <p className="text-xs text-pink-500 font-script tracking-widest uppercase mb-0.5">
          ✦ THE GEMS & WISDOM TREASURY ✦
        </p>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-pink-950 tracking-tight my-1">
          DAILY GEMS <span className="font-script text-pink-500 italic font-normal text-4xl sm:text-5xl">& Wisdom 💎</span>
        </h1>
        <p className="text-xs text-pink-700/80 max-w-lg mx-auto mb-4 leading-relaxed">
          Treasury of all the gems, funny jokes, catchy idioms, and witty quotes you recorded throughout the Hebrew months and years!
        </p>

        {/* View Mode Toggle: Hebrew Month vs Gregorian Month vs Annual */}
        <div className="inline-flex flex-wrap items-center justify-center p-1 bg-pink-100/70 rounded-2xl border border-pink-200 shadow-2xs gap-1">
          <button
            type="button"
            onClick={() => setViewMode('hebrew')}
            className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'hebrew'
                ? 'bg-white text-pink-950 shadow-xs border border-pink-200/80'
                : 'text-pink-800 hover:text-pink-950'
            }`}
          >
            <span>🌙</span>
            <span>Hebrew Month (חודש עברי)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('gregorian')}
            className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'gregorian'
                ? 'bg-white text-pink-950 shadow-xs border border-pink-200/80'
                : 'text-pink-800 hover:text-pink-950'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5 text-pink-500" />
            <span>Gregorian Month (חודש לועזי)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('annual')}
            className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'annual'
                ? 'bg-white text-pink-950 shadow-xs border border-pink-200/80'
                : 'text-pink-800 hover:text-pink-950'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5 text-amber-500" />
            <span>Annual (שנתי)</span>
          </button>
        </div>
      </div>

      {/* CONTROLS & SELECTORS BAR */}
      <div className="p-4 rounded-2xl bg-[#fff7fa] border border-pink-200/90 shadow-2xs mb-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Date Pickers */}
          <div className="flex flex-wrap items-center gap-2">
            {viewMode === 'hebrew' && (
              <>
                {/* Hebrew Year Selector */}
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-pink-200 shadow-2xs text-xs">
                  <span className="text-stone-500 font-medium">Year:</span>
                  <select
                    value={selectedHebrewYear}
                    onChange={(e) => setSelectedHebrewYear(Number(e.target.value))}
                    className="font-bold text-pink-950 bg-transparent focus:outline-none cursor-pointer"
                  >
                    {availableHebrewYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {getHebrewYearLetter(yr)} ({yr})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hebrew Month Selector */}
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-pink-200 shadow-2xs text-xs">
                  <span className="text-stone-500 font-medium">Month:</span>
                  <select
                    value={selectedHebrewMonth}
                    onChange={(e) => setSelectedHebrewMonth(Number(e.target.value))}
                    className="font-bold text-pink-950 bg-transparent focus:outline-none cursor-pointer"
                  >
                    {HEBREW_MONTH_ORDER.map((mNum) => (
                      <option key={mNum} value={mNum}>
                        {HEBREW_MONTH_NAMES[mNum]} ({mNum})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Jump to Current Hebrew Month button */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedHebrewYear(currentHebrew.hebrewYear);
                    setSelectedHebrewMonth(currentHebrew.hebrewMonth);
                  }}
                  className="text-xs px-2.5 py-1.5 rounded-xl bg-pink-100/60 hover:bg-pink-100 text-pink-900 border border-pink-200/80 cursor-pointer transition font-medium"
                >
                  Current: {currentHebrew.hebrewMonthName} {currentHebrew.hebrewYearLetter}
                </button>
              </>
            )}

            {viewMode === 'gregorian' && (
              <>
                {/* Gregorian Year Selector */}
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-pink-200 shadow-2xs text-xs">
                  <span className="text-stone-500 font-medium">Year:</span>
                  <select
                    value={selectedGregorianYear}
                    onChange={(e) => setSelectedGregorianYear(Number(e.target.value))}
                    className="font-bold text-pink-950 bg-transparent focus:outline-none cursor-pointer"
                  >
                    {availableGregorianYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Gregorian Month Selector */}
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-pink-200 shadow-2xs text-xs">
                  <span className="text-stone-500 font-medium">Month:</span>
                  <select
                    value={selectedGregorianMonth}
                    onChange={(e) => setSelectedGregorianMonth(Number(e.target.value))}
                    className="font-bold text-pink-950 bg-transparent focus:outline-none cursor-pointer"
                  >
                    {GREGORIAN_MONTH_NAMES.map((name, idx) => (
                      <option key={name} value={idx}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Jump to Current Gregorian Month */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGregorianYear(now.getFullYear());
                    setSelectedGregorianMonth(now.getMonth());
                  }}
                  className="text-xs px-2.5 py-1.5 rounded-xl bg-pink-100/60 hover:bg-pink-100 text-pink-900 border border-pink-200/80 cursor-pointer transition font-medium"
                >
                  Current: {GREGORIAN_MONTH_NAMES[now.getMonth()]} {now.getFullYear()}
                </button>
              </>
            )}

            {viewMode === 'annual' && (
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-pink-200 shadow-2xs text-xs">
                <span className="text-stone-500 font-medium">Year:</span>
                <select
                  value={selectedHebrewYear}
                  onChange={(e) => setSelectedHebrewYear(Number(e.target.value))}
                  className="font-bold text-pink-950 bg-transparent focus:outline-none cursor-pointer"
                >
                  {availableHebrewYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {getHebrewYearLetter(yr)} ({yr})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Quick Counter Badges */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-white border border-pink-200 text-pink-950 font-bold shadow-2xs">
              {displayedItems.length} Total
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-medium border border-amber-200">
              😂 {jokesCount} Jokes
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[11px] font-medium border border-purple-200">
              💡 {idiomsCount} Idioms
            </span>
            {quotesCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 text-[11px] font-medium border border-sky-200">
                📜 {quotesCount} Quotes
              </span>
            )}
          </div>
        </div>

        {/* Search & Type Filter Row */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 border-t border-pink-100">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 text-pink-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jokes, punchlines, idioms, keywords..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-xl border border-pink-200 focus:outline-none focus:ring-1 focus:ring-pink-300 text-pink-950 placeholder:text-pink-300"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1 self-start sm:self-auto shrink-0">
            {[
              { id: 'all', label: 'All' },
              { id: 'joke', label: '😂 Jokes' },
              { id: 'idiom', label: '💡 Idioms' },
              { id: 'quote', label: '📜 Quotes' },
              { id: 'witticism', label: '✨ Witticisms' },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setSelectedType(chip.id)}
                className={`text-[11px] px-2.5 py-1 rounded-xl transition cursor-pointer ${
                  selectedType === chip.id
                    ? 'bg-pink-500 text-white font-semibold shadow-2xs'
                    : 'bg-white hover:bg-pink-50 text-stone-600 border border-pink-100'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SUMMARY BANNER */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/80 via-[#fffbfd] to-pink-50/80 border border-amber-200/80 shadow-2xs mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl shrink-0 border border-amber-200 shadow-2xs">
            {viewMode === 'hebrew' ? '🌙' : viewMode === 'gregorian' ? '🗓️' : '⭐'}
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <span>
                {viewMode === 'hebrew'
                  ? `Summary for ${HEBREW_MONTH_NAMES[selectedHebrewMonth] || ''} ${getHebrewYearLetter(selectedHebrewYear)}`
                  : viewMode === 'gregorian'
                  ? `Summary for ${GREGORIAN_MONTH_NAMES[selectedGregorianMonth]} ${selectedGregorianYear}`
                  : `Annual Treasury for ${getHebrewYearLetter(selectedHebrewYear)}`}
              </span>
              <span className="text-[10px] font-sans font-normal text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200">
                {displayedItems.length} Entries
              </span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {viewMode === 'hebrew'
                ? `All gems, jokes, and idioms entered during the Hebrew month of ${HEBREW_MONTH_NAMES[selectedHebrewMonth] || ''}.`
                : viewMode === 'gregorian'
                ? `All gems, jokes, and idioms entered during the Gregorian month of ${GREGORIAN_MONTH_NAMES[selectedGregorianMonth]} ${selectedGregorianYear}.`
                : `Comprehensive annual archive of all laughs and wisdom recorded in ${getHebrewYearLetter(selectedHebrewYear)}.`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleFireConfetti}
          className="self-end sm:self-center px-3 py-1.5 rounded-xl bg-white hover:bg-pink-50 border border-pink-200 text-pink-900 text-xs font-semibold shadow-2xs transition cursor-pointer flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-500" />
          <span>Celebrate Smiles ✨</span>
        </button>
      </div>

      {/* WIT ITEMS GRID / LIST */}
      {displayedItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {displayedItems.map((item) => {
            const isJoke = item.type === 'joke';
            const isIdiom = item.type === 'idiom';
            const isQuote = item.type === 'quote';

            return (
              <div
                key={`${item.dateKey}-${item.id}`}
                className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between shadow-2xs hover:shadow-sm ${
                  isJoke
                    ? 'bg-white border-amber-200/90 hover:border-amber-300'
                    : isIdiom
                    ? 'bg-white border-purple-200/90 hover:border-purple-300'
                    : 'bg-white border-pink-200/90 hover:border-pink-300'
                }`}
              >
                <div>
                  {/* Top Meta: Type badge, Hebrew Date badge, Gregorian Date */}
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-stone-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">
                        {isJoke ? '😂' : isIdiom ? '💡' : isQuote ? '📜' : '✨'}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isJoke
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : isIdiom
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-pink-50 text-pink-800 border-pink-200'
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-right">
                      {/* Hebrew date stamp */}
                      <span className="text-[11px] font-serif font-bold text-pink-900 bg-pink-50 px-2 py-0.5 rounded-md border border-pink-200/70">
                        {item.hebrewDayLetter} {item.hebrewMonthName}
                      </span>
                      {/* Gregorian date */}
                      <span className="text-[10px] text-stone-400">
                        {item.gregorianDateStr}
                      </span>
                    </div>
                  </div>

                  {/* Joke setup / Idiom */}
                  <div dir="auto" className="text-sm font-semibold text-stone-900 leading-snug my-1 text-start">
                    {item.text}
                  </div>

                  {/* Punchline / Meaning */}
                  {item.meaningOrPunchline && (
                    <div dir="auto" className="mt-2 p-2.5 rounded-xl bg-[#fff8fa] border border-pink-100 text-xs text-pink-950 leading-relaxed font-script text-start">
                      <span className="font-bold text-pink-500 mr-1">
                        {isJoke ? '↳ Punchline: ' : isIdiom ? '↳ Meaning: ' : '↳ '}
                      </span>
                      <span>{item.meaningOrPunchline}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions: View on Day Page, Copy, Edit, Delete */}
                <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-stone-100 text-xs">
                  <button
                    type="button"
                    onClick={() => onNavigateToDay(item.dateKey)}
                    className="inline-flex items-center gap-1 text-pink-700 hover:text-pink-950 font-medium hover:underline cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-pink-500" />
                    <span>Open in Daily Page</span>
                    <ChevronRight className="w-3 h-3 text-pink-400" />
                  </button>

                  <div className="flex items-center gap-1">
                    {onUpdateWitItem && (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="p-1 px-2 rounded-lg hover:bg-amber-50 text-stone-600 hover:text-amber-800 transition cursor-pointer flex items-center gap-1 text-[11px] border border-stone-200 hover:border-amber-200"
                        title="Edit this entry"
                      >
                        <Pencil className="w-3 h-3 text-amber-600" />
                        <span>Edit</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCopy(item)}
                      className="p-1 px-2 rounded-lg hover:bg-stone-100 text-stone-600 transition cursor-pointer flex items-center gap-1 text-[11px]"
                      title="Copy text"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700 font-medium">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-stone-500" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {onDeleteWitItem && (
                      <button
                        type="button"
                        onClick={() => onDeleteWitItem(item.dateKey, item.id)}
                        className="p-1 text-stone-400 hover:text-rose-500 rounded-lg cursor-pointer transition"
                        title="Delete from diary"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-12 px-6 rounded-3xl bg-white border border-dashed border-pink-200 text-center max-w-lg mx-auto space-y-3">
          <div className="w-14 h-14 rounded-full bg-pink-50 text-pink-500 text-2xl flex items-center justify-center mx-auto border border-pink-200">
            🃏
          </div>
          <h4 className="text-base font-bold text-pink-950">
            {viewMode === 'hebrew'
              ? `No gems or wisdom found for חודש ${HEBREW_MONTH_NAMES[selectedHebrewMonth] || ''} ${getHebrewYearLetter(selectedHebrewYear)}`
              : viewMode === 'gregorian'
              ? `No gems or wisdom found for ${GREGORIAN_MONTH_NAMES[selectedGregorianMonth]} ${selectedGregorianYear}`
              : `No gems or wisdom recorded for שנת ${getHebrewYearLetter(selectedHebrewYear)}`}
          </h4>
          <p className="text-xs text-stone-500 leading-relaxed">
            Whenever you record a joke, quote, or idiom on any daily page, it will automatically appear here in your selected monthly and annual digest!
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigateToDay(formatDateKey(new Date()))}
              className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold shadow-2xs transition cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Go to Today's Page</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit Entry Modal in JokesDigest */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-pink-200 space-y-4">
            <div className="flex items-center justify-between border-b border-pink-100 pb-2">
              <h3 className="text-sm font-bold text-pink-950 flex items-center gap-1.5">
                <Pencil className="w-4 h-4 text-pink-500" />
                <span>Edit Entry ({editingItem.hebrewDayLetter} {editingItem.hebrewMonthName})</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {(['joke', 'idiom', 'quote', 'witticism'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEditType(t)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition cursor-pointer capitalize ${
                      editType === t
                        ? 'bg-pink-500 text-white font-bold border-pink-600'
                        : 'bg-stone-50 border-stone-200 text-stone-700'
                    }`}
                  >
                    {t === 'joke' ? '😂 Joke' : t === 'idiom' ? '💡 Idiom' : t === 'quote' ? '📜 Quote' : '✨ Witticism'}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Text / Phrasing (טקסט / תוכן):
                </label>
                <textarea
                  rows={3}
                  dir="auto"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full p-2.5 text-xs bg-pink-50/20 rounded-xl border border-pink-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-400 text-stone-900 text-start"
                  placeholder="The phrase, joke, or idiom..."
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Meaning / Punchline (פירוש / הסבר / שורת מחץ):
                </label>
                <input
                  type="text"
                  dir="auto"
                  value={editPunchline}
                  onChange={(e) => setEditPunchline(e.target.value)}
                  className="w-full p-2 text-xs bg-pink-50/20 rounded-xl border border-pink-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-400 text-stone-900 text-start"
                  placeholder="Meaning or punchline (optional)..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-pink-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editText.trim()}
                  className="px-4 py-1.5 text-xs font-semibold bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white rounded-xl shadow-2xs transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
