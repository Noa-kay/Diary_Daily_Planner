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
  Quote
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
  hebrewDayLetter: string;
  hebrewMonthName: string;
  hebrewYearLetter: string;
  hebrewMonth: number;
  hebrewYear: number;
  monthYearKey: string; // e.g. "5787-7"
}

interface JokesDigestProps {
  allDayLogs: Record<string, DayLog>;
  onNavigateToDay: (dateStr: string) => void;
  onDeleteWitItem?: (dateKey: string, witId: string) => void;
}

export const JokesDigest: React.FC<JokesDigestProps> = ({
  allDayLogs,
  onNavigateToDay,
  onDeleteWitItem,
}) => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'yearly'>('monthly');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Current date for default selection
  const now = useMemo(() => new Date(), []);
  const currentHebrew = useMemo(() => getHebrewMonthAndYear(now), [now]);

  const [selectedHebrewYear, setSelectedHebrewYear] = useState<number>(currentHebrew.hebrewYear);
  const [selectedHebrewMonth, setSelectedHebrewMonth] = useState<number>(currentHebrew.hebrewMonth);

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

  // Filter items based on active view, search, and type
  const displayedItems = useMemo(() => {
    return allEnrichedItems.filter((item) => {
      // 1. Time Scope Filter
      if (activeTab === 'monthly') {
        if (item.hebrewYear !== selectedHebrewYear || item.hebrewMonth !== selectedHebrewMonth) {
          return false;
        }
      } else {
        // yearly
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
  }, [allEnrichedItems, activeTab, selectedHebrewYear, selectedHebrewMonth, selectedType, searchQuery]);

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
          ✦ THE LAUGHTER & WISDOM DIGEST ✦
        </p>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-pink-950 tracking-tight my-1">
          JOKES & IDIOMS <span className="font-script text-pink-500 italic font-normal text-4xl sm:text-5xl">Treasury 🃏</span>
        </h1>
        <p className="text-xs text-pink-700/80 max-w-lg mx-auto mb-4 leading-relaxed">
          Summary book of all the jokes, funny moments, catchy idioms, and witty quotes you recorded throughout the Hebrew months and years!
        </p>

        {/* Big Switch: Monthly Summary vs Yearly Summary */}
        <div className="inline-flex items-center p-1 bg-pink-100/70 rounded-2xl border border-pink-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`px-4 sm:px-6 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'monthly'
                ? 'bg-white text-pink-950 shadow-xs border border-pink-200/80'
                : 'text-pink-800 hover:text-pink-950'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5 text-pink-500" />
            <span>Monthly Digest</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('yearly')}
            className={`px-4 sm:px-6 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'yearly'
                ? 'bg-white text-pink-950 shadow-xs border border-pink-200/80'
                : 'text-pink-800 hover:text-pink-950'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5 text-amber-500" />
            <span>Annual Treasury</span>
          </button>
        </div>
      </div>

      {/* CONTROLS & SELECTORS BAR */}
      <div className="p-4 rounded-2xl bg-[#fff7fa] border border-pink-200/90 shadow-2xs mb-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Hebrew Date Pickers */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Year Selector */}
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

            {/* Month Selector (Shown in monthly view) */}
            {activeTab === 'monthly' && (
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
            )}

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
            {activeTab === 'monthly' ? '🌙' : '⭐'}
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <span>
                {activeTab === 'monthly'
                  ? `Summary for ${HEBREW_MONTH_NAMES[selectedHebrewMonth] || ''} ${getHebrewYearLetter(selectedHebrewYear)}`
                  : `Annual Treasury for ${getHebrewYearLetter(selectedHebrewYear)}`}
              </span>
              <span className="text-[10px] font-sans font-normal text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200">
                {displayedItems.length} Entries
              </span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {activeTab === 'monthly'
                ? `All jokes and idioms entered during this Hebrew month.`
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
                  <div className="text-sm font-semibold text-stone-900 leading-snug my-1">
                    "{item.text}"
                  </div>

                  {/* Punchline / Meaning */}
                  {item.meaningOrPunchline && (
                    <div className="mt-2 p-2.5 rounded-xl bg-[#fff8fa] border border-pink-100 text-xs text-pink-950 leading-relaxed font-script">
                      <span className="font-bold text-pink-500 mr-1">
                        {isJoke ? '↳ Punchline: ' : isIdiom ? '↳ Meaning: ' : '↳ '}
                      </span>
                      <span>{item.meaningOrPunchline}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions: View on Day Page, Copy, Delete */}
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
                    <button
                      type="button"
                      onClick={() => handleCopy(item)}
                      className="p-1 px-2 rounded-lg hover:bg-stone-100 text-stone-600 transition cursor-pointer flex items-center gap-1 text-[11px]"
                      title="Copy joke text"
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
            {activeTab === 'monthly'
              ? `No jokes or idioms found for חודש ${HEBREW_MONTH_NAMES[selectedHebrewMonth] || ''} ${getHebrewYearLetter(selectedHebrewYear)}`
              : `No jokes or idioms recorded for שנת ${getHebrewYearLetter(selectedHebrewYear)}`}
          </h4>
          <p className="text-xs text-stone-500 leading-relaxed">
            Whenever you record a joke or idiom on any daily page, it will automatically appear here in this Hebrew monthly summary and in the annual archive!
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
    </div>
  );
};
