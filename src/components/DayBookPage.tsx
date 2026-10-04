import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Clock, 
  Sparkles, 
  Heart, 
  Lightbulb, 
  Forward, 
  X,
  Bookmark,
  Sun,
  Coffee,
  UtensilsCrossed,
  Cookie,
  Smile,
  Star,
  Pencil,
  Check,
  Calendar as CalendarIcon
} from 'lucide-react';
import { 
  Task, 
  TaskCategory, 
  Priority, 
  DayLog, 
  CycleDayLog, 
  Habit, 
  FlowLevel, 
  CycleSymptom, 
  MoodType, 
  AppSettings 
} from '../types';
import { formatDateKey, parseDateKey, calculateCyclePrediction } from '../services/storage';
import { getHebrewDateInfo } from '../services/hebrewCalendar';

interface DayBookPageProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onBackToCalendar: () => void;
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onCarryOverTasks: (fromDate: string, toDate: string) => void;
  dayLog?: DayLog;
  onUpdateDayLog: (date: string, partial: Partial<DayLog>) => void;
  cycleLog?: CycleDayLog;
  onUpdateCycleLog: (date: string, partial: Partial<CycleDayLog>) => void;
  allCycleLogs: Record<string, CycleDayLog>;
  habits: Habit[];
  settings: AppSettings;
}

const MOODS: { type: MoodType; label: string; emoji: string }[] = [
  { type: 'great', label: 'Great', emoji: '💖' },
  { type: 'creative', label: 'Good', emoji: '🌸' },
  { type: 'calm', label: 'Okay', emoji: '✨' },
  { type: 'tired', label: 'Tired', emoji: '🥱' },
  { type: 'stressed', label: 'Stressed', emoji: '🌧️' },
];

const FLOW_LEVELS: { id: FlowLevel; label: string; icon: string }[] = [
  { id: 'spotting', label: 'Spotting', icon: '🌸' },
  { id: 'light', label: 'Light', icon: '💧' },
  { id: 'medium', label: 'Medium', icon: '💧💧' },
  { id: 'heavy', label: 'Heavy', icon: '💧💧💧' },
];

const SYMPTOMS: { id: CycleSymptom; label: string }[] = [
  { id: 'התכווצויות', label: 'Cramps' },
  { id: 'כאב ראש', label: 'Headache' },
  { id: 'עייפות', label: 'Fatigue' },
  { id: 'נפיחות', label: 'Bloating' },
  { id: 'רגישות בחזה', label: 'Tender' },
  { id: 'כאבי גב', label: 'Backache' },
  { id: 'מצב רוח תנודתי', label: 'Mood' },
  { id: 'חשקים למתוק', label: 'Cravings' },
];

const DEFAULT_SELF_CARE = [
  'Take a break',
  'Move my body',
  'Skincare routine',
  'Read / Learn',
  'Relax & unwind',
  'Do something that makes me happy',
];

const SCHEDULE_TIMES = [
  '7 AM',
  '8 AM',
  '9 AM',
  '10 AM',
  '11 AM',
  '12 PM',
  '1 PM',
  '2 PM',
  '3 PM',
  '4 PM',
  '5 PM',
  '6 PM',
  '7 PM',
  '8 PM',
  '9 PM',
  '10 PM',
];

