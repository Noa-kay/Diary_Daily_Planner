import React, { useState, useMemo } from 'react';
import { 
  Heart, 
  Calendar as CalendarIcon, 
  Sparkles, 
  Settings as SettingsIcon, 
  ChevronRight, 
  ChevronLeft, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Check, 
  Clock, 
  Coffee,
  Smile,
  AlertCircle,
  FileText,
  Zap,
  Battery,
  BatteryCharging,
  Droplets
} from 'lucide-react';
import { CycleDayLog, FlowLevel, CycleSymptom, AppSettings } from '../types';
import { formatDateKey, parseDateKey, calculateCyclePrediction } from '../services/storage';
import { getHebrewDateInfo } from '../services/hebrewCalendar';

interface CycleTrackerProps {
  cycleLogs: Record<string, CycleDayLog>;
  onUpdateCycleLog: (date: string, partial: Partial<CycleDayLog>) => void;
  settings: AppSettings;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

const FLOW_LEVELS: { id: FlowLevel; label: string; icon: string; description: string }[] = [
  { id: 'heavy', label: 'Heavy', icon: '🩸', description: 'Intense flow' },
  { id: 'medium', label: 'Medium', icon: '💧💧', description: 'Regular flow' },
  { id: 'light', label: 'Light', icon: '💧', description: 'Gentle flow' },
  { id: 'spotting', label: 'Spotting', icon: '🌸', description: 'Minimal spotting' },
];

const SYMPTOMS: { id: CycleSymptom; legacyId?: string; label: string; icon: string }[] = [
  { id: 'Cramps', legacyId: 'התכווצויות', label: 'Cramps', icon: '⚡' },
  { id: 'Fatigue', legacyId: 'עייפות', label: 'Fatigue', icon: '💤' },
  { id: 'Bloating', legacyId: 'נפיחות', label: 'Bloating', icon: '☁️' },
  { id: 'Acne', legacyId: 'פצעונים', label: 'Acne', icon: '🌸' },
  { id: 'Headache', legacyId: 'כאב ראש', label: 'Headache', icon: '💆‍♀️' },
  { id: 'Backache', legacyId: 'כאבי גב', label: 'Back Pain', icon: '🦴' },
  { id: 'Mood Swings', legacyId: 'מצב רוח תנודתי', label: 'Mood Swings', icon: '🎭' },
  { id: 'Cravings', legacyId: 'חשקים למתוק', label: 'Cravings', icon: '🍫' },
];

const SELF_CARE_PLAN = [
  { id: 'water', label: 'Drink Water', icon: '💧' },
  { id: 'healthy', label: 'Eat Nourishing Meals', icon: '🥗' },
  { id: 'exercise', label: 'Light Stretching / Walk', icon: '🧘‍♀️' },
  { id: 'rest', label: 'Rest & Deep Sleep', icon: '💤' },
  { id: 'pamper', label: 'Warm Bath & Pampering', icon: '🛁' },
  { id: 'tea', label: 'Warm Herbal Tea', icon: '☕' },
];

const MOODS = [
  { id: 'happy', emoji: '😊', label: 'Happy' },
  { id: 'calm', emoji: '🌸', label: 'Calm' },
  { id: 'neutral', emoji: '😐', label: 'Neutral' },
  { id: 'sad', emoji: '🥺', label: 'Sad' },
  { id: 'anxious', emoji: '🌧️', label: 'Anxious' },
  { id: 'irritable', emoji: '😤', label: 'Irritable' },
];

export const CycleTracker: React.FC<CycleTrackerProps> = ({
  cycleLogs,
  onUpdateCycleLog,
  settings,
  onUpdateSettings,
  selectedDate,
  onSelectDate,
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [tempCycleLength, setTempCycleLength] = useState(settings.averageCycleLength || 28);
  const [tempPeriodLength, setTempPeriodLength] = useState(settings.averagePeriodLength || 5);

  const selectedDateObj = parseDateKey(selectedDate);
  const [calendarMonth, setCalendarMonth] = useState(selectedDateObj.getMonth());
  const [calendarYear, setCalendarYear] = useState(selectedDateObj.getFullYear());

  const currentLog = cycleLogs[selectedDate] || {
    date: selectedDate,
    isPeriod: false,
    symptoms: [],
    painLevel: 0,
    notes: '',
    moods: [],
    selfCare: [],
  };

  const selectedMoods = currentLog.moods || [];
  const handleToggleMood = (moodId: string) => {
    const isSelected = selectedMoods.includes(moodId);
    const updated = isSelected
      ? selectedMoods.filter((id) => id !== moodId)
      : [...selectedMoods, moodId];
    onUpdateCycleLog(selectedDate, {
      date: selectedDate,
      moods: updated,
    });
  };

  const energyLevel = currentLog.energyLevel;
  const handleSetEnergy = (lvl: 'vibrant' | 'balanced' | 'low' | 'recharging') => {
    onUpdateCycleLog(selectedDate, {
      date: selectedDate,
      energyLevel: energyLevel === lvl ? undefined : lvl,
    });
  };

  const hydrationCups = currentLog.hydrationCups ?? 0;
  const handleSetHydrationCups = (delta: number) => {
    const next = Math.max(0, Math.min(12, hydrationCups + delta));
    onUpdateCycleLog(selectedDate, {
      date: selectedDate,
      hydrationCups: next,
    });
  };

  const prediction = calculateCyclePrediction(
    cycleLogs,
    settings.averageCycleLength,
    settings.averagePeriodLength
  );

  // Determine cycle phase based on days since last period or cycle prediction
  const cyclePhaseInfo = useMemo(() => {
    if (currentLog.isPeriod && !currentLog.didNotOccur) {
      return {
        phase: 'Menstrual Phase 🌸',
        badge: 'Rest & Replenish',
        color: 'from-rose-50 to-pink-100',
        borderColor: 'border-rose-200',
        textColor: 'text-rose-950',
        focus: 'Gentle rest, warmth, iron & magnesium',
        tip: 'Honor your natural rhythm. Warm herbal teas, slow stretches, and warm nourishing foods.',
      };
    }

    const sortedPeriodStarts = Object.entries(cycleLogs)
      .filter(([_, log]) => log.isPeriod && !log.didNotOccur)
      .map(([dKey]) => dKey)
      .sort();

    if (sortedPeriodStarts.length > 0) {
      const pastStarts = sortedPeriodStarts.filter((k) => k <= selectedDate);
      if (pastStarts.length > 0) {
        const lastStart = pastStarts[pastStarts.length - 1];
        const diffMs = parseDateKey(selectedDate).getTime() - parseDateKey(lastStart).getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

        if (diffDays <= (settings.averagePeriodLength || 5)) {
          return {
            phase: 'Menstrual Phase 🌸',
            badge: `Day ${diffDays} • Rest & Reset`,
            color: 'from-rose-50 to-pink-100',
            borderColor: 'border-rose-200',
            textColor: 'text-rose-950',
            focus: 'Replenishing iron, deep hydration & kindness',
            tip: 'Slow down and recharge. Your body is naturally renewing its energy.',
          };
        } else if (diffDays <= 12) {
          return {
            phase: 'Follicular Phase 🌱',
            badge: `Day ${diffDays} • Rising Energy`,
            color: 'from-emerald-50 to-teal-50',
            borderColor: 'border-emerald-200',
            textColor: 'text-emerald-950',
            focus: 'Creativity, fresh beginnings & goal setting',
            tip: 'Estrogen is gently rising! Wonderful time for brainstorming, trying new recipes, and light workouts.',
          };
        } else if (diffDays <= 17) {
          return {
            phase: 'Ovulatory Phase ✨',
            badge: `Day ${diffDays} • Peak Radiance`,
            color: 'from-amber-50 to-orange-50',
            borderColor: 'border-amber-200',
            textColor: 'text-amber-950',
            focus: 'High vitality, confident expression & social time',
            tip: 'Your energy and communication are naturally sparkling. Enjoy social meetings, energetic movement, and vibrant meals.',
          };
        } else {
          return {
            phase: 'Luteal Phase 🌙',
            badge: `Day ${diffDays} • Winding Down`,
            color: 'from-purple-50 to-indigo-50',
            borderColor: 'border-purple-200',
            textColor: 'text-purple-950',
            focus: 'Completing projects, grounding routines & cozy evenings',
            tip: 'Progesterone encourages warmth and quiet comfort. Keep cozy, stay hydrated, and give yourself grace.',
          };
        }
      }
    }

    return {
      phase: 'Harmony & Wellness 🌿',
      badge: 'Daily Balance',
      color: 'from-pink-50 to-rose-50',
      borderColor: 'border-pink-200',
      textColor: 'text-pink-950',
      focus: 'Hydration, mindfulness & mindful listening to your body',
      tip: 'Listen gently to your body today. Tune into your energy and give yourself whatever comfort you need.',
    };
  }, [selectedDate, currentLog, cycleLogs, settings]);

  const handleTogglePeriod = () => {
    onUpdateCycleLog(selectedDate, {
      date: selectedDate,
      isPeriod: !currentLog.isPeriod,
      didNotOccur: false,
      flow: !currentLog.isPeriod ? (currentLog.flow || 'medium') : undefined,
    });
  };

  const handleMarkDidNotOccur = () => {
    onUpdateCycleLog(selectedDate, {
      date: selectedDate,
      isPeriod: false,
      didNotOccur: !currentLog.didNotOccur,
      flow: undefined,
    });
  };

  const handleSetFlow = (flow: FlowLevel) => {
    onUpdateCycleLog(selectedDate, {
      date: selectedDate,
      isPeriod: true,
      didNotOccur: false,
      flow,
    });
  };

  const handleSetPain = (level: number) => {
    onUpdateCycleLog(selectedDate, {
      date: selectedDate,
      painLevel: level === currentLog.painLevel ? 0 : level,
    });
  };

  const handleSetNotes = (notes: string) => {
    onUpdateCycleLog(selectedDate, {
      date: selectedDate,
      notes,
    });
  };

  const handleToggleSymptom = (symId: CycleSymptom) => {
    const currentSymptoms = currentLog.symptoms || [];
    const symDef = SYMPTOMS.find((s) => s.id === symId);
    const exists = currentSymptoms.some((s) => s === symId || (symDef?.legacyId && s === symDef.legacyId));
    const next = exists
      ? currentSymptoms.filter((s) => s !== symId && s !== symDef?.legacyId)
      : [...currentSymptoms, symId];

    onUpdateCycleLog(selectedDate, {
      date: selectedDate,
      symptoms: next,
    });
  };

  const handleSaveSettings = () => {
    onUpdateSettings({
      averageCycleLength: tempCycleLength,
      averagePeriodLength: tempPeriodLength,
    });
    setShowConfig(false);
  };

  // Mini calendar cells
  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const monthCells: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  for (let i = 0; i < firstDay; i++) {
    monthCells.push({ dateStr: '', dayNum: 0, isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    monthCells.push({ dateStr: dStr, dayNum: d, isCurrentMonth: true });
  }

  const dateObj = parseDateKey(selectedDate);
  const hebrewInfo = getHebrewDateInfo(dateObj);

  return (
    <div className="relative max-w-4xl mx-auto rounded-3xl bg-[#fffbfc] p-3 sm:p-7 shadow-xs border border-pink-200/80 animate-in fade-in-50 duration-300">
      
      {/* Decorative Ribbon in Corner (Image 1 style) */}
      <div className="absolute -top-3.5 left-6 text-2xl select-none animate-bounce duration-1000">🎀</div>
      <div className="absolute -top-3.5 right-6 text-2xl select-none">🎀</div>

      {/* HEADER: Inspired by Image 1 "Period Marking Planner" */}
      <div className="text-center pb-4 mb-4 border-b border-pink-200/80">
        
        {/* Navigation & Settings pill */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                const d = parseDateKey(selectedDate);
                d.setDate(d.getDate() - 1);
                onSelectDate(formatDateKey(d));
              }}
              className="p-1 px-2 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-900 transition cursor-pointer text-xs border border-pink-200"
              title="Previous Day"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-medium text-pink-950 px-2.5 py-0.5 bg-pink-50 rounded-full border border-pink-200">
              {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <button
              onClick={() => {
                const d = parseDateKey(selectedDate);
                d.setDate(d.getDate() + 1);
                onSelectDate(formatDateKey(d));
              }}
              className="p-1 px-2 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-900 transition cursor-pointer text-xs border border-pink-200"
              title="Next Day"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {prediction.currentCycleDay && (
              <span className="text-[11px] font-bold text-pink-800 bg-pink-100/80 px-3 py-1 rounded-full border border-pink-200">
                Cycle Day {prediction.currentCycleDay} of {settings.averageCycleLength} 🌸
              </span>
            )}
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-950 text-xs font-medium transition cursor-pointer border border-pink-200"
              title="Cycle Length Settings"
            >
              <SettingsIcon className="w-3.5 h-3.5 text-pink-600" />
              <span>Cycle Settings</span>
            </button>
          </div>
        </div>

        {/* Title & Slogan */}
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-pink-950 tracking-tight my-1">
          PERSONAL <span className="font-script text-pink-500 italic font-normal text-4xl sm:text-5xl">Tracker 🌸</span>
        </h1>
        <p className="text-xs font-script text-pink-600 tracking-wide">
          Track • Understand • Care • Empower ♡
        </p>

        {/* Date Row with Hebrew Date */}
        <div className="inline-flex flex-wrap items-center justify-center gap-3 px-4 py-1 rounded-2xl bg-pink-50/70 border border-pink-200/90 text-xs mt-2">
          <div className="text-pink-800 font-medium" dir="rtl">
            {hebrewInfo.fullHebrewDateStr}
            {hebrewInfo.holidayName && (
              <span className="mr-1.5 px-2 py-0.2 bg-amber-100 text-amber-900 rounded-full border border-amber-200/60 text-[10px]">
                {hebrewInfo.holidayName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Settings Panel Modal */}
      {showConfig && (
        <div className="mb-4 p-4 rounded-2xl bg-pink-50/80 border border-pink-200 space-y-3 animate-in fade-in">
          <h4 className="font-medium text-xs text-pink-950">
            Cycle Average Configuration:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-pink-900 mb-1">
                Average cycle length (days):
              </label>
              <input
                type="number"
                min={20}
                max={45}
                value={tempCycleLength}
                onChange={(e) => setTempCycleLength(Number(e.target.value))}
                className="w-full p-2 rounded-xl border border-pink-200 bg-white text-pink-950 font-medium"
              />
            </div>
            <div>
              <label className="block text-pink-900 mb-1">
                Average flow duration (days):
              </label>
              <input
                type="number"
                min={2}
                max={10}
                value={tempPeriodLength}
                onChange={(e) => setTempPeriodLength(Number(e.target.value))}
                className="w-full p-2 rounded-xl border border-pink-200 bg-white text-pink-950 font-medium"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setShowConfig(false)}
              className="px-3 py-1 rounded-xl text-xs text-pink-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSettings}
              className="px-4 py-1 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-medium"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          TOP SECTION (Image 1 style):
          Left: Mini Marking Calendar
          Right: Flow Tracker & Symptoms
         ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        
        {/* Left: Mini Marking Calendar (lg:col-span-6) */}
        <div className="lg:col-span-6 p-4 rounded-2xl bg-white border border-pink-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2 pb-1 border-b border-pink-100">
            <h3 className="text-xs font-bold text-pink-950 uppercase tracking-wider flex items-center gap-1.5">
              <span>🌸</span>
              <span>Marking Calendar</span>
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (calendarMonth === 0) {
                    setCalendarMonth(11);
                    setCalendarYear((y) => y - 1);
                  } else {
                    setCalendarMonth((m) => m - 1);
                  }
                }}
                className="p-1 rounded-lg hover:bg-pink-50 text-pink-700"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-medium text-pink-950 min-w-20 text-center">
                {new Date(calendarYear, calendarMonth).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
              <button
                onClick={() => {
                  if (calendarMonth === 11) {
                    setCalendarMonth(0);
                    setCalendarYear((y) => y + 1);
                  } else {
                    setCalendarMonth((m) => m + 1);
                  }
                }}
                className="p-1 rounded-lg hover:bg-pink-50 text-pink-700"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
              <div key={idx} className="text-[10px] font-bold text-pink-800/70 py-0.5">
                {day}
              </div>
            ))}
            {monthCells.map((cell, idx) => {
              if (!cell.isCurrentMonth) {
                return <div key={idx} className="h-7" />;
              }

              const isLogged = cycleLogs[cell.dateStr]?.isPeriod && !cycleLogs[cell.dateStr]?.didNotOccur;
              const isDidNotOccur = cycleLogs[cell.dateStr]?.didNotOccur;
              const isSelected = cell.dateStr === selectedDate;
              const isPredicted =
                !isDidNotOccur &&
                prediction.nextPeriodStart &&
                prediction.nextPeriodEnd &&
                cell.dateStr >= prediction.nextPeriodStart &&
                cell.dateStr <= prediction.nextPeriodEnd;

              return (
                <button
                  key={idx}
                  onClick={() => onSelectDate(cell.dateStr)}
                  className={`h-7 rounded-xl text-xs font-medium transition cursor-pointer flex flex-col items-center justify-center relative ${
                    isSelected
                      ? 'ring-2 ring-pink-400 bg-pink-100 font-bold text-pink-950'
                      : isLogged
                      ? 'bg-rose-400 text-white font-bold shadow-2xs'
                      : isDidNotOccur
                      ? 'bg-amber-100/90 text-amber-900 border border-amber-300 line-through'
                      : isPredicted
                      ? 'bg-pink-100/70 text-pink-800'
                      : 'hover:bg-pink-50 text-stone-700'
                  }`}
                  title={isDidNotOccur ? 'סומן: המחזור לא קרה בסוף' : undefined}
                >
                  <span>{cell.dayNum}</span>
                  {isLogged && (
                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-white" />
                  )}
                  {isDidNotOccur && (
                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-amber-600" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend (Image 1 style) */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3 mt-2 border-t border-pink-100 text-[10px] text-pink-900/80">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span>Marked Days</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-200" />
              <span>Expected Window</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-300 border border-amber-500" />
              <span>Did not occur</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="text-xs">🌸</span>
              <span>Selected</span>
            </span>
          </div>
        </div>

        {/* Right: Flow Tracker, Pain Rating & Symptoms (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-3.5">
          
          {/* Flow Tracker Box */}
          <div className="p-4 rounded-2xl bg-white border border-pink-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-pink-100">
              <h3 className="text-xs font-bold text-pink-950 uppercase tracking-wider flex items-center gap-1">
                <span>💧</span>
                <span>Flow Tracker</span>
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleTogglePeriod}
                  className={`text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full border transition cursor-pointer font-medium ${
                    currentLog.isPeriod
                      ? 'bg-rose-500 text-white border-rose-600 shadow-2xs'
                      : 'bg-pink-50 text-pink-900 border-pink-200 hover:bg-pink-100'
                  }`}
                >
                  {currentLog.isPeriod ? '🌸 Active Today' : '+ Mark Day 🌸'}
                </button>
                <button
                  type="button"
                  onClick={handleMarkDidNotOccur}
                  title="Mark that the expected period did not happen (false alarm / delayed)"
                  className={`text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full border transition cursor-pointer font-medium flex items-center gap-1 ${
                    currentLog.didNotOccur
                      ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs font-bold'
                      : 'bg-white hover:bg-amber-50 text-stone-600 hover:text-stone-900 border-stone-200 shadow-2xs'
                  }`}
                >
                  <span>{currentLog.didNotOccur ? '🚫 Did Not Occur' : 'Did Not Occur ✕'}</span>
                </button>
              </div>
            </div>

            {/* If marked did not occur, show subtle status note */}
            {currentLog.didNotOccur && (
              <div className="mb-2.5 px-3 py-1.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 flex items-center justify-between shadow-2xs animate-in fade-in">
                <span className="flex items-center gap-1.5 font-medium text-[11px]">
                  <span>🚫</span>
                  <span>Marked: Period did not occur on this day (False alarm).</span>
                </span>
                <button
                  type="button"
                  onClick={handleMarkDidNotOccur}
                  className="text-[10px] font-bold text-amber-800 hover:text-amber-950 px-2 py-0.5 rounded-md bg-white border border-amber-200 cursor-pointer shadow-2xs"
                >
                  Reset
                </button>
              </div>
            )}

            <div className="grid grid-cols-4 gap-2 mb-3">
              {FLOW_LEVELS.map((f) => {
                const isSelected = currentLog.isPeriod && currentLog.flow === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => handleSetFlow(f.id)}
                    className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-t from-pink-500 to-rose-400 text-white border-rose-500 shadow-xs scale-102 font-bold'
                        : 'bg-pink-50/20 hover:bg-pink-50 border-pink-100 text-pink-950'
                    }`}
                  >
                    <div className="text-lg">{f.icon}</div>
                    <div className="text-xs font-medium mt-0.5">{f.label}</div>
                  </button>
                );
              })}
            </div>

            {/* Pain / Comfort Rating 0-10 (Directly from Image 1!) */}
            <div className="pt-2 border-t border-pink-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-pink-950 uppercase tracking-wider">
                  Comfort / Pain Level (0 - 10):
                </span>
                <span className="text-xs font-bold text-rose-600">
                  {currentLog.painLevel || 0}/10
                </span>
              </div>
              <div className="grid grid-cols-11 gap-1 text-center">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                  const active = (currentLog.painLevel || 0) >= num && (currentLog.painLevel || 0) > 0;
                  return (
                    <button
                      key={num}
                      onClick={() => handleSetPain(num)}
                      className={`h-7 rounded-lg text-[10px] font-bold transition flex flex-col items-center justify-center cursor-pointer ${
                        currentLog.painLevel === num && num > 0
                          ? 'bg-rose-500 text-white shadow-2xs scale-110'
                          : active
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-pink-50/30 text-stone-500 hover:bg-pink-100'
                      }`}
                      title={`Level ${num}`}
                    >
                      <span>{num}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Symptoms Checklist (Image 1 style) */}
          <div className="p-4 rounded-2xl bg-white border border-pink-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-pink-100">
              <h3 className="text-xs font-bold text-pink-950 uppercase tracking-wider flex items-center gap-1">
                <span>✦</span>
                <span>Symptoms & Sensations</span>
              </h3>
              <span className="text-sm">🌸</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {SYMPTOMS.map((sym) => {
                const active = (currentLog.symptoms || []).some(
                  (s) => s === sym.id || (sym.legacyId && s === sym.legacyId)
                );
                return (
                  <button
                    key={sym.id}
                    onClick={() => handleToggleSymptom(sym.id)}
                    className={`p-1.5 px-2 rounded-xl border text-xs text-left flex items-center justify-between transition cursor-pointer ${
                      active
                        ? 'bg-pink-100 border-pink-300 text-pink-950 font-medium shadow-2xs'
                        : 'bg-pink-50/20 hover:bg-pink-50 border-pink-100 text-pink-900'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{sym.icon}</span>
                      <span className="text-[11px]">{sym.label}</span>
                    </div>
                    <span className="text-xs text-pink-500 font-bold">
                      {active ? '♥' : '♡'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          MIDDLE & BOTTOM SECTION (Image 1 style):
          1. Mood Tracker
          2. Self-Care Plan
          3. Cycle Insights & Notes
         ======================================================== */}
      {/* ========================================================
          MIDDLE & BOTTOM SECTION:
          1. Compact Mood Tracker (Delicate, tight layout)
          2. Energy & Vitality Level (Replaces unused self-care plan)
          3. Soothing Herbal Hydration (Cups counter)
         ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3.5">
        
        {/* 1. Mood Tracker (Compact & Proportional, Delicate Border) */}
        <div className="p-2.5 sm:p-3 rounded-2xl bg-white border border-pink-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-pink-100">
            <h3 className="text-xs font-bold text-pink-950 uppercase tracking-wider flex items-center gap-1">
              <span>😊</span>
              <span>Mood Tracker</span>
            </h3>
            {selectedMoods.length > 0 && (
              <span className="text-[10px] text-pink-500 font-script">{selectedMoods.length} selected</span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {MOODS.map((m) => {
              const isSelected = selectedMoods.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleToggleMood(m.id)}
                  className={`py-1.5 px-1 rounded-xl text-center transition cursor-pointer border flex flex-col items-center justify-center gap-0.5 ${
                    isSelected
                      ? 'bg-pink-100/90 border-pink-300 text-pink-950 font-semibold shadow-2xs'
                      : 'bg-pink-50/20 hover:bg-pink-50 border-pink-100/80 text-stone-700 opacity-80 hover:opacity-100'
                  }`}
                  title={isSelected ? `Click to deselect ${m.label}` : `Select ${m.label}`}
                >
                  <div className="text-lg leading-none select-none">{m.emoji}</div>
                  <div className="text-[9.5px] text-pink-950 font-medium leading-tight">{m.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Daily Energy & Vitality Battery (Interactive & Actionable) */}
        <div className="p-2.5 sm:p-3 rounded-2xl bg-white border border-pink-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-pink-100">
            <h3 className="text-xs font-bold text-pink-950 uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Vitality & Energy</span>
            </h3>
            <span className="text-[10px] text-amber-700 font-mono font-bold">
              {energyLevel === 'vibrant' ? '⚡ 100%' : energyLevel === 'balanced' ? '🌿 75%' : energyLevel === 'low' ? '🪫 35%' : energyLevel === 'recharging' ? '🔋 Rest' : 'Tap to log'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'vibrant' as const, label: 'Vibrant', icon: '⚡', desc: 'High Energy' },
              { id: 'balanced' as const, label: 'Balanced', icon: '🌿', desc: 'Steady Pace' },
              { id: 'low' as const, label: 'Low Battery', icon: '🪫', desc: 'Needs Calm' },
              { id: 'recharging' as const, label: 'Recharging', icon: '🔋', desc: 'Rest Mode' },
            ].map((lvl) => {
              const active = energyLevel === lvl.id;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => handleSetEnergy(lvl.id)}
                  className={`p-1.5 px-2 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                    active
                      ? 'bg-amber-100/90 border-amber-300 text-amber-950 font-semibold shadow-2xs'
                      : 'bg-pink-50/20 hover:bg-pink-50 border-pink-100 text-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm select-none">{lvl.icon}</span>
                    <div className="min-w-0">
                      <div className="text-[10.5px] font-bold leading-tight truncate">{lvl.label}</div>
                      <div className="text-[9px] text-stone-500 leading-none truncate">{lvl.desc}</div>
                    </div>
                  </div>
                  <span className="text-xs text-amber-600 font-bold ml-1">{active ? '✓' : ''}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Herbal Warmth & Soothing Hydration (Cups Counter) */}
        <div className="p-2.5 sm:p-3 rounded-2xl bg-white border border-pink-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-pink-100">
            <h3 className="text-xs font-bold text-pink-950 uppercase tracking-wider flex items-center gap-1">
              <Coffee className="w-3.5 h-3.5 text-pink-500" />
              <span>Herbal Warmth & Teas</span>
            </h3>
            <span className="text-[10px] font-bold text-pink-700 font-mono">{hydrationCups} cups</span>
          </div>

          <div className="space-y-1.5">
            <div className="p-2 rounded-xl bg-pink-50/50 border border-pink-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg select-none">🫖</span>
                <div>
                  <div className="text-[11px] font-semibold text-pink-950">Chamomile & Warm Teas</div>
                  <div className="text-[9.5px] text-pink-600 font-script">Soothing belly & body warmth</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSetHydrationCups(-1)}
                  disabled={hydrationCups <= 0}
                  className="w-6 h-6 rounded-lg bg-white border border-pink-200 text-pink-700 text-xs font-bold flex items-center justify-center disabled:opacity-30 hover:bg-pink-100 cursor-pointer shadow-2xs"
                >
                  -
                </button>
                <span className="w-5 text-center font-bold text-xs text-pink-950">{hydrationCups}</span>
                <button
                  type="button"
                  onClick={() => handleSetHydrationCups(1)}
                  className="w-6 h-6 rounded-lg bg-pink-500 text-white text-xs font-bold flex items-center justify-center hover:bg-pink-600 cursor-pointer shadow-2xs"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1 pt-0.5">
              {[1, 2, 3, 4, 5, 6].map((cupIdx) => (
                <button
                  key={cupIdx}
                  type="button"
                  onClick={() => handleSetHydrationCups(cupIdx === hydrationCups ? -1 : cupIdx - hydrationCups)}
                  className={`text-xs transition ${cupIdx <= hydrationCups ? 'text-pink-500 scale-110' : 'text-pink-200 hover:text-pink-300'}`}
                  title={`${cupIdx} cups`}
                >
                  ☕
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          CYCLE PHASE WISDOM & SYNC (Rich, empowering guidance based on body phase)
         ======================================================== */}
      <div className={`mt-3.5 p-3.5 rounded-2xl bg-gradient-to-r ${cyclePhaseInfo.color} border ${cyclePhaseInfo.borderColor} shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs sm:text-sm font-serif font-bold text-stone-900 flex items-center gap-1.5">
              <span>{cyclePhaseInfo.phase}</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 border border-pink-200 text-pink-900 shadow-2xs">
              {cyclePhaseInfo.badge}
            </span>
          </div>
          <p className="text-xs text-stone-700 leading-relaxed font-sans">
            <span className="font-bold">Focus:</span> {cyclePhaseInfo.focus} • {cyclePhaseInfo.tip}
          </p>
        </div>

        {/* Prediction summary pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 bg-white/90 px-3 py-1.5 rounded-xl border border-pink-200 shadow-2xs text-xs">
          <div className="text-right">
            <div className="text-[10px] text-stone-500 leading-none">Next Cycle Start:</div>
            <div className="font-bold text-rose-600 mt-0.5 font-mono">
              {prediction.nextPeriodStart || 'Tracking...'}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM QUOTE RIBBON (Image 1 style) */}
      <div className="text-center mt-4 pt-3 border-t border-pink-100 text-xs font-script text-pink-600 tracking-wide">
        ♥ Be kind to your body, it's doing its best. ♥
      </div>
    </div>
  );
};
