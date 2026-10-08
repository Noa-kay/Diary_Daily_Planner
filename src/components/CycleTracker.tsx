import React, { useState } from 'react';
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
  FileText
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
  };

  const prediction = calculateCyclePrediction(
    cycleLogs,
    settings.averageCycleLength,
    settings.averagePeriodLength
  );

  const handleTogglePeriod = () => {
    onUpdateCycleLog(selectedDate, {
      date: selectedDate,
      isPeriod: !currentLog.isPeriod,
      flow: !currentLog.isPeriod ? (currentLog.flow || 'medium') : undefined,
    });
  };

  const handleSetFlow = (flow: FlowLevel) => {
    onUpdateCycleLog(selectedDate, {
      date: selectedDate,
      isPeriod: true,
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

              const isLogged = cycleLogs[cell.dateStr]?.isPeriod;
              const isSelected = cell.dateStr === selectedDate;
              const isPredicted =
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
                      : isPredicted
                      ? 'bg-pink-100/70 text-pink-800'
                      : 'hover:bg-pink-50 text-stone-700'
                  }`}
                >
                  <span>{cell.dayNum}</span>
                  {isLogged && (
                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-white" />
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
              <button
                onClick={handleTogglePeriod}
                className={`text-[11px] px-2.5 py-0.5 rounded-full border transition cursor-pointer font-medium ${
                  currentLog.isPeriod
                    ? 'bg-rose-500 text-white border-rose-600 shadow-2xs'
                    : 'bg-pink-50 text-pink-900 border-pink-200 hover:bg-pink-100'
                }`}
              >
                {currentLog.isPeriod ? '🌸 Active Today' : '+ Mark Day 🌸'}
              </button>
            </div>

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-3.5">
        
        {/* Mood Tracker (Image 1 style) */}
        <div className="p-3.5 rounded-2xl bg-white border border-pink-200/90 shadow-2xs">
          <h3 className="text-xs font-bold text-pink-950 uppercase tracking-wider mb-2 flex items-center gap-1 pb-1 border-b border-pink-100">
            <span>😊</span>
            <span>Mood Tracker</span>
          </h3>

          <div className="grid grid-cols-3 gap-2">
            {MOODS.map((m) => (
              <div
                key={m.id}
                className="p-1.5 rounded-xl bg-pink-50/30 border border-pink-100 text-center hover:bg-pink-50 transition cursor-pointer"
              >
                <div className="text-xl">{m.emoji}</div>
                <div className="text-[10px] text-pink-950 font-medium mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Self-Care Plan (Image 1 style with coffee mug ☕) */}
        <div className="p-3.5 rounded-2xl bg-white border border-pink-200/90 shadow-2xs">
          <h3 className="text-xs font-bold text-pink-950 uppercase tracking-wider mb-2 flex items-center gap-1 pb-1 border-b border-pink-100">
            <span>☕</span>
            <span>Self-Care Plan</span>
          </h3>

          <div className="space-y-1">
            {SELF_CARE_PLAN.slice(0, 5).map((plan) => (
              <div
                key={plan.id}
                className="flex items-center gap-1.5 p-1 rounded-lg bg-pink-50/20 text-xs text-pink-950"
              >
                <span>{plan.icon}</span>
                <span className="text-[11px] truncate flex-1">{plan.label}</span>
                <span className="text-pink-400 text-xs">♡</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cycle Details & Predictions (Image 1 style) */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#fff2f6] via-[#fdf5f8] to-[#fff2f6] border border-pink-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-pink-950 uppercase tracking-wider mb-2 flex items-center gap-1 pb-1 border-b border-pink-100">
              <span>🌸</span>
              <span>Cycle Insights</span>
            </h3>

            <div className="space-y-1.5 text-xs text-pink-950">
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-white border border-pink-100">
                <span className="text-[11px] text-stone-500">Average Cycle:</span>
                <span className="font-bold text-pink-900">{settings.averageCycleLength} days</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-white border border-pink-100">
                <span className="text-[11px] text-stone-500">Duration:</span>
                <span className="font-bold text-pink-900">{settings.averagePeriodLength} days</span>
              </div>
              {prediction.nextPeriodStart && (
                <div className="flex items-center justify-between p-1.5 rounded-xl bg-white border border-pink-100">
                  <span className="text-[11px] text-stone-500">Next Predicted:</span>
                  <span className="font-bold text-rose-600">{prediction.nextPeriodStart}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-2 p-2 rounded-xl bg-white text-center border border-pink-100 text-[10px] text-pink-800 font-script text-xs">
            🌸 You are strong, beautiful and your body is amazing. ♡
          </div>
        </div>
      </div>

      {/* NEW FEATURE: PERSONAL NOTES & GENTLE REMINDERS FOR TODAY (Image 1 style) */}
      <div className="mt-3.5 p-3.5 rounded-2xl bg-white border border-pink-200/90 shadow-2xs">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-xs font-bold text-pink-950 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-pink-500" />
            <span>Personal Notes & Gentle Reminders</span>
          </h3>
          <span className="text-[10px] text-pink-400 font-script">feelings & care ♡</span>
        </div>
        <textarea
          rows={2}
          value={currentLog.notes || ''}
          onChange={(e) => handleSetNotes(e.target.value)}
          placeholder="Log doctor appointments, medicine taken, body feelings, or gentle reminders..."
          className="w-full p-2.5 text-xs bg-pink-50/20 border border-pink-100 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-300 text-pink-950 resize-none leading-relaxed"
        />
      </div>

      {/* BOTTOM QUOTE RIBBON (Image 1 style) */}
      <div className="text-center mt-4 pt-3 border-t border-pink-100 text-xs font-script text-pink-600 tracking-wide">
        ♥ Be kind to your body, it's doing its best. ♥
      </div>
    </div>
  );
};
