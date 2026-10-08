import React, { useState, useEffect } from 'react';
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
  Calendar as CalendarIcon,
  RefreshCw,
  MessageSquareQuote,
  Zap,
  Flame,
  Volume2
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
  AppSettings,
  EventRecurrence,
  DailyWitItem,
  MiddayCheckIn
} from '../types';
import { 
  formatDateKey, 
  parseDateKey, 
  calculateCyclePrediction, 
  parseEventItem,
  formatEventItem,
  getEventsForDate,
  DayEventItem
} from '../services/storage';
import { getHebrewDateInfo } from '../services/hebrewCalendar';

export const EVENT_ICON_CATEGORIES: { name: string; icons: string[] }[] = [
  {
    name: 'Celebrations & Events',
    icons: ['🎂', '🎉', '🎁', '🥳', '💍', '🥂', '🎈', '👑', '🎀'],
  },
  {
    name: 'Health & Wellness',
    icons: ['🦷', '🩺', '🏥', '💊', '🧘‍♀️', '💆‍♀️', '💅', '💇‍♀️', '🩹'],
  },
  {
    name: 'Travel & Trips',
    icons: ['✈️', '🚗', '🚆', '🏖️', '🏨', '🏕️', '🧳', '🗺️', '⛽'],
  },
  {
    name: 'Work & Study',
    icons: ['💼', '💻', '📚', '🎓', '📝', '💡', '🏛️', '📌', '📊'],
  },
  {
    name: 'Food & Leisure',
    icons: ['☕', '🍽️', '🍕', '🍷', '🍰', '🍦', '🎬', '🍿', '🎵'],
  },
  {
    name: 'Life & Home',
    icons: ['🌸', '⭐', '💖', '🛍️', '🏃‍♀️', '🏠', '🐾', '💌', '🔔'],
  },
];

export const ALL_EVENT_ICONS = Array.from(
  new Set(EVENT_ICON_CATEGORIES.flatMap((c) => c.icons))
);

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
  allDayLogs?: Record<string, DayLog>;
  onUpdateDayLog: (date: string, partial: Partial<DayLog>) => void;
  cycleLog?: CycleDayLog;
  onUpdateCycleLog: (date: string, partial: Partial<CycleDayLog>) => void;
  allCycleLogs: Record<string, CycleDayLog>;
  habits: Habit[];
  settings: AppSettings;
  onOpenJokesDigest?: () => void;
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