export const DayBookPage: React.FC<DayBookPageProps> = ({
  selectedDate,
  onSelectDate,
  onBackToCalendar,
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onCarryOverTasks,
  dayLog,
  onUpdateDayLog,
  cycleLog,
  onUpdateCycleLog,
  allCycleLogs,
  habits,
  settings,
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  const dateObj = parseDateKey(selectedDate);
  const hebrewInfo = getHebrewDateInfo(dateObj);
  const todayKey = formatDateKey(new Date());
  const isToday = selectedDate === todayKey;

  const formattedEnglishDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const dayTasks = tasks.filter((t) => t.date === selectedDate);
  const activeTasks = dayTasks.filter((t) => !t.completed);
  const completedTasks = dayTasks.filter((t) => t.completed);

  const prediction = calculateCyclePrediction(allCycleLogs, settings.averageCycleLength, settings.averagePeriodLength);

  const handlePrevDay = () => {
    const d = parseDateKey(selectedDate);
    d.setDate(d.getDate() - 1);
    onSelectDate(formatDateKey(d));
  };

  const handleNextDay = () => {
    const d = parseDateKey(selectedDate);
    d.setDate(d.getDate() + 1);
    onSelectDate(formatDateKey(d));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    onAddTask({
      date: selectedDate,
      title: newTaskTitle.trim(),
      completed: false,
      priority: 'medium',
      category: 'אישי',
    });

    setNewTaskTitle('');
    setIsAddingTask(false);
  };

  const handleTaskCheckbox = (taskId: string, wasCompleted: boolean) => {
    onToggleTask(taskId);
    if (!wasCompleted) {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.75 },
        colors: ['#f472b6', '#fb7185', '#fbcfe8'],
      });
    }
  };

  // Top 3 Priorities
  const priorities = dayLog?.topPriorities || ['', '', ''];
  const handlePriorityChange = (index: number, val: string) => {
    const next: [string, string, string] = [priorities[0], priorities[1], priorities[2]];
    next[index] = val;
    onUpdateDayLog(selectedDate, { topPriorities: next });
  };

  // Hourly Schedule
  const schedule = dayLog?.schedule || {};
  const handleScheduleChange = (hour: string, val: string) => {
    onUpdateDayLog(selectedDate, {
      schedule: { ...schedule, [hour]: val },
    });
  };

  // Meals
  const meals = dayLog?.meals || {};
  const handleMealChange = (field: 'breakfast' | 'lunch' | 'dinner' | 'snack', val: string) => {
    onUpdateDayLog(selectedDate, {
      meals: { ...meals, [field]: val },
    });
  };

  // Self-Care
  const selfCare = dayLog?.selfCare || [];
  const handleToggleSelfCare = (item: string) => {
    const exists = selfCare.includes(item);
    onUpdateDayLog(selectedDate, {
      selfCare: exists ? selfCare.filter((i) => i !== item) : [...selfCare, item],
    });
  };

  // Important Events for Monthly Calendar
  const importantEvents = dayLog?.importantEvents || [];
  const [newEventText, setNewEventText] = useState('');
  const [editingEventIndex, setEditingEventIndex] = useState<number | null>(null);
  const [editingEventText, setEditingEventText] = useState('');

  const handleAddEvent = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newEventText.trim();
    if (!trimmed) return;
    const updated = [...importantEvents, trimmed];
    onUpdateDayLog(selectedDate, { importantEvents: updated });
    setNewEventText('');
  };

  const handleStartEditEvent = (idx: number, currentText: string) => {
    setEditingEventIndex(idx);
    setEditingEventText(currentText);
  };

  const handleSaveEditEvent = (idx: number) => {
    const trimmed = editingEventText.trim();
    if (!trimmed) {
      handleRemoveEvent(idx);
    } else {
      const updated = [...importantEvents];
      updated[idx] = trimmed;
      onUpdateDayLog(selectedDate, { importantEvents: updated });
    }
    setEditingEventIndex(null);
    setEditingEventText('');
  };

  const handleCancelEditEvent = () => {
    setEditingEventIndex(null);
    setEditingEventText('');
  };

  const handleRemoveEvent = (indexToRemove: number) => {
    const updated = importantEvents.filter((_, idx) => idx !== indexToRemove);
    onUpdateDayLog(selectedDate, { importantEvents: updated });
    if (editingEventIndex === indexToRemove) {
      setEditingEventIndex(null);
    }
  };

  // Thoughts & Gratitude
  const dailyThoughts = dayLog?.dailyThoughts || '';
  const currentMood = dayLog?.mood || 'calm';
  const gratitude = dayLog?.gratitude || '';

  // Pink Flower
  const isFlowerDay = Boolean(cycleLog?.isPeriod);
  const handleToggleFlower = () => {
    onUpdateCycleLog(selectedDate, {
      date: selectedDate,
      isPeriod: !isFlowerDay,
      flow: !isFlowerDay ? (cycleLog?.flow || 'medium') : undefined,
    });
  };

  const handleToggleSymptom = (sym: CycleSymptom) => {
    const currentSyms = cycleLog?.symptoms || [];
    const exists = currentSyms.includes(sym);
    onUpdateCycleLog(selectedDate, {
      date: selectedDate,
      symptoms: exists ? currentSyms.filter((s) => s !== sym) : [...currentSyms, sym],
    });
  };

  // Water Hydrate Tracker
  const habitsProgress = dayLog?.habitsProgress || {};
  const waterCount = habitsProgress['water'] || 0;
  const handleWaterClick = (index: number) => {
    onUpdateDayLog(selectedDate, {
      habitsProgress: {
        ...habitsProgress,
        water: index === waterCount ? index - 1 : index,
      },
    });
  };

  return (
    <div className="relative max-w-4xl mx-auto rounded-3xl bg-[#fffbfc] p-3 sm:p-7 shadow-xs border border-pink-200/80 animate-in fade-in-50 duration-300">
      
      {/* Decorative Ribbon Bow in Top Left & Right (like Image 2 & 3) */}
      <div className="absolute -top-3.5 left-6 text-2xl select-none animate-bounce duration-1000">🎀</div>
      <div className="absolute -top-3.5 right-6 text-2xl select-none">🎀</div>

      {/* TOP PLANNER HEADER - Inspired directly by Image 2 & 3 */}
      <div className="text-center pb-4 mb-4 border-b border-pink-200/80">
        
        {/* Navigation & Return Pill */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <button
            onClick={onBackToCalendar}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-950 text-xs font-medium transition cursor-pointer border border-pink-200"
            title="Back to Monthly Calendar"
          >
            <Bookmark className="w-3.5 h-3.5 text-pink-500 fill-pink-300" />
            <span>← Calendar</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevDay}
              className="p-1 px-2 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-900 transition cursor-pointer text-xs border border-pink-200"
              title="Previous Day"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            {isToday && (
              <span className="px-2.5 py-0.5 text-[10px] font-medium bg-pink-400 text-white rounded-full shadow-2xs">
                Today
              </span>
            )}
            <button
              onClick={handleNextDay}
              className="p-1 px-2 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-900 transition cursor-pointer text-xs border border-pink-200"
              title="Next Day"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Subtitle & Title */}
        <p className="text-xs text-pink-500 font-script tracking-widest uppercase mb-0.5">
          ♥ TODAY IS YOURS ♥
        </p>
        <p className="text-xs font-script text-pink-600 italic">
          Make it Productive & Beautiful
        </p>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-pink-950 tracking-tight my-1">
          DAILY <span className="font-script text-pink-500 italic font-normal text-4xl sm:text-5xl">Planner</span>
        </h1>
        <p className="text-[11px] text-pink-700/80 mb-3">
          Plan your day. Stay focused. Achieve your goals. ♡
        </p>

        {/* Date Row: English date & Hebrew date box (like Image 2: DATE: ___ ) */}
        <div className="inline-flex flex-wrap items-center justify-center gap-3 px-4 py-1.5 rounded-2xl bg-pink-50/70 border border-pink-200/90 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-pink-950">
            <span className="text-pink-500 font-bold uppercase text-[10px] tracking-wider">Date:</span>
            <span>{formattedEnglishDate}</span>
          </div>
          <span className="text-pink-300">•</span>
          {/* Hebrew date strictly kept in Hebrew */}
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

      {/* ========================================================
          IMPORTANT EVENTS (Appears inside day's square in Monthly Calendar)
         ======================================================== */}
      <div className="mb-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-rose-50/95 via-[#fff5f8] to-amber-50/70 border border-rose-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-rose-400 to-pink-400 text-white flex items-center justify-center shadow-2xs">
              <Star className="w-3.5 h-3.5 fill-white text-white" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
                <span>Important Events & Occasions</span>
                {importantEvents.length > 0 && (
                  <span className="text-[10px] lowercase font-semibold text-rose-600 bg-rose-100/80 px-2 py-0.2 rounded-full border border-rose-200">
                    {importantEvents.length} {importantEvents.length === 1 ? 'event' : 'events'}
                  </span>
                )}
              </h3>
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-white/90 px-2.5 py-1 rounded-full border border-rose-200 self-start sm:self-auto shadow-2xs">
            <CalendarIcon className="w-3 h-3 text-rose-500" />
            <span>Appears directly in this date's box on the Monthly Calendar 📅</span>
          </div>
        </div>

        {/* Existing Events Chips */}
        {importantEvents.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
            {importantEvents.map((evt, idx) => {
              const isEditing = editingEventIndex === idx;

              if (isEditing) {
                return (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1 p-1 bg-white rounded-xl border-2 border-rose-400 shadow-sm"
                  >
                    <input
                      type="text"
                      autoFocus
                      value={editingEventText}
                      onChange={(e) => setEditingEventText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveEditEvent(idx);
                        } else if (e.key === 'Escape') {
                          handleCancelEditEvent();
                        }
                      }}
                      className="px-2 py-0.5 text-xs text-rose-950 bg-rose-50/40 rounded-lg focus:outline-none min-w-[160px] sm:min-w-[200px]"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEditEvent(idx)}
                      className="p-1 rounded-md bg-rose-500 hover:bg-rose-600 text-white transition cursor-pointer"
                      title="Save edit (Enter)"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditEvent}
                      className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                      title="Cancel (Esc)"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              return (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-rose-200 shadow-2xs text-xs font-semibold text-rose-950 group hover:border-rose-400 transition"
                >
                  <span className="text-rose-500 text-xs">⭐</span>
                  <span
                    onClick={() => handleStartEditEvent(idx, evt)}
                    className="cursor-pointer hover:underline decoration-rose-300 transition"
                    title="Click to edit event"
                  >
                    {evt}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStartEditEvent(idx, evt)}
                    className="opacity-70 group-hover:opacity-100 text-stone-400 hover:text-rose-600 p-0.5 rounded-md hover:bg-rose-50 transition cursor-pointer ml-0.5"
                    title="Edit event"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveEvent(idx)}
                    className="text-stone-300 hover:text-rose-600 p-0.5 rounded-md hover:bg-rose-50 transition cursor-pointer"
                    title="Remove this event"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Quick Add Form + Preset Tags */}
        <form onSubmit={handleAddEvent} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={newEventText}
              onChange={(e) => setNewEventText(e.target.value)}
              placeholder="Write important event (e.g. Maya's Birthday 🎂, Dentist 14:00 🦷, Flight to Paris ✈️)..."
              className="w-full px-3 py-1.5 text-xs bg-white rounded-xl border border-rose-200 focus:outline-none focus:ring-1 focus:ring-rose-400 text-rose-950 placeholder:text-rose-300 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0 justify-between sm:justify-start">
            {/* Quick emoji presets */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {[
                { icon: '🎂', label: 'Birthday' },
                { icon: '✈️', label: 'Trip' },
                { icon: '🦷', label: 'Doctor' },
                { icon: '💼', label: 'Meeting' },
                { icon: '🎉', label: 'Party' },
                { icon: '💍', label: 'Anniversary' },
              ].map((item) => (
                <button
                  key={item.icon}
                  type="button"
                  onClick={() => setNewEventText((prev) => (prev ? `${prev} ${item.icon}` : `${item.label} ${item.icon}`))}
                  className="px-2 py-1 rounded-lg bg-white/80 hover:bg-white text-stone-700 text-[11px] border border-rose-100 transition cursor-pointer hover:border-rose-300 shadow-2xs"
                  title={`Add ${item.label}`}
                >
                  {item.icon} <span className="hidden md:inline text-[10px]">{item.label}</span>
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={!newEventText.trim()}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 disabled:opacity-40 text-white text-xs font-semibold shadow-2xs transition cursor-pointer shrink-0"
            >
              + Add Event
            </button>
          </div>
        </form>
      </div>

      {/* 3-COLUMN PLANNER SPREAD (Exact layout matching Image 2 & 3) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-start">
        
        {/* ========================================================
            LEFT COLUMN (md:col-span-4):
            1. TOP 3 PRIORITIES
            2. TO-DO LIST (Heart checkboxes ♡)
            3. MOOD TODAY (Faces with ribbon 🎀)
            4. TODAY I'M GRATEFUL FOR (Heart bullets & tulips 🌷)
           ======================================================== */}
        <div className="md:col-span-4 space-y-3.5">
          
          {/* 1. TOP 3 PRIORITIES (Image 2 style) */}
          <div className="p-3.5 rounded-2xl bg-white border border-pink-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-pink-950 uppercase tracking-wider flex items-center gap-1">
                <span>✦</span>
                <span>Top 3 Priorities</span>
              </h3>
              <span className="text-sm">🎀</span>
            </div>

            <div className="space-y-2">
              {[0, 1, 2].map((idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-600 text-[10px] font-bold flex items-center justify-center shrink-0 border border-pink-200">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={priorities[idx] || ''}
                    onChange={(e) => handlePriorityChange(idx, e.target.value)}
                    placeholder={
                      idx === 0
                        ? '1st main goal...'
                        : idx === 1
                        ? '2nd main goal...'
                        : '3rd main goal...'
                    }
                    className="flex-1 px-2.5 py-1 text-xs bg-pink-50/20 hover:bg-pink-50/40 border-b border-pink-200 focus:border-pink-500 focus:outline-none text-pink-950 placeholder:text-pink-300 transition"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 2. TO-DO LIST (Image 2 style with heart checkboxes ♡) */}
          <div className="p-3.5 rounded-2xl bg-white border border-pink-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-pink-950 uppercase tracking-wider flex items-center gap-1">
                <span>✦</span>
                <span>To-Do List</span>
              </h3>
              <div className="flex items-center gap-1">
                {activeTasks.length > 0 && (
                  <button
                    onClick={() => {
                      const d = parseDateKey(selectedDate);
                      d.setDate(d.getDate() + 1);
                      onCarryOverTasks(selectedDate, formatDateKey(d));
                    }}
                    className="text-[9px] px-1.5 py-0.5 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-700 transition cursor-pointer border border-pink-200"
                    title="Carry forward to tomorrow"
                  >
                    Tomorrow →
                  </button>
                )}
                <span className="text-sm">🎀</span>
              </div>
            </div>

            {/* Quick Add */}
            {!isAddingTask ? (
              <button
                onClick={() => setIsAddingTask(true)}
                className="w-full py-1 px-2 rounded-xl border border-dashed border-pink-300 hover:border-pink-400 bg-pink-50/20 text-pink-900 text-xs font-medium flex items-center justify-center gap-1 transition cursor-pointer mb-2"
              >
                <Plus className="w-3 h-3 text-pink-600" />
                <span>Add Task</span>
              </button>
            ) : (
              <form onSubmit={handleCreateTask} className="mb-2 p-2 rounded-xl bg-pink-50/60 border border-pink-200 space-y-1.5">
                <input
                  type="text"
                  autoFocus
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Task title..."
                  className="w-full px-2 py-1 text-xs bg-white rounded-lg border border-pink-200 focus:outline-none focus:ring-1 focus:ring-pink-300 text-pink-950"
                />
                <div className="flex justify-end gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsAddingTask(false)}
                    className="px-2 py-0.5 text-pink-700 text-[11px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newTaskTitle.trim()}
                    className="px-3 py-0.5 rounded-full bg-pink-500 hover:bg-pink-600 text-white font-medium text-[11px] shadow-2xs"
                  >
                    Add
                  </button>
                </div>
              </form>
            )}

            {/* Tasks list with cute heart checkboxes ♡ */}
            <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
              {dayTasks.length === 0 ? (
                <div className="py-4 text-center text-xs text-pink-400 italic">
                  No tasks added yet ♡
                </div>
              ) : (
                dayTasks.map((t) => (
                  <div
                    key={t.id}
                    className="group flex items-center justify-between p-1.5 rounded-lg hover:bg-pink-50/50 text-xs transition border-b border-pink-100/60"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button
                        onClick={() => handleTaskCheckbox(t.id, t.completed)}
                        className="text-pink-400 hover:text-pink-600 cursor-pointer text-sm shrink-0"
                        title={t.completed ? 'Mark pending' : 'Mark done'}
                      >
                        {t.completed ? '♥' : '♡'}
                      </button>
                      <span className={`truncate text-pink-950 ${t.completed ? 'line-through text-pink-400' : ''}`}>
                        {t.title}
                      </span>
                    </div>
                    <button
                      onClick={() => onDeleteTask(t.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-pink-300 hover:text-rose-500 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 3. MOOD TODAY (Image 2 style: 5 cute faces with labels) */}
          <div className="p-3.5 rounded-2xl bg-white border border-pink-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-pink-950 uppercase tracking-wider flex items-center gap-1">
                <span>✦</span>
                <span>Mood Today</span>
              </h3>
              <span className="text-sm">🎀</span>
            </div>

            <div className="grid grid-cols-5 gap-1 text-center">
              {MOODS.map((m) => (
                <button
                  key={m.type}
                  type="button"
                  onClick={() => onUpdateDayLog(selectedDate, { mood: m.type })}
                  className={`p-1.5 rounded-xl flex flex-col items-center gap-0.5 border transition cursor-pointer ${
                    currentMood === m.type
                      ? 'bg-pink-100 border-pink-400 ring-1 ring-pink-300 shadow-2xs scale-105'
                      : 'bg-pink-50/20 hover:bg-pink-50 border-pink-100 opacity-70 hover:opacity-100'
                  }`}
                >
                  <span className="text-base">{m.emoji}</span>
                  <span className="text-[9px] font-medium text-pink-950">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. TODAY I'M GRATEFUL FOR (Image 2 style with heart bullets ♡ and flower) */}
          <div className="p-3.5 rounded-2xl bg-white border border-pink-200/90 shadow-2xs relative">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-pink-950 uppercase tracking-wider flex items-center gap-1">
                <span>🌷</span>
                <span>Today I'm Grateful For</span>
              </h3>
              <span className="text-sm">🎀</span>
            </div>

            <textarea
              rows={3}
              value={gratitude}
              onChange={(e) => onUpdateDayLog(selectedDate, { gratitude: e.target.value })}
              placeholder="1. ♡ Someone special...&#10;2. ♡ A moment of peace...&#10;3. ♡ Something beautiful..."
              className="w-full p-2.5 text-xs bg-pink-50/20 border border-pink-100 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-300 text-pink-950 resize-none leading-relaxed placeholder:text-pink-300 font-script text-sm"
            />
          </div>
        </div>

        {/* ========================================================
            CENTER COLUMN (md:col-span-4):
            HOURLY SCHEDULE (Tall lined notebook, 7 AM to 10 PM - exactly like Image 2 & 3!)
           ======================================================== */}
        <div className="md:col-span-4 space-y-3.5">
          <div className="p-3.5 rounded-2xl bg-white border border-pink-200/90 shadow-2xs h-full flex flex-col">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-pink-100">
              <h3 className="text-xs font-bold text-pink-950 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-pink-500" />
                <span>Hourly Schedule</span>
              </h3>
              <span className="text-sm">🎀</span>
            </div>

            <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[580px] pr-1 lined-paper">
              {SCHEDULE_TIMES.map((timeStr) => (
                <div key={timeStr} className="flex items-center gap-2 py-0.5">
                  <span className="w-12 text-[10px] font-bold text-pink-700/80 font-mono text-left shrink-0">
                    {timeStr}
                  </span>
                  <input
                    type="text"
                    value={schedule[timeStr] || ''}
                    onChange={(e) => handleScheduleChange(timeStr, e.target.value)}
                    placeholder="—"
                    className="flex-1 px-2 py-0.5 text-xs bg-transparent border-b border-pink-100 focus:border-pink-400 focus:outline-none text-pink-950 placeholder:text-pink-200"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN (md:col-span-4):
            1. WATER TRACKER (8 tumblers with hearts)
            2. SELF-CARE CHECKLIST (Heart bullets ♡)
            3. MEALS (Breakfast, Lunch, Dinner, Snacks)
            4. PERSONAL 🌸 (Discrete flower tracking)
           ======================================================== */}
        <div className="md:col-span-4 space-y-3.5">
          
          {/* 1. WATER TRACKER (Image 2 style: 8 tumbler cups with hearts) */}
          <div className="p-3.5 rounded-2xl bg-white border border-pink-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-pink-950 uppercase tracking-wider flex items-center gap-1">
                <span>💧</span>
                <span>Water Tracker</span>
              </h3>
              <span className="text-[10px] font-bold text-pink-600">{waterCount}/8</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 justify-center">
              {Array.from({ length: 8 }).map((_, idx) => {
                const cupNum = idx + 1;
                const filled = cupNum <= waterCount;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleWaterClick(cupNum)}
                    className={`h-9 rounded-b-xl rounded-t-sm border transition-all cursor-pointer flex flex-col items-center justify-center select-none ${
                      filled
                        ? 'bg-gradient-to-t from-pink-400 to-pink-300 border-pink-500 text-white shadow-2xs scale-105'
                        : 'bg-pink-50/30 border-pink-200 hover:border-pink-300 text-pink-300'
                    }`}
                    title={`Glass ${cupNum}`}
                  >
                    <span className="text-[10px] font-bold leading-none">
                      {filled ? '♥' : '♡'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. SELF-CARE CHECKLIST (Image 2 style with heart checkboxes ♡) */}
          <div className="p-3.5 rounded-2xl bg-white border border-pink-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-pink-950 uppercase tracking-wider flex items-center gap-1">
                <span>♡</span>
                <span>Self-Care Checklist</span>
              </h3>
              <span className="text-sm">🎀</span>
            </div>

            <div className="space-y-1">
              {DEFAULT_SELF_CARE.map((item) => {
                const checked = selfCare.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleToggleSelfCare(item)}
                    className={`w-full p-1.5 rounded-xl border text-xs text-left flex items-center justify-between transition cursor-pointer ${
                      checked
                        ? 'bg-pink-100/80 border-pink-300 text-pink-950 font-medium'
                        : 'bg-pink-50/20 hover:bg-pink-50 border-pink-100 text-pink-900'
                    }`}
                  >
                    <span className="text-[11px] truncate">{item}</span>
                    <span className="text-xs shrink-0 text-pink-500 font-bold ml-1">
                      {checked ? '♥' : '♡'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. MEALS (Image 2 style: Breakfast, Lunch, Dinner, Snacks) */}
          <div className="p-3.5 rounded-2xl bg-white border border-pink-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-pink-950 uppercase tracking-wider flex items-center gap-1">
                <span>🍽️</span>
                <span>Meals</span>
              </h3>
              <span className="text-sm">🎀</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-pink-50/30 border border-pink-100">
                <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="w-16 text-[10px] font-bold text-pink-900 uppercase">Breakfast</span>
                <input
                  type="text"
                  value={meals.breakfast || ''}
                  onChange={(e) => handleMealChange('breakfast', e.target.value)}
                  placeholder="Morning fuel..."
                  className="flex-1 bg-transparent focus:outline-none text-pink-950 placeholder:text-pink-300 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-pink-50/30 border border-pink-100">
                <Coffee className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                <span className="w-16 text-[10px] font-bold text-pink-900 uppercase">Lunch</span>
                <input
                  type="text"
                  value={meals.lunch || ''}
                  onChange={(e) => handleMealChange('lunch', e.target.value)}
                  placeholder="Lunchtime..."
                  className="flex-1 bg-transparent focus:outline-none text-pink-950 placeholder:text-pink-300 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-pink-50/30 border border-pink-100">
                <UtensilsCrossed className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="w-16 text-[10px] font-bold text-pink-900 uppercase">Dinner</span>
                <input
                  type="text"
                  value={meals.dinner || ''}
                  onChange={(e) => handleMealChange('dinner', e.target.value)}
                  placeholder="Dinner..."
                  className="flex-1 bg-transparent focus:outline-none text-pink-950 placeholder:text-pink-300 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-pink-50/30 border border-pink-100">
                <Cookie className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                <span className="w-16 text-[10px] font-bold text-pink-900 uppercase">Snacks</span>
                <input
                  type="text"
                  value={meals.snack || ''}
                  onChange={(e) => handleMealChange('snack', e.target.value)}
                  placeholder="Sweet treat..."
                  className="flex-1 bg-transparent focus:outline-none text-pink-950 placeholder:text-pink-300 text-xs"
                />
              </div>
            </div>
          </div>

          {/* 4. DAILY AFFIRMATION & ENCOURAGEMENT STAMP (Image 2 style) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#fff2f6] via-[#fdf5f8] to-[#fff2f6] border border-pink-200/90 shadow-2xs text-center relative overflow-hidden">
            <div className="text-xl mb-1 select-none">✨</div>
            <h4 className="text-[10px] font-bold text-pink-500 uppercase tracking-widest mb-1">
              Daily Encouragement
            </h4>
            <p className="text-xs font-script text-pink-900 leading-snug">
              "You are capable of amazing things. Take it one gentle step at a time. ♡"
            </p>
            <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-pink-600 bg-white px-2 py-0.5 rounded-full border border-pink-200">
              <span>🌸</span>
              <span>Proud of you</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          BOTTOM SPANNING SECTION: NOTES & INSPIRATION (Image 2 style)
         ======================================================== */}
      <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-white border border-pink-200/90 shadow-2xs relative dotted-paper w-full max-w-full box-border overflow-hidden">
        {/* Pink washi tape strip at top of notes */}
        <div className="w-16 h-2.5 bg-pink-200/90 mx-auto mb-2 rounded-xs shadow-2xs" />

        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-pink-950 uppercase tracking-wider flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-pink-500" />
            <span>Notes & Inspiration</span>
          </h3>
          <span className="text-[11px] text-pink-500 font-script">focus • plan • succeed ♡</span>
        </div>

        <textarea
          rows={3}
          value={dailyThoughts}
          onChange={(e) => onUpdateDayLog(selectedDate, { dailyThoughts: e.target.value })}
          placeholder="Jot down notes, sudden thoughts, project sparks or gentle reminders..."
          className="w-full max-w-full box-border p-3 text-xs bg-white/95 rounded-xl border border-pink-200 focus:outline-none focus:ring-1 focus:ring-pink-300 text-pink-950 resize-none leading-relaxed shadow-2xs"
        />

        {/* Bottom Quote (from Image 2) */}
        <div className="text-center mt-2 text-xs font-script text-pink-700 tracking-wide">
          ♥ Small steps every day lead to big changes. ♥
        </div>
      </div>
    </div>
  );
};