const SYMPTOMS: { id: CycleSymptom; legacyId?: string; label: string }[] = [
  { id: 'Cramps', legacyId: 'התכווצויות', label: 'Cramps' },
  { id: 'Headache', legacyId: 'כאב ראש', label: 'Headache' },
  { id: 'Fatigue', legacyId: 'עייפות', label: 'Fatigue' },
  { id: 'Bloating', legacyId: 'נפיחות', label: 'Bloating' },
  { id: 'Tender', legacyId: 'רגישות בחזה', label: 'Tender' },
  { id: 'Backache', legacyId: 'כאבי גב', label: 'Backache' },
  { id: 'Mood Swings', legacyId: 'מצב רוח תנודתי', label: 'Mood' },
  { id: 'Cravings', legacyId: 'חשקים למתוק', label: 'Cravings' },
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
  '6 AM',
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
  '11 PM',
  '12 AM',
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
  allDayLogs,
  onUpdateDayLog,
  cycleLog,
  onUpdateCycleLog,
  allCycleLogs,
  habits,
  settings,
  onOpenJokesDigest,
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
      category: 'Personal',
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
  const allEventsForThisDay: DayEventItem[] = getEventsForDate(
    selectedDate,
    allDayLogs || (dayLog ? { [selectedDate]: dayLog } : {})
  );

  const [newEventText, setNewEventText] = useState('');
  const [selectedEventIcon, setSelectedEventIcon] = useState<string>('🎂');
  const [newEventRecurrence, setNewEventRecurrence] = useState<EventRecurrence>('none');
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isRecurrencePickerOpen, setIsRecurrencePickerOpen] = useState(false);
  const [quickChangeIndex, setQuickChangeIndex] = useState<number | null>(null);

  const [editingEventIndex, setEditingEventIndex] = useState<number | null>(null);
  const [editingEventText, setEditingEventText] = useState('');
  const [editingEventIcon, setEditingEventIcon] = useState<string>('🎂');
  const [editingEventRecurrence, setEditingEventRecurrence] = useState<EventRecurrence>('none');
  const [editingPickerOpen, setEditingPickerOpen] = useState(false);
  const [editingRecurrencePickerOpen, setEditingRecurrencePickerOpen] = useState(false);

  const handleAddEvent = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newEventText.trim();
    if (!trimmed) return;
    const parsed = parseEventItem(trimmed);
    const iconToUse = parsed.icon !== '✦' ? parsed.icon : selectedEventIcon;
    const titleToUse = parsed.title || trimmed;
    const recurrenceToUse = newEventRecurrence !== 'none' ? newEventRecurrence : parsed.recurrence;
    const finalEvent = formatEventItem(iconToUse, titleToUse, recurrenceToUse, selectedDate);
    const updated = [...importantEvents, finalEvent];
    onUpdateDayLog(selectedDate, { importantEvents: updated });
    setNewEventText('');
    setNewEventRecurrence('none');
    setIsIconPickerOpen(false);
    setIsRecurrencePickerOpen(false);
  };

  const handleUpdateEventIcon = (item: DayEventItem, newIcon: string) => {
    const targetDateForEdit = item.originalDate || selectedDate;
    const formatted = formatEventItem(
      newIcon,
      item.parsed.title,
      item.parsed.recurrence,
      targetDateForEdit
    );
    const sourceLogEvents =
      (allDayLogs && allDayLogs[targetDateForEdit]?.importantEvents) ||
      (targetDateForEdit === selectedDate ? importantEvents : []);
    const updated = sourceLogEvents.map((e) => (e === item.evt ? formatted : e));
    onUpdateDayLog(targetDateForEdit, { importantEvents: updated });
    setQuickChangeIndex(null);
  };

  const handleStartEditEvent = (idx: number, item: DayEventItem) => {
    setEditingEventIndex(idx);
    setEditingEventIcon(item.parsed.icon !== '✦' ? item.parsed.icon : '🎂');
    setEditingEventText(item.parsed.title);
    setEditingEventRecurrence(item.parsed.recurrence);
    setEditingPickerOpen(false);
    setEditingRecurrencePickerOpen(false);
    setQuickChangeIndex(null);
  };

  const handleSaveEditEvent = (item: DayEventItem) => {
    const trimmed = editingEventText.trim();
    const targetDateForEdit = item.originalDate || selectedDate;
    if (!trimmed) {
      handleRemoveEvent(item);
    } else {
      const formatted = formatEventItem(
        editingEventIcon,
        trimmed,
        editingEventRecurrence,
        targetDateForEdit
      );
      const sourceLogEvents =
        (allDayLogs && allDayLogs[targetDateForEdit]?.importantEvents) ||
        (targetDateForEdit === selectedDate ? importantEvents : []);
      const updated = sourceLogEvents.map((e) => (e === item.evt ? formatted : e));
      onUpdateDayLog(targetDateForEdit, { importantEvents: updated });
    }
    setEditingEventIndex(null);
    setEditingEventText('');
    setEditingPickerOpen(false);
    setEditingRecurrencePickerOpen(false);
  };

  const handleCancelEditEvent = () => {
    setEditingEventIndex(null);
    setEditingEventText('');
    setEditingPickerOpen(false);
    setEditingRecurrencePickerOpen(false);
  };

  const handleRemoveEvent = (item: DayEventItem) => {
    const targetDateForRemoval = item.originalDate || selectedDate;
    const sourceLogEvents =
      (allDayLogs && allDayLogs[targetDateForRemoval]?.importantEvents) ||
      (targetDateForRemoval === selectedDate ? importantEvents : []);
    const updated = sourceLogEvents.filter((e) => e !== item.evt);
    onUpdateDayLog(targetDateForRemoval, { importantEvents: updated });
    if (editingEventIndex !== null) {
      setEditingEventIndex(null);
      setEditingPickerOpen(false);
      setEditingRecurrencePickerOpen(false);
    }
    if (quickChangeIndex !== null) {
      setQuickChangeIndex(null);
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

  // ── MIDDAY PULSE & MOOD PIVOT ──
  const middayCheckIn = dayLog?.middayCheckIn;
  const [isEditingMidday, setIsEditingMidday] = useState(!middayCheckIn?.completed);
  const [middayMoodShift, setMiddayMoodShift] = useState(middayCheckIn?.moodShift || '');
  const [middayCraving, setMiddayCraving] = useState(middayCheckIn?.cravingOrDesire || '');
  const [middayIntention, setMiddayIntention] = useState(middayCheckIn?.afternoonIntention || '');

  // Keep state synced with dayLog when date changes
  useEffect(() => {
    const checkIn = dayLog?.middayCheckIn;
    setMiddayMoodShift(checkIn?.moodShift || '');
    setMiddayCraving(checkIn?.cravingOrDesire || '');
    setMiddayIntention(checkIn?.afternoonIntention || '');
    setIsEditingMidday(!checkIn?.completed);
  }, [selectedDate, dayLog?.middayCheckIn]);

  const handleSaveMiddayPulse = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateDayLog(selectedDate, {
      middayCheckIn: {
        timestamp: Date.now(),
        moodShift: middayMoodShift || 'Peaceful & Grounded',
        cravingOrDesire: middayCraving,
        afternoonIntention: middayIntention,
        completed: true,
      },
    });
    setIsEditingMidday(false);
    confetti({
      particleCount: 25,
      spread: 45,
      origin: { y: 0.7 },
      colors: ['#fbbf24', '#f472b6', '#38bdf8'],
    });
  };

  // ── DAILY WIT, JOKES & IDIOMS (Multiple items support) ──
  const witItems: DailyWitItem[] = dayLog?.witItems || [];
  const [isAddingWit, setIsAddingWit] = useState(false);
  const [witType, setWitType] = useState<'joke' | 'idiom' | 'quote' | 'witticism'>('joke');
  const [witText, setWitText] = useState('');
  const [witPunchline, setWitPunchline] = useState('');
  const [editingWitId, setEditingWitId] = useState<string | null>(null);

  const handleSaveWit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!witText.trim()) return;

    const currentWits = dayLog?.witItems || [];
    if (editingWitId) {
      const updated = currentWits.map((w) =>
        w.id === editingWitId
          ? {
              ...w,
              type: witType,
              text: witText.trim(),
              meaningOrPunchline: witPunchline.trim(),
            }
          : w
      );
      onUpdateDayLog(selectedDate, { witItems: updated });
    } else {
      const newItem: DailyWitItem = {
        id: `wit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: witType,
        text: witText.trim(),
        meaningOrPunchline: witPunchline.trim(),
        createdAt: Date.now(),
      };
      onUpdateDayLog(selectedDate, { witItems: [...currentWits, newItem] });
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.8 },
        colors: ['#fbbf24', '#f472b6', '#a78bfa'],
      });
    }

    setWitText('');
    setWitPunchline('');
    setEditingWitId(null);
    setIsAddingWit(false);
  };

  const handleDeleteWit = (id: string) => {
    const currentWits = dayLog?.witItems || [];
    onUpdateDayLog(selectedDate, { witItems: currentWits.filter((w) => w.id !== id) });
  };

  const handleStartEditWit = (item: DailyWitItem) => {
    setEditingWitId(item.id);
    setWitType(item.type);
    setWitText(item.text);
    setWitPunchline(item.meaningOrPunchline || '');
    setIsAddingWit(true);
  };

  const CURATED_WIT_SPARKS = [
    { type: 'joke' as const, text: "Why don't eggs tell jokes?", punchline: "Because they'd crack each other up! 🥚😂" },
    { type: 'joke' as const, text: "What do you call a sleeping dinosaur?", punchline: "A dino-snore! 💤" },
    { type: 'idiom' as const, text: "Every cloud has a silver lining", punchline: "There is always something comforting or promising in every situation." },
    { type: 'idiom' as const, text: "Piece of cake", punchline: "Something wonderfully simple and sweet to accomplish." },
    { type: 'quote' as const, text: "A day without laughter is a day wasted.", punchline: "Charlie Chaplin" },
    { type: 'witticism' as const, text: "Coffee: because adulting is hard without liquid optimism ☕", punchline: "Morning truth" },
    { type: 'idiom' as const, text: "Spill the tea", punchline: "Share the friendly scoop with a warm smile ☕" },
  ];

  const handlePickCuratedWit = (spark: typeof CURATED_WIT_SPARKS[0]) => {
    setWitType(spark.type);
    setWitText(spark.text);
    setWitPunchline(spark.punchline);
    setIsAddingWit(true);
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
          IMPORTANT EVENTS (Aesthetic Stationery Ribbon Card)
         ======================================================== */}
      <div className="mb-5 p-3.5 sm:p-4 rounded-2xl bg-[#fff8fa] border border-pink-200/90 shadow-xs relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg select-none">🎀</span>
            <div>
              <h3 className="text-xs sm:text-sm font-serif font-bold text-pink-950 uppercase tracking-wider flex items-center gap-1.5">
                <span>Important Events & Occasions</span>
                {allEventsForThisDay.length > 0 && (
                  <span className="text-[10px] font-sans font-medium text-pink-600 bg-pink-100/80 px-2 py-0.5 rounded-full border border-pink-200">
                    {allEventsForThisDay.length}
                  </span>
                )}
              </h3>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-pink-700 bg-white/90 px-3 py-1 rounded-full border border-pink-200 self-start sm:self-auto shadow-2xs">
            <CalendarIcon className="w-3 h-3 text-pink-500" />
            <span>Synced to Monthly Calendar 📅</span>
          </div>
        </div>

        {/* Existing Events List */}
        {allEventsForThisDay.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {allEventsForThisDay.map((item, idx) => {
              const { parsed } = item;
              const isEditing = editingEventIndex === idx;

              if (isEditing) {
                return (
                  <div
                    key={idx}
                    className="inline-flex flex-wrap items-center gap-1.5 p-1.5 bg-white rounded-2xl border-2 border-pink-400 shadow-sm"
                  >
                    {/* Inline Icon Selector */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setEditingPickerOpen((prev) => !prev)}
                        className="w-8 h-8 rounded-xl bg-pink-50 hover:bg-pink-100 border border-pink-300 flex items-center justify-center text-base cursor-pointer shadow-2xs transition"
                        title="Choose event icon"
                      >
                        {editingEventIcon}
                      </button>

                      {editingPickerOpen && (
                        <div className="absolute top-full left-0 mt-1.5 z-40 p-2.5 bg-white rounded-2xl shadow-xl border border-pink-200 w-56 max-h-56 overflow-y-auto">
                          <div className="text-[10px] font-semibold text-pink-900 border-b border-pink-100 pb-1 mb-1.5 flex justify-between items-center">
                            <span>Change Icon</span>
                            <button
                              type="button"
                              onClick={() => setEditingPickerOpen(false)}
                              className="text-stone-400 hover:text-stone-700 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="grid grid-cols-6 gap-1">
                            {ALL_EVENT_ICONS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => {
                                  setEditingEventIcon(emoji);
                                  setEditingPickerOpen(false);
                                }}
                                className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm hover:bg-pink-100 transition cursor-pointer ${
                                  editingEventIcon === emoji ? 'bg-pink-200 ring-2 ring-pink-500 scale-105' : 'bg-pink-50/40'
                                }`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Inline Recurrence Selector */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setEditingRecurrencePickerOpen((prev) => !prev)}
                        className="px-2 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 border border-pink-300 text-[11px] font-medium text-pink-900 flex items-center gap-1 cursor-pointer transition shadow-2xs"
                        title="Change Recurrence"
                      >
                        <span>
                          {editingEventRecurrence === 'none'
                            ? '🗓️ Once'
                            : editingEventRecurrence === 'yearly-gregorian'
                            ? '🔁 Yearly (Solar)'
                            : '🕍 Yearly (Hebrew)'}
                        </span>
                        <span className="text-[9px] text-pink-400">▼</span>
                      </button>

                      {editingRecurrencePickerOpen && (
                        <div className="absolute top-full left-0 mt-1 z-40 p-1.5 bg-white rounded-xl shadow-xl border border-pink-200 w-52 space-y-1 text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEventRecurrence('none');
                              setEditingRecurrencePickerOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer ${
                              editingEventRecurrence === 'none' ? 'bg-pink-100 text-pink-900 font-semibold' : 'hover:bg-pink-50 text-stone-700'
                            }`}
                          >
                            <span>One-off (No repeat)</span>
                            {editingEventRecurrence === 'none' && <Check className="w-3.5 h-3.5 text-pink-600" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEventRecurrence('yearly-gregorian');
                              setEditingRecurrencePickerOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer ${
                              editingEventRecurrence === 'yearly-gregorian' ? 'bg-pink-100 text-pink-900 font-semibold' : 'hover:bg-pink-50 text-stone-700'
                            }`}
                          >
                            <span>Yearly (Solar / Gregorian)</span>
                            {editingEventRecurrence === 'yearly-gregorian' && <Check className="w-3.5 h-3.5 text-pink-600" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEventRecurrence('yearly-hebrew');
                              setEditingRecurrencePickerOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer ${
                              editingEventRecurrence === 'yearly-hebrew' ? 'bg-pink-100 text-pink-900 font-semibold' : 'hover:bg-pink-50 text-stone-700'
                            }`}
                          >
                            <span>Yearly (Hebrew Calendar)</span>
                            {editingEventRecurrence === 'yearly-hebrew' && <Check className="w-3.5 h-3.5 text-pink-600" />}
                          </button>
                        </div>
                      )}
                    </div>

                    <input
                      type="text"
                      autoFocus
                      value={editingEventText}
                      onChange={(e) => setEditingEventText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveEditEvent(item);
                        } else if (e.key === 'Escape') {
                          handleCancelEditEvent();
                        }
                      }}
                      className="px-2.5 py-1 text-xs text-pink-950 bg-pink-50/40 rounded-lg focus:outline-none min-w-[150px] sm:min-w-[190px]"
                      placeholder="Event title..."
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEditEvent(item)}
                      className="p-1.5 rounded-lg bg-pink-500 hover:bg-pink-600 text-white transition cursor-pointer shadow-2xs"
                      title="Save (Enter)"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditEvent}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                      title="Cancel (Esc)"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className="group relative inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-2xl bg-white border border-pink-200/90 shadow-2xs hover:border-pink-300 hover:shadow-xs transition-all text-xs"
                >
                  {/* Event Icon badge on the side - click to quick-change */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setQuickChangeIndex((prev) => (prev === idx ? null : idx))}
                      className="w-7 h-7 rounded-xl bg-pink-50 hover:bg-pink-100 border border-pink-200 flex items-center justify-center text-sm shadow-2xs cursor-pointer hover:scale-105 transition"
                      title="Click to change icon"
                    >
                      {parsed.icon}
                    </button>

                    {quickChangeIndex === idx && (
                      <div className="absolute top-full left-0 mt-1.5 z-40 p-2.5 bg-white rounded-2xl shadow-xl border border-pink-200 w-56 max-h-56 overflow-y-auto">
                        <div className="text-[10px] font-semibold text-pink-900 border-b border-pink-100 pb-1 mb-1.5 flex justify-between items-center">
                          <span>Change Icon</span>
                          <button
                            type="button"
                            onClick={() => setQuickChangeIndex(null)}
                            className="text-stone-400 hover:text-stone-700 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="grid grid-cols-6 gap-1">
                          {ALL_EVENT_ICONS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleUpdateEventIcon(item, emoji)}
                              className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm hover:bg-pink-100 transition cursor-pointer ${
                                parsed.icon === emoji ? 'bg-pink-200 ring-2 ring-pink-500 scale-105' : 'bg-pink-50/40'
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Event Title */}
                  <span
                    onClick={() => handleStartEditEvent(idx, item)}
                    className="font-medium text-pink-950 cursor-pointer hover:text-pink-600 transition"
                    title="Click to edit text"
                  >
                    {parsed.title}
                  </span>

                  {/* Recurrence Badge */}
                  {parsed.recurrence === 'yearly-gregorian' && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 font-medium inline-flex items-center gap-0.5 select-none"
                      title="Repeats every year on solar/Gregorian date"
                    >
                      <span>🔁</span>
                      <span>Yearly (Solar)</span>
                    </span>
                  )}
                  {parsed.recurrence === 'yearly-hebrew' && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200/80 font-medium inline-flex items-center gap-0.5 select-none"
                      title="Repeats every year on Hebrew calendar date"
                    >
                      <span>🕍</span>
                      <span>Yearly (Hebrew)</span>
                    </span>
                  )}

                  {/* If recurring instance from another original date */}
                  {item.isRecurringInstance && (
                    <span
                      className="text-[9px] text-pink-400 font-normal italic select-none"
                      title={`Original date: ${item.originalDate}`}
                    >
                      ({item.originalDate.slice(0, 4)})
                    </span>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 ml-1 border-l border-pink-100 pl-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleStartEditEvent(idx, item)}
                      className="p-1 rounded-md text-stone-400 hover:text-pink-600 hover:bg-pink-50 transition cursor-pointer"
                      title="Edit event"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveEvent(item)}
                      className="p-1 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Delete event"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mb-3 py-2.5 px-3 rounded-xl bg-white/70 border border-dashed border-pink-200/80 text-center text-xs text-pink-400 italic flex items-center justify-center gap-1.5">
            <span>✨</span>
            <span>No events for this date • Pick an icon & recurrence (Solar/Hebrew/Once) and add your event below</span>
          </div>
        )}

        {/* Event Form: Icon Selector + Recurrence on the side + text input */}
        <form onSubmit={handleAddEvent} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Options on the side: Icon + Recurrence */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* 1. Dedicated Icon Selector button on the side */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsIconPickerOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-pink-300 hover:border-pink-400 hover:bg-pink-50/70 shadow-2xs transition cursor-pointer group"
                title="Select event icon"
              >
                <span className="text-lg leading-none select-none group-hover:scale-110 transition-transform">
                  {selectedEventIcon}
                </span>
                <span className="text-[9px] text-pink-400 select-none">▼</span>
              </button>

              {/* Full Categorized Icon Picker Popover */}
              {isIconPickerOpen && (
                <div className="absolute top-full left-0 mt-1.5 z-40 p-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-pink-200 w-72 max-h-72 overflow-y-auto space-y-2.5">
                  <div className="text-[11px] font-semibold text-pink-900 border-b border-pink-100 pb-1.5 flex justify-between items-center">
                    <span>Select Event Icon</span>
                    <button
                      type="button"
                      onClick={() => setIsIconPickerOpen(false)}
                      className="text-stone-400 hover:text-stone-700 text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>
                  {EVENT_ICON_CATEGORIES.map((cat) => (
                    <div key={cat.name}>
                      <div className="text-[10px] font-medium text-pink-700/80 mb-1">{cat.name}</div>
                      <div className="grid grid-cols-6 gap-1">
                        {cat.icons.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setSelectedEventIcon(emoji);
                              setIsIconPickerOpen(false);
                            }}
                            className={`w-8 h-8 flex items-center justify-center rounded-xl text-base hover:bg-pink-100 transition cursor-pointer select-none ${
                              selectedEventIcon === emoji
                                ? 'bg-pink-200 ring-2 ring-pink-500 scale-105'
                                : 'bg-pink-50/50 hover:scale-105'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Dedicated Recurrence Selector button on the side */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsRecurrencePickerOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-pink-300 hover:border-pink-400 hover:bg-pink-50/70 shadow-2xs transition cursor-pointer text-xs font-medium text-pink-950 group"
                title="Select Recurrence (Solar / Hebrew)"
              >
                <span className="text-pink-500">
                  {newEventRecurrence === 'none' ? '🗓️' : newEventRecurrence === 'yearly-gregorian' ? '🔁' : '🕍'}
                </span>
                <span className="hidden sm:inline">
                  {newEventRecurrence === 'none'
                    ? 'One-off'
                    : newEventRecurrence === 'yearly-gregorian'
                    ? 'Yearly (Solar)'
                    : 'Yearly (Hebrew)'}
                </span>
                <span className="sm:hidden">
                  {newEventRecurrence === 'none'
                    ? 'Once'
                    : newEventRecurrence === 'yearly-gregorian'
                    ? 'Solar'
                    : 'Hebrew'}
                </span>
                <span className="text-[9px] text-pink-400 select-none">▼</span>
              </button>

              {/* Recurrence Dropdown */}
              {isRecurrencePickerOpen && (
                <div className="absolute top-full left-0 mt-1.5 z-40 p-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-pink-200 w-64 space-y-1.5">
                  <div className="text-[10px] font-semibold text-pink-900 border-b border-pink-100 pb-1 mb-1 px-1 flex justify-between items-center">
                    <span>Recurrence Frequency</span>
                    <button
                      type="button"
                      onClick={() => setIsRecurrencePickerOpen(false)}
                      className="text-stone-400 hover:text-stone-700 text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setNewEventRecurrence('none');
                      setIsRecurrencePickerOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                      newEventRecurrence === 'none'
                        ? 'bg-pink-100 text-pink-900 font-semibold'
                        : 'hover:bg-pink-50 text-stone-700'
                    }`}
                  >
                    <div className="flex flex-col text-left">
                      <span className="font-medium">▫️ One-off (No repeat)</span>
                      <span className="text-[10px] text-stone-500">Single event for this date only</span>
                    </div>
                    {newEventRecurrence === 'none' && <Check className="w-3.5 h-3.5 text-pink-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewEventRecurrence('yearly-gregorian');
                      setIsRecurrencePickerOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                      newEventRecurrence === 'yearly-gregorian'
                        ? 'bg-pink-100 text-pink-900 font-semibold'
                        : 'hover:bg-pink-50 text-stone-700'
                    }`}
                  >
                    <div className="flex flex-col text-left">
                      <span className="font-medium">📅 Yearly (Solar / Gregorian)</span>
                      <span className="text-[10px] text-pink-600 font-normal">
                        Repeats every year on {selectedDate.slice(5)}
                      </span>
                    </div>
                    {newEventRecurrence === 'yearly-gregorian' && <Check className="w-3.5 h-3.5 text-pink-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewEventRecurrence('yearly-hebrew');
                      setIsRecurrencePickerOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                      newEventRecurrence === 'yearly-hebrew'
                        ? 'bg-pink-100 text-pink-900 font-semibold'
                        : 'hover:bg-pink-50 text-stone-700'
                    }`}
                  >
                    <div className="flex flex-col text-left">
                      <span className="font-medium">🕍 Yearly (Hebrew Calendar)</span>
                      <span className="text-[10px] text-pink-600 font-normal">
                        Repeats every year on {hebrewInfo.shortHebrewDateStr || 'Hebrew date'}
                      </span>
                    </div>
                    {newEventRecurrence === 'yearly-hebrew' && <Check className="w-3.5 h-3.5 text-pink-600" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Event Title Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={newEventText}
              onChange={(e) => setNewEventText(e.target.value)}
              placeholder="Event title (e.g. Birthday, Anniversary, Memorial, Flight, Dinner)..."
              className="w-full px-3.5 py-2 text-xs bg-white rounded-xl border border-pink-200 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200/50 text-pink-950 placeholder:text-pink-300 shadow-2xs transition"
            />
          </div>

          {/* Add Event Button */}
          <button
            type="submit"
            disabled={!newEventText.trim()}
            className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 disabled:opacity-40 text-white text-xs font-semibold shadow-2xs transition cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Event</span>
          </button>
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
        </div>
      </div>

      {/* ========================================================
          MIDDAY PULSE & MOOD PIVOT (Check-in midway through the day)
         ======================================================== */}
      <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#fff4f8] via-[#fffbfd] to-[#f5f8ff] border border-pink-200/90 shadow-2xs relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 mb-3 border-b border-pink-100">
          <div className="flex items-center gap-2">
            <span className="text-xl select-none">☀️</span>
            <div>
              <h3 className="text-xs sm:text-sm font-serif font-bold text-pink-950 uppercase tracking-wider flex items-center gap-1.5">
                <span>Midday Pulse & Mood Pivot</span>
                {middayCheckIn?.completed && (
                  <span className="text-[10px] font-sans font-medium text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" /> Checked In
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-pink-600 font-script">
                Pause at noon • How are you feeling right now? Any cravings, mood shifts, or spontaneous wishes? ♡
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            {middayCheckIn?.completed && !isEditingMidday && (
              <button
                type="button"
                onClick={() => setIsEditingMidday(true)}
                className="px-2.5 py-1 text-xs text-pink-700 hover:text-pink-950 bg-white rounded-xl border border-pink-200 shadow-2xs flex items-center gap-1 cursor-pointer transition"
              >
                <Pencil className="w-3 h-3 text-pink-500" />
                <span>Update Midday Pulse</span>
              </button>
            )}
          </div>
        </div>

        {isEditingMidday ? (
          <form onSubmit={handleSaveMiddayPulse} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Question 1: How are you feeling now / Mood Shift */}
              <div className="p-3 bg-white/90 rounded-xl border border-pink-100 space-y-1.5">
                <label className="block text-[11px] font-bold text-pink-900 flex items-center gap-1">
                  <span>💭</span>
                  <span>How's your mood & energy now?</span>
                </label>
                <input
                  type="text"
                  value={middayMoodShift}
                  onChange={(e) => setMiddayMoodShift(e.target.value)}
                  placeholder="e.g. energized, a bit drowsy, calm, feeling productive..."
                  className="w-full p-2 text-xs bg-pink-50/30 rounded-lg border border-pink-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-400 text-pink-950 placeholder:text-pink-300"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {['Peaceful ✨', 'Need a break ☕', 'Second wind ⚡', 'Happy 💖', 'Sleepy 🥱'].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setMiddayMoodShift(chip)}
                      className="text-[9px] px-2 py-0.5 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-800 border border-pink-200/60 cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 2: Cravings & Spontaneous Desires */}
              <div className="p-3 bg-white/90 rounded-xl border border-pink-100 space-y-1.5">
                <label className="block text-[11px] font-bold text-pink-900 flex items-center gap-1">
                  <span>🍫</span>
                  <span>Craving or desire right now?</span>
                </label>
                <input
                  type="text"
                  value={middayCraving}
                  onChange={(e) => setMiddayCraving(e.target.value)}
                  placeholder="e.g. an iced latte, fresh air walk, chocolate, a quiet hug..."
                  className="w-full p-2 text-xs bg-pink-50/30 rounded-lg border border-pink-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-400 text-pink-950 placeholder:text-pink-300"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {['Walk outside 🌿', 'Iced Matcha 🍵', 'Sweet treat 🍪', '10m Stretch 🧘‍♀️'].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setMiddayCraving(chip)}
                      className="text-[9px] px-2 py-0.5 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-800 border border-pink-200/60 cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 3: Afternoon Intention */}
              <div className="p-3 bg-white/90 rounded-xl border border-pink-100 space-y-1.5">
                <label className="block text-[11px] font-bold text-pink-900 flex items-center gap-1">
                  <span>🎯</span>
                  <span>Gentle focus for this afternoon:</span>
                </label>
                <input
                  type="text"
                  value={middayIntention}
                  onChange={(e) => setMiddayIntention(e.target.value)}
                  placeholder="e.g. finish project draft, gentle self-care evening..."
                  className="w-full p-2 text-xs bg-pink-50/30 rounded-lg border border-pink-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-400 text-pink-950 placeholder:text-pink-300"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {['Deep focus sprint ⏳', 'Wrap up early 🌸', 'Gentle pace 🕊️'].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setMiddayIntention(chip)}
                      className="text-[9px] px-2 py-0.5 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-800 border border-pink-200/60 cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              {middayCheckIn?.completed && (
                <button
                  type="button"
                  onClick={() => setIsEditingMidday(false)}
                  className="px-3 py-1.5 text-xs text-pink-700 hover:bg-pink-50 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold bg-pink-500 hover:bg-pink-600 text-white rounded-xl shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Midday Pulse</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3 bg-white/80 rounded-xl border border-pink-100/90 shadow-2xs">
              <span className="text-[10px] font-bold text-pink-500 uppercase tracking-wider block mb-0.5">
                Current State & Mood
              </span>
              <p className="text-xs font-semibold text-pink-950">
                {middayCheckIn?.moodShift || 'Peaceful'}
              </p>
            </div>
            <div className="p-3 bg-white/80 rounded-xl border border-pink-100/90 shadow-2xs">
              <span className="text-[10px] font-bold text-pink-500 uppercase tracking-wider block mb-0.5">
                Craving / Wish
              </span>
              <p className="text-xs font-medium text-pink-900">
                {middayCheckIn?.cravingOrDesire || '—'}
              </p>
            </div>
            <div className="p-3 bg-white/80 rounded-xl border border-pink-100/90 shadow-2xs">
              <span className="text-[10px] font-bold text-pink-500 uppercase tracking-wider block mb-0.5">
                Afternoon Intention
              </span>
              <p className="text-xs font-medium text-pink-900">
                {middayCheckIn?.afternoonIntention || '—'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          DAILY JOKES, IDIOMS & WITTICISMS (Save multiple items per day!)
         ======================================================== */}
      <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-[#fffbfc] border border-amber-200/80 shadow-2xs relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 mb-3 border-b border-amber-100">
          <div className="flex items-center gap-2">
            <span className="text-xl select-none">🃏</span>
            <div>
              <h3 className="text-xs sm:text-sm font-serif font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                <span>Today's Jokes, Idioms & Catchy Phrases</span>
                {witItems.length > 0 && (
                  <span className="text-[10px] font-sans font-medium text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200">
                    {witItems.length}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-amber-700/80 font-script">
                Found a joke you loved or an idiom you learned today? Save it here! (Add as many as you like) ♡
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onOpenJokesDigest && (
              <button
                type="button"
                onClick={onOpenJokesDigest}
                className="px-3 py-1 text-xs bg-amber-100/80 hover:bg-amber-200/80 text-amber-900 rounded-xl font-medium border border-amber-200/80 shadow-2xs transition flex items-center gap-1 cursor-pointer"
                title="View Hebrew Monthly and Annual Summary of all jokes"
              >
                <Smile className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">Monthly & Annual Digest</span>
                <span className="sm:hidden">Digest 📜</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setEditingWitId(null);
                setWitText('');
                setWitPunchline('');
                setIsAddingWit(true);
              }}
              className="px-3 py-1 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold shadow-2xs transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Joke / Phrase</span>
            </button>
          </div>
        </div>

        {/* Existing Wit Items */}
        {witItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
            {witItems.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-white rounded-xl border border-amber-200/80 shadow-2xs relative group hover:border-amber-300 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs">
                      {item.type === 'joke' ? '😂' : item.type === 'idiom' ? '💡' : item.type === 'quote' ? '📜' : '✨'}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                      {item.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      onClick={() => handleStartEditWit(item)}
                      className="p-1 text-stone-400 hover:text-amber-600 rounded cursor-pointer"
                      title="Edit"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteWit(item.id)}
                      className="p-1 text-stone-400 hover:text-rose-500 rounded cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <p className="text-xs font-semibold text-stone-900 leading-snug">
                  "{item.text}"
                </p>

                {item.meaningOrPunchline && (
                  <p className="text-xs font-script text-amber-800 mt-1 italic leading-snug">
                    ↳ {item.meaningOrPunchline}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-3 py-3 px-3 rounded-xl bg-amber-50/40 border border-dashed border-amber-200 text-center text-xs text-amber-700/80">
            No jokes or idioms saved yet for today. Heard something funny or clever? Jot it down!
          </div>
        )}

        {/* Add/Edit Form Modal/Inline */}
        {isAddingWit && (
          <form onSubmit={handleSaveWit} className="p-3 bg-white rounded-2xl border-2 border-amber-300 space-y-2.5 animate-in fade-in mb-3">
            <div className="flex items-center justify-between border-b border-amber-100 pb-1.5">
              <span className="text-xs font-bold text-amber-950">
                {editingWitId ? 'Edit Entry' : 'Add New Joke, Idiom or Phrase'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsAddingWit(false);
                  setEditingWitId(null);
                }}
                className="text-stone-400 hover:text-stone-600 text-xs px-1"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-stone-600 mr-1">Type:</span>
              {(['joke', 'idiom', 'quote', 'witticism'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setWitType(t)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition cursor-pointer capitalize ${
                    witType === t
                      ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}
                >
                  {t === 'joke' ? '😂 Joke' : t === 'idiom' ? '💡 Idiom' : t === 'quote' ? '📜 Quote' : '✨ Witticism'}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <input
                type="text"
                value={witText}
                onChange={(e) => setWitText(e.target.value)}
                placeholder={witType === 'joke' ? "The setup or joke question..." : "The phrase or idiom..."}
                className="w-full p-2 text-xs bg-amber-50/20 rounded-xl border border-amber-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-400 text-stone-900"
              />
              <input
                type="text"
                value={witPunchline}
                onChange={(e) => setWitPunchline(e.target.value)}
                placeholder={witType === 'joke' ? "The punchline! 😂" : "What it means or author..."}
                className="w-full p-2 text-xs bg-amber-50/20 rounded-xl border border-amber-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-400 text-stone-900"
              />
            </div>

            <div className="flex justify-between items-center pt-1">
              {/* Quick Inspiration Sparks */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-amber-700">Need inspiration?</span>
                <button
                  type="button"
                  onClick={() => handlePickCuratedWit(CURATED_WIT_SPARKS[Math.floor(Math.random() * CURATED_WIT_SPARKS.length)])}
                  className="text-[10px] text-pink-600 hover:underline cursor-pointer"
                >
                  Try a classic one ✨
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingWit(false);
                    setEditingWitId(null);
                  }}
                  className="px-3 py-1 text-xs text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!witText.trim()}
                  className="px-4 py-1 text-xs font-semibold bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-xl shadow-2xs cursor-pointer"
                >
                  {editingWitId ? 'Update' : 'Add to Today'}
                </button>
              </div>
            </div>
          </form>
        )}
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
