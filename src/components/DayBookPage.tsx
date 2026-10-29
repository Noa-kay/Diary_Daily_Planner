import React, { useState, useEffect, useRef } from 'react';
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
  Volume2,
  ChevronsUpDown,
  ArrowRightLeft,
  Bell
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
import { 
  syncEventAction, 
  subscribeQueueChanges, 
  isCalendarConnected, 
  processOfflineQueue 
} from '../services/googleCalendarService';

export const EVENT_ICON_CATEGORIES: { name: string; icons: string[] }[] = [
  {
    name: 'Celebrations & Events',
    icons: ['🎂', '🎉', '🎁', '🥳', '💍', '🥂', '🎈', '👑', '🎀'],
  },
  {
    name: 'Fitness & Sports',
    icons: ['🏋️‍♀️', '🏃‍♀️', '🧘‍♀️', '💪', '🚴‍♀️', '🤸‍♀️', '🏊‍♀️', '🥊', '👟', '🎾', '⚽', '🎯'],
  },
  {
    name: 'Health & Wellness',
    icons: ['🦷', '🩺', '🏥', '💊', '💆‍♀️', '💅', '💇‍♀️', '🩹', '🌿'],
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
  onUpdateHabits?: (habits: Habit[]) => void;
  settings: AppSettings;
  onOpenJokesDigest?: () => void;
  onTransferDay?: (
    fromDate: string,
    toDate: string,
    options?: { conflict?: 'merge' | 'replace' }
  ) => void;
}

const MOODS: { type: MoodType; label: string; emoji: string }[] = [
  { type: 'great', label: 'Great', emoji: '💖' },
  { type: 'creative', label: 'Good', emoji: '🌷' },
  { type: 'calm', label: 'Okay', emoji: '✨' },
  { type: 'tired', label: 'Tired', emoji: '🥱' },
  { type: 'stressed', label: 'Stressed', emoji: '🌧️' },
  { type: 'angry', label: 'Angry', emoji: '😠' },
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

const DEFAULT_SCHEDULE_TIMES = [
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

export const SCHEDULE_TIMES = DEFAULT_SCHEDULE_TIMES;

export function parseTimeToMinutes(timeStr: string): number {
  const clean = timeStr.trim().toUpperCase();
  if (clean === '12 AM' || clean === '12:00 AM' || clean === '24:00') {
    return 1440;
  }
  const matchAmPm = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (matchAmPm) {
    let hours = parseInt(matchAmPm[1], 10);
    const minutes = matchAmPm[2] ? parseInt(matchAmPm[2], 10) : 0;
    const isPm = matchAmPm[3] === 'PM';
    if (isPm && hours < 12) hours += 12;
    if (!isPm && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
  const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return hours * 60 + minutes;
  }
  return 9999;
}

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
  onUpdateHabits,
  settings,
  onOpenJokesDigest,
  onTransferDay,
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
  const scheduleInputRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});

  // Custom added time slots for the day
  const [customTimesForDay, setCustomTimesForDay] = useState<string[]>([]);
  const [isAddingTimeSlot, setIsAddingTimeSlot] = useState(false);
  const [newCustomTimeInput, setNewCustomTimeInput] = useState('');

  // Transfer Day Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTargetDate, setTransferTargetDate] = useState(() => {
    const d = parseDateKey(selectedDate);
    d.setDate(d.getDate() + 1);
    return formatDateKey(d);
  });
  const [transferConflict, setTransferConflict] = useState<'merge' | 'replace'>('merge');
  const [transferSuccessMessage, setTransferSuccessMessage] = useState<string | null>(null);

  // Reset custom times input on date change
  useEffect(() => {
    setCustomTimesForDay([]);
    setIsAddingTimeSlot(false);
    setNewCustomTimeInput('');
  }, [selectedDate]);

  // Merge default times + any keys from day schedule + dynamically added times, sorted chronologically
  const allScheduleTimes = Array.from(
    new Set([
      ...DEFAULT_SCHEDULE_TIMES,
      ...Object.keys(schedule),
      ...customTimesForDay,
    ])
  ).sort((a, b) => {
    const diff = parseTimeToMinutes(a) - parseTimeToMinutes(b);
    if (diff !== 0) return diff;
    return a.localeCompare(b);
  });

  const autoResizeTextarea = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    // Classic single-line height of 22px. Expands only when more lines/text are entered!
    const targetHeight = Math.max(el.scrollHeight, 22);
    el.style.height = `${targetHeight}px`;
  };

  useEffect(() => {
    allScheduleTimes.forEach((timeStr) => {
      const el = scheduleInputRefs.current[timeStr];
      if (el) {
        autoResizeTextarea(el);
      }
    });
  }, [selectedDate, schedule, allScheduleTimes]);

  const handleScheduleChange = (hour: string, val: string) => {
    onUpdateDayLog(selectedDate, {
      schedule: { ...schedule, [hour]: val },
    });
  };

  const handleAddCustomTimeSlot = (presetCandidate?: string) => {
    const raw = (presetCandidate ?? newCustomTimeInput).trim();
    if (!raw) return;

    let formatted = raw;
    const m24 = raw.match(/^(\d{1,2}):(\d{2})$/);
    if (m24) {
      let h = parseInt(m24[1], 10);
      const m = m24[2];
      const ampm = h >= 12 ? 'PM' : 'AM';
      if (h > 12) h -= 12;
      if (h === 0) h = 12;
      formatted = `${h}:${m} ${ampm}`;
    } else {
      const mSimple = raw.match(/^(\d{1,2})\s*(am|pm)$/i);
      if (mSimple) {
        formatted = `${mSimple[1]} ${mSimple[2].toUpperCase()}`;
      }
    }

    if (!allScheduleTimes.includes(formatted)) {
      setCustomTimesForDay((prev) => [...prev, formatted]);
    }
    setNewCustomTimeInput('');
    setIsAddingTimeSlot(false);

    setTimeout(() => {
      const el = scheduleInputRefs.current[formatted];
      if (el) {
        el.focus();
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 60);
  };

  const handleRemoveCustomTimeSlot = (timeStr: string) => {
    setCustomTimesForDay((prev) => prev.filter((t) => t !== timeStr));
    if (schedule[timeStr] !== undefined) {
      const next = { ...schedule };
      delete next[timeStr];
      onUpdateDayLog(selectedDate, { schedule: next });
    }
  };

  const handleExecuteTransfer = () => {
    if (!transferTargetDate || transferTargetDate === selectedDate) return;
    if (onTransferDay) {
      onTransferDay(selectedDate, transferTargetDate, {
        conflict: transferConflict,
      });
    }
    setIsTransferModalOpen(false);
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#f472b6', '#ec4899', '#fbcfe8'],
    });
    setTransferSuccessMessage(`כל נתוני היום הועברו בהצלחה ל-${transferTargetDate} ✨`);
    setTimeout(() => setTransferSuccessMessage(null), 4000);
  };

  const handleScheduleKeyDown = (
    timeStr: string,
    index: number,
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === 'ArrowDown') {
      const target = e.currentTarget;
      const text = target.value;
      const selEnd = target.selectionEnd ?? 0;
      const lastNl = text.lastIndexOf('\n');

      // If text has no newline, OR cursor is on/after the last newline, OR cursor is at the end of text,
      // OR user is pressing Alt/Ctrl/Cmd:
      const isAtLastLine = lastNl === -1 || selEnd > lastNl;
      const isAtEnd = selEnd === text.length;

      if (isAtLastLine || isAtEnd || e.altKey || e.ctrlKey || e.metaKey) {
        if (index < allScheduleTimes.length - 1) {
          e.preventDefault();
          const nextTime = allScheduleTimes[index + 1];
          const nextEl = scheduleInputRefs.current[nextTime];
          if (nextEl) {
            nextEl.focus();
            const nextLen = nextEl.value.length;
            nextEl.setSelectionRange(nextLen, nextLen);
            nextEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        }
      }
    } else if (e.key === 'ArrowUp') {
      const target = e.currentTarget;
      const text = target.value;
      const selStart = target.selectionStart ?? 0;
      const firstNl = text.indexOf('\n');

      // If text has no newline, OR cursor is on/before first newline, OR cursor is at start of text:
      const isAtFirstLine = firstNl === -1 || selStart <= firstNl;
      const isAtStart = selStart === 0;

      if (isAtFirstLine || isAtStart || e.altKey || e.ctrlKey || e.metaKey) {
        if (index > 0) {
          e.preventDefault();
          const prevTime = allScheduleTimes[index - 1];
          const prevEl = scheduleInputRefs.current[prevTime];
          if (prevEl) {
            prevEl.focus();
            const prevLen = prevEl.value.length;
            prevEl.setSelectionRange(prevLen, prevLen);
            prevEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        }
      }
    }
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

  const WEEKDAY_SHORT_HEB = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  const WEEKDAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const WEEKDAY_FULL_HEB = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  const [newEventText, setNewEventText] = useState('');
  const [selectedEventIcon, setSelectedEventIcon] = useState<string>('🎂');
  const [newEventRecurrence, setNewEventRecurrence] = useState<EventRecurrence>('none');
  const [newEventDays, setNewEventDays] = useState<number[]>(() => [parseDateKey(selectedDate).getDay()]);
  const [newEventEndDate, setNewEventEndDate] = useState<string>('');
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isRecurrencePickerOpen, setIsRecurrencePickerOpen] = useState(false);
  const [quickChangeIndex, setQuickChangeIndex] = useState<number | null>(null);

  // Update default day of week and default end date when selectedDate changes
  useEffect(() => {
    setNewEventDays([parseDateKey(selectedDate).getDay()]);
    // Default end date to 2 days after selectedDate
    const d = parseDateKey(selectedDate);
    d.setDate(d.getDate() + 2);
    setNewEventEndDate(formatDateKey(d));
  }, [selectedDate]);

  // Google Calendar Integration State
  const [gcalQueueCount, setGcalQueueCount] = useState<number>(0);
  const [gcalStatusMsg, setGcalStatusMsg] = useState<string | null>(null);
  const [isGcalConnected, setIsGcalConnected] = useState<boolean>(() => isCalendarConnected());
  const [eventPendingDelete, setEventPendingDelete] = useState<DayEventItem | null>(null);

  useEffect(() => {
    const unsub = subscribeQueueChanges((count, _syncing, msg) => {
      setGcalQueueCount(count);
      setIsGcalConnected(isCalendarConnected());
      if (msg) {
        setGcalStatusMsg(msg);
        setTimeout(() => setGcalStatusMsg(null), 3500);
      }
    });
    return unsub;
  }, []);

  const [editingEventIndex, setEditingEventIndex] = useState<number | null>(null);
  const [editingEventText, setEditingEventText] = useState('');
  const [editingEventIcon, setEditingEventIcon] = useState<string>('🎂');
  const [editingEventRecurrence, setEditingEventRecurrence] = useState<EventRecurrence>('none');
  const [editingEventDays, setEditingEventDays] = useState<number[]>([]);
  const [editingEventEndDate, setEditingEventEndDate] = useState<string>('');
  const [editingPickerOpen, setEditingPickerOpen] = useState(false);
  const [editingRecurrencePickerOpen, setEditingRecurrencePickerOpen] = useState(false);

  const handleAddEvent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newEventText.trim();
    if (!trimmed) return;
    const parsed = parseEventItem(trimmed);
    const iconToUse = parsed.icon !== '✦' ? parsed.icon : selectedEventIcon;
    const titleToUse = parsed.title || trimmed;
    const recurrenceToUse = newEventRecurrence !== 'none' ? newEventRecurrence : parsed.recurrence;
    const daysToUse = recurrenceToUse === 'weekly-custom'
      ? (newEventDays.length > 0 ? newEventDays : [parseDateKey(selectedDate).getDay()])
      : (recurrenceToUse === 'weekly' ? [parseDateKey(selectedDate).getDay()] : undefined);
    const endDateToUse = recurrenceToUse === 'date-range'
      ? (newEventEndDate && newEventEndDate >= selectedDate ? newEventEndDate : selectedDate)
      : undefined;

    const finalEvent = formatEventItem(iconToUse, titleToUse, recurrenceToUse, selectedDate, daysToUse, endDateToUse);
    const updated = [...importantEvents, finalEvent];
    onUpdateDayLog(selectedDate, { importantEvents: updated });
    setNewEventText('');
    setNewEventRecurrence('none');
    setNewEventDays([parseDateKey(selectedDate).getDay()]);
    setIsIconPickerOpen(false);
    setIsRecurrencePickerOpen(false);

    if (recurrenceToUse === 'date-range' && endDateToUse) {
      setGcalStatusMsg(`🗓️ Multi-day event added from ${selectedDate} to ${endDateToUse} ✨`);
      setTimeout(() => setGcalStatusMsg(null), 4000);
    } else if (recurrenceToUse === 'weekly-custom' && daysToUse && daysToUse.length > 0) {
      const dayNames = daysToUse.map((d) => WEEKDAY_NAMES_EN[d]).join(', ');
      setGcalStatusMsg(`💪 Scheduled weekly on: ${dayNames}`);
      setTimeout(() => setGcalStatusMsg(null), 4000);
    }

    // Sync to Google Calendar or queue offline
    try {
      const syncRes = await syncEventAction('insert', selectedDate, finalEvent);
      setGcalStatusMsg(syncRes.message);
      setTimeout(() => setGcalStatusMsg(null), 3500);
    } catch (err) {
      console.warn('GCal sync error:', err);
    }
  };

  const handleUpdateEventIcon = async (item: DayEventItem, newIcon: string) => {
    const targetDateForEdit = item.originalDate || selectedDate;
    const formatted = formatEventItem(
      newIcon,
      item.parsed.title,
      item.parsed.recurrence,
      targetDateForEdit,
      item.parsed.repeatDays,
      item.parsed.endDate
    );
    const sourceLogEvents =
      (allDayLogs && allDayLogs[targetDateForEdit]?.importantEvents) ||
      (targetDateForEdit === selectedDate ? importantEvents : []);
    const updated = sourceLogEvents.map((e) => (e === item.evt ? formatted : e));
    onUpdateDayLog(targetDateForEdit, { importantEvents: updated });
    setQuickChangeIndex(null);

    try {
      const syncRes = await syncEventAction('update', targetDateForEdit, formatted, item.parsed.title);
      setGcalStatusMsg(syncRes.message);
      setTimeout(() => setGcalStatusMsg(null), 3500);
    } catch (err) {
      console.warn(err);
    }
  };

  const handleStartEditEvent = (idx: number, item: DayEventItem) => {
    setEditingEventIndex(idx);
    setEditingEventIcon(item.parsed.icon !== '✦' ? item.parsed.icon : '🎂');
    setEditingEventText(item.parsed.title);
    setEditingEventRecurrence(item.parsed.recurrence);
    setEditingEventEndDate(item.parsed.endDate || selectedDate);
    setEditingEventDays(
      item.parsed.repeatDays && item.parsed.repeatDays.length > 0
        ? item.parsed.repeatDays
        : [parseDateKey(item.originalDate || selectedDate).getDay()]
    );
    setEditingPickerOpen(false);
    setEditingRecurrencePickerOpen(false);
    setQuickChangeIndex(null);
  };

  const handleSaveEditEvent = async (item: DayEventItem) => {
    const trimmed = editingEventText.trim();
    const targetDateForEdit = item.originalDate || selectedDate;
    if (!trimmed) {
      setEventPendingDelete(item);
    } else {
      const formatted = formatEventItem(
        editingEventIcon,
        trimmed,
        editingEventRecurrence,
        targetDateForEdit,
        editingEventRecurrence === 'weekly-custom' ? editingEventDays : undefined,
        editingEventRecurrence === 'date-range' ? editingEventEndDate : undefined
      );
      const sourceLogEvents =
        (allDayLogs && allDayLogs[targetDateForEdit]?.importantEvents) ||
        (targetDateForEdit === selectedDate ? importantEvents : []);
      const updated = sourceLogEvents.map((e) => (e === item.evt ? formatted : e));
      onUpdateDayLog(targetDateForEdit, { importantEvents: updated });

      try {
        const syncRes = await syncEventAction('update', targetDateForEdit, formatted, item.parsed.title);
        setGcalStatusMsg(syncRes.message);
        setTimeout(() => setGcalStatusMsg(null), 3500);
      } catch (err) {
        console.warn(err);
      }
    }
    setEditingEventIndex(null);
    setEditingEventText('');
    setEditingEventEndDate('');
    setEditingPickerOpen(false);
    setEditingRecurrencePickerOpen(false);
  };

  const handleCancelEditEvent = () => {
    setEditingEventIndex(null);
    setEditingEventText('');
    setEditingEventEndDate('');
    setEditingPickerOpen(false);
    setEditingRecurrencePickerOpen(false);
  };

  // Triggers confirmation modal before deleting (Workspace API requirement)
  const handleRemoveEvent = (item: DayEventItem) => {
    setEventPendingDelete(item);
  };

  const handleConfirmRemoveEvent = async (item: DayEventItem) => {
    // Matches event either by exact raw string or matching clean title
    const isTargetEvent = (rawEvt: string): boolean => {
      if (rawEvt === item.evt) return true;
      const parsed = parseEventItem(rawEvt);
      const titleA = (parsed.title || '').trim().toLowerCase();
      const titleB = (item.parsed.title || '').trim().toLowerCase();
      return Boolean(titleA && titleA === titleB);
    };

    // 1. Remove from currently selected day
    const currentDayEvents = (allDayLogs && allDayLogs[selectedDate]?.importantEvents) || importantEvents || [];
    const updatedCurrent = currentDayEvents.filter((e) => !isTargetEvent(e));
    onUpdateDayLog(selectedDate, { importantEvents: updatedCurrent });

    // 2. If it was recurring from another date, remove from that date too so it won't reappear
    if (item.originalDate && item.originalDate !== selectedDate) {
      const origDayEvents = (allDayLogs && allDayLogs[item.originalDate]?.importantEvents) || [];
      const updatedOrig = origDayEvents.filter((e) => !isTargetEvent(e));
      onUpdateDayLog(item.originalDate, { importantEvents: updatedOrig });
    }

    // 3. Scan allDayLogs to clean any other references
    if (allDayLogs) {
      Object.entries(allDayLogs).forEach(([dKey, dLog]) => {
        if (dKey === selectedDate || dKey === item.originalDate) return;
        if (dLog?.importantEvents && dLog.importantEvents.some(isTargetEvent)) {
          const cleaned = dLog.importantEvents.filter((e) => !isTargetEvent(e));
          onUpdateDayLog(dKey, { importantEvents: cleaned });
        }
      });
    }

    if (editingEventIndex !== null) {
      setEditingEventIndex(null);
      setEditingPickerOpen(false);
      setEditingRecurrencePickerOpen(false);
    }
    if (quickChangeIndex !== null) {
      setQuickChangeIndex(null);
    }
    setEventPendingDelete(null);

    // Sync delete to Google Calendar only if user is actually connected
    try {
      const isConnected = isCalendarConnected();
      const targetDateForRemoval = item.originalDate || selectedDate;
      const syncRes = await syncEventAction('delete', targetDateForRemoval, item.evt, item.parsed.title);
      if (isConnected && syncRes.message) {
        setGcalStatusMsg(syncRes.message);
        setTimeout(() => setGcalStatusMsg(null), 3500);
      }
    } catch (err) {
      console.warn('GCal delete error:', err);
    }
  };

  // Thoughts & Gratitude
  const dailyThoughts = dayLog?.dailyThoughts || '';
  const currentMood = dayLog?.mood;
  const currentMoods: MoodType[] = dayLog?.moods || (dayLog?.mood ? [dayLog.mood] : []);
  const gratitude = dayLog?.gratitude || '';

  const handleToggleDayMood = (mType: MoodType) => {
    const isSelected = currentMoods.includes(mType);
    const nextMoods = isSelected
      ? currentMoods.filter((t) => t !== mType)
      : [...currentMoods, mType];

    onUpdateDayLog(selectedDate, {
      mood: nextMoods[0] || undefined,
      moods: nextMoods,
    });
  };

  // Pink Flower & Cycle Tracking
  const isFlowerDay = Boolean(cycleLog?.isPeriod && !cycleLog?.didNotOccur);
  const isDidNotOccur = Boolean(cycleLog?.didNotOccur);

  const handleToggleFlower = () => {
    onUpdateCycleLog(selectedDate, {
      date: selectedDate,
      isPeriod: !isFlowerDay,
      didNotOccur: false,
      flow: !isFlowerDay ? (cycleLog?.flow || 'medium') : undefined,
    });
  };

  const handleToggleDidNotOccur = () => {
    onUpdateCycleLog(selectedDate, {
      date: selectedDate,
      isPeriod: false,
      didNotOccur: !isDidNotOccur,
      flow: undefined,
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

  // Habits & Duolingo Streak Tracking
  // Duolingo is a permanent daily reminder habit that cannot be edited or deleted
  const DUOLINGO_PERMANENT_HABIT: Habit = {
    id: 'duolingo',
    name: 'Duolingo / Languages',
    icon: '🦉',
    targetPerDay: 1,
    unit: 'lesson',
    reminderTime: '19:00',
  };

  const customHabits = (habits || []).filter(
    (h) => h.id !== 'duolingo' && !h.name.toLowerCase().includes('duolingo') && h.id !== 'water'
  );

  const effectiveHabits: Habit[] = [DUOLINGO_PERMANENT_HABIT, ...customHabits];

  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('✨');
  const [newHabitReminder, setNewHabitReminder] = useState('19:00');

  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingHabitName, setEditingHabitName] = useState('');
  const [editingHabitIcon, setEditingHabitIcon] = useState('✨');
  const [editingHabitReminder, setEditingHabitReminder] = useState('19:00');

  const [desktopNotificationPermission, setDesktopNotificationPermission] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const handleRequestDesktopPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setDesktopNotificationPermission(res);
        if (res === 'granted') {
          new Notification('🦉 Duolingo & Habit Alerts Active!', {
            body: 'Your planner will now notify you during the day so you never lose your streak ♡',
            icon: '/icon.svg',
          });
        }
      } catch {}
    }
  };

  const handleStartEditHabit = (habit: Habit) => {
    if (habit.id === 'duolingo') return; // Duolingo is permanent and cannot be edited
    setEditingHabitId(habit.id);
    setEditingHabitName(habit.name);
    setEditingHabitIcon(habit.icon);
    setEditingHabitReminder(habit.reminderTime || '');
    setIsAddingHabit(false);
  };

  const handleSaveEditHabit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingHabitId || editingHabitId === 'duolingo') return;
    const trimmed = editingHabitName.trim();
    if (!trimmed) return;
    const updated = customHabits.map((h) =>
      h.id === editingHabitId
        ? {
            ...h,
            name: trimmed,
            icon: editingHabitIcon,
            reminderTime: editingHabitReminder ? editingHabitReminder : undefined,
          }
        : h
    );
    if (onUpdateHabits) {
      onUpdateHabits(updated);
    }
    setEditingHabitId(null);
  };

  const handleToggleHabit = (habitId: string) => {
    const currentVal = habitsProgress[habitId] || 0;
    const willBeDone = currentVal === 0;
    if (willBeDone) {
      try {
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { y: 0.7 },
          colors: ['#f472b6', '#fb7185', '#38bdf8', '#fbbf24'],
        });
      } catch {}
    }
    onUpdateDayLog(selectedDate, {
      habitsProgress: {
        ...habitsProgress,
        [habitId]: willBeDone ? 1 : 0,
      },
    });
  };

  const handleAddCustomHabit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newHabitName.trim();
    if (!trimmed) return;
    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      name: trimmed,
      icon: newHabitIcon || '✨',
      targetPerDay: 1,
      unit: 'times',
      reminderTime: newHabitReminder ? newHabitReminder : undefined,
    };
    const updated = [...customHabits, newHabit];
    if (onUpdateHabits) {
      onUpdateHabits(updated);
    }
    setNewHabitName('');
    setNewHabitReminder('19:00');
    setIsAddingHabit(false);
  };

  const handleRemoveHabit = (habitId: string) => {
    if (habitId === 'duolingo') return; // Duolingo cannot be deleted
    const updated = customHabits.filter((h) => h.id !== habitId);
    if (onUpdateHabits) {
      onUpdateHabits(updated);
    }
    if (editingHabitId === habitId) {
      setEditingHabitId(null);
    }
  };

  const getHabitStreak = (habitId: string): number => {
    if (!allDayLogs) return (habitsProgress[habitId] || 0) > 0 ? 1 : 0;
    let count = 0;
    const d = parseDateKey(selectedDate);
    const isDoneToday = Boolean(habitsProgress[habitId]);
    
    if (!isDoneToday) {
      const yesterday = new Date(d);
      yesterday.setDate(yesterday.getDate() - 1);
      const yKey = formatDateKey(yesterday);
      if (!Boolean(allDayLogs[yKey]?.habitsProgress?.[habitId])) {
        return 0;
      }
      d.setDate(d.getDate() - 1);
    }

    while (true) {
      const k = formatDateKey(d);
      const log = allDayLogs[k];
      if (log?.habitsProgress?.[habitId]) {
        count++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
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
    // For jokes, only one line is needed (no separate punchline)
    const savedPunchline = witType === 'joke' ? '' : witPunchline.trim();

    if (editingWitId) {
      const updated = currentWits.map((w) =>
        w.id === editingWitId
          ? {
              ...w,
              type: witType,
              text: witText.trim(),
              meaningOrPunchline: savedPunchline,
            }
          : w
      );
      onUpdateDayLog(selectedDate, { witItems: updated });
    } else {
      const newItem: DailyWitItem = {
        id: `wit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: witType,
        text: witText.trim(),
        meaningOrPunchline: savedPunchline,
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
    if (item.type === 'joke' && item.meaningOrPunchline) {
      // If an existing joke had a separate punchline, combine into a single sentence
      const combined = item.text.includes(item.meaningOrPunchline)
        ? item.text
        : `${item.text} - ${item.meaningOrPunchline}`;
      setWitText(combined);
      setWitPunchline('');
    } else {
      setWitText(item.text);
      setWitPunchline(item.meaningOrPunchline || '');
    }
    setIsAddingWit(true);
  };

  const CURATED_WIT_SPARKS = [
    { type: 'joke' as const, text: "Why don't eggs tell jokes? Because they'd crack each other up! 🥚😂", punchline: "" },
    { type: 'joke' as const, text: "What do you call a sleeping dinosaur? A dino-snore! 💤", punchline: "" },
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
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
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
              type="button"
              onClick={() => {
                const nextD = parseDateKey(selectedDate);
                nextD.setDate(nextD.getDate() + 1);
                setTransferTargetDate(formatDateKey(nextD));
                setIsTransferModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-pink-50 text-pink-900 text-xs font-medium transition cursor-pointer border border-pink-200 shadow-2xs group"
              title="Accidentally planned on the wrong day? Move all entries to another date"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-pink-500 group-hover:rotate-180 transition-transform duration-300" />
              <span>Move Day to Another Date</span>
            </button>

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

        {transferSuccessMessage && (
          <div className="mb-2 py-1 px-3 rounded-xl bg-pink-100 text-pink-950 text-xs font-semibold text-center border border-pink-300/80 animate-in fade-in">
            {transferSuccessMessage}
          </div>
        )}

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
          
          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-pink-700 bg-white/90 px-3 py-1 rounded-full border border-pink-200 shadow-2xs">
              <CalendarIcon className="w-3 h-3 text-pink-500" />
              <span>Monthly Spread 📅</span>
            </div>

            {/* Google Calendar Status Badge */}
            <div
              className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border shadow-2xs transition ${
                isGcalConnected
                  ? 'bg-sky-50 text-sky-900 border-sky-200'
                  : 'bg-white/90 text-stone-600 border-stone-200'
              }`}
              title={
                isGcalConnected
                  ? 'Google Calendar auto-sync active'
                  : 'Open Settings (⚙️) to connect your Google Calendar'
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isGcalConnected
                    ? gcalQueueCount > 0
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-emerald-500'
                    : 'bg-stone-400'
                }`}
              />
              <span>
                {isGcalConnected
                  ? gcalQueueCount > 0
                    ? `G-Calendar: ${gcalQueueCount} queued offline`
                    : 'G-Calendar Synced ✨'
                  : 'G-Calendar Sync (⚙️)'}
              </span>
              {isGcalConnected && gcalQueueCount > 0 && (
                <button
                  type="button"
                  onClick={() => processOfflineQueue()}
                  className="ml-1 text-[10px] text-sky-700 underline font-bold cursor-pointer hover:text-sky-900"
                >
                  Sync Now
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Temporary Google Calendar feedback message */}
        {gcalStatusMsg && (
          <div className="mb-2.5 py-1 px-3 rounded-xl bg-sky-50 text-sky-950 text-xs font-semibold text-center border border-sky-200/80 animate-in fade-in">
            {gcalStatusMsg}
          </div>
        )}

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
                            ? '🗓️ Single Day'
                            : editingEventRecurrence === 'date-range'
                            ? `🗓️ Multi-Day (→ ${editingEventEndDate || 'End Date'})`
                            : editingEventRecurrence === 'daily'
                            ? '☀️ Daily'
                            : editingEventRecurrence === 'weekly'
                            ? '🔁 Weekly'
                            : editingEventRecurrence === 'weekly-custom'
                            ? `💪 Days (${editingEventDays.map((d) => WEEKDAY_NAMES_EN[d]).join(', ') || 'Choose'})`
                            : editingEventRecurrence === 'yearly-gregorian'
                            ? '📅 Yearly (Solar)'
                            : '🕍 Yearly (Hebrew)'}
                        </span>
                        <span className="text-[9px] text-pink-400">▼</span>
                      </button>

                      {editingRecurrencePickerOpen && (
                        <div className="absolute top-full left-0 mt-1 z-40 p-2 bg-white rounded-2xl shadow-xl border border-pink-200 w-64 space-y-1.5 text-xs">
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
                            <span>▫️ Single Day (Today only)</span>
                            {editingEventRecurrence === 'none' && <Check className="w-3.5 h-3.5 text-pink-600" />}
                          </button>

                          {/* Multi-Day Date Range in Edit Mode */}
                          <div className={`p-2 rounded-xl border transition ${
                            editingEventRecurrence === 'date-range'
                              ? 'bg-indigo-50/80 border-indigo-300'
                              : 'bg-stone-50 border-stone-200'
                          }`}>
                            <div
                              onClick={() => {
                                setEditingEventRecurrence('date-range');
                                if (!editingEventEndDate) {
                                  setEditingEventEndDate(selectedDate);
                                }
                              }}
                              className="flex items-center justify-between cursor-pointer pb-1 mb-1 border-b border-indigo-200/60"
                            >
                              <span className="font-semibold text-indigo-950 flex items-center gap-1">
                                <span>🗓️ Multi-Day (Date Range)</span>
                              </span>
                              {editingEventRecurrence === 'date-range' && (
                                <Check className="w-3.5 h-3.5 text-indigo-600" />
                              )}
                            </div>
                            <div className="space-y-1 pt-0.5">
                              <span className="text-[10px] text-indigo-900 font-medium block">End Date:</span>
                              <input
                                type="date"
                                min={selectedDate}
                                value={editingEventEndDate}
                                onChange={(e) => setEditingEventEndDate(e.target.value)}
                                className="w-full text-xs p-1 bg-white border border-indigo-200 rounded-lg text-indigo-950 font-mono"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingEventRecurrence('weekly');
                              setEditingRecurrencePickerOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer ${
                              editingEventRecurrence === 'weekly' ? 'bg-pink-100 text-pink-900 font-semibold' : 'hover:bg-pink-50 text-stone-700'
                            }`}
                          >
                            <span>🔁 Weekly (Same weekday)</span>
                            {editingEventRecurrence === 'weekly' && <Check className="w-3.5 h-3.5 text-pink-600" />}
                          </button>

                          {/* Weekly Custom Days Option */}
                          <div className={`p-2 rounded-xl border transition ${
                            editingEventRecurrence === 'weekly-custom'
                              ? 'bg-pink-50/80 border-pink-300'
                              : 'bg-stone-50 border-stone-200'
                          }`}>
                            <div
                              onClick={() => {
                                setEditingEventRecurrence('weekly-custom');
                                if (editingEventDays.length === 0) {
                                  setEditingEventDays([parseDateKey(selectedDate).getDay()]);
                                }
                              }}
                              className="flex items-center justify-between cursor-pointer pb-1 mb-1 border-b border-pink-200/60"
                            >
                              <span className="font-semibold text-pink-950 flex items-center gap-1">
                                <span>💪 Weekly on selected days</span>
                              </span>
                              {editingEventRecurrence === 'weekly-custom' && (
                                <Check className="w-3.5 h-3.5 text-pink-600" />
                              )}
                            </div>
                            <p className="text-[10px] text-pink-800/80 mb-1.5">
                              Workouts, classes, or recurring activities:
                            </p>
                            <div className="flex items-center justify-between gap-1">
                              {WEEKDAY_NAMES_EN.map((enName, dIdx) => {
                                const isSel = editingEventDays.includes(dIdx);
                                return (
                                  <button
                                    key={dIdx}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingEventRecurrence('weekly-custom');
                                      setEditingEventDays((prev) =>
                                        prev.includes(dIdx)
                                          ? prev.filter((d) => d !== dIdx)
                                          : [...prev, dIdx].sort((a, b) => a - b)
                                      );
                                    }}
                                    className={`w-6 h-6 rounded-md text-[11px] font-bold transition flex items-center justify-center cursor-pointer ${
                                      isSel
                                        ? 'bg-pink-500 text-white shadow-2xs scale-105'
                                        : 'bg-white text-stone-600 border border-pink-200 hover:bg-pink-100'
                                    }`}
                                    title={enName}
                                  >
                                    {enName.charAt(0)}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingEventRecurrence('daily');
                              setEditingRecurrencePickerOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer ${
                              editingEventRecurrence === 'daily' ? 'bg-pink-100 text-pink-900 font-semibold' : 'hover:bg-pink-50 text-stone-700'
                            }`}
                          >
                            <span>☀️ Daily (Every day)</span>
                            {editingEventRecurrence === 'daily' && <Check className="w-3.5 h-3.5 text-pink-600" />}
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
                            <span>📅 Yearly (Solar / Gregorian)</span>
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
                            <span>🕍 Yearly (Hebrew Calendar)</span>
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

                  {/* Recurrence Badges - 100% English */}
                  {parsed.recurrence === 'date-range' && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-200/80 font-medium inline-flex items-center gap-0.5 select-none"
                      title={`Multi-day event: ${parsed.startDate || item.originalDate} to ${parsed.endDate || ''}`}
                    >
                      <span>🗓️</span>
                      <span>Multi-Day ({parsed.startDate || item.originalDate} → {parsed.endDate || ''})</span>
                    </span>
                  )}
                  {parsed.recurrence === 'weekly-custom' && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200/80 font-medium inline-flex items-center gap-0.5 select-none"
                      title={`Repeats on: ${parsed.repeatDays?.map((d) => WEEKDAY_NAMES_EN[d]).join(', ')}`}
                    >
                      <span>💪</span>
                      <span>{parsed.repeatDays?.map((d) => WEEKDAY_NAMES_EN[d]).join(', ') || 'Weekly'}</span>
                    </span>
                  )}
                  {parsed.recurrence === 'weekly' && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200/80 font-medium inline-flex items-center gap-0.5 select-none"
                      title={`Repeats every ${WEEKDAY_NAMES_EN[parseDateKey(item.originalDate || selectedDate).getDay()]}`}
                    >
                      <span>🔁</span>
                      <span>Weekly ({WEEKDAY_NAMES_EN[parseDateKey(item.originalDate || selectedDate).getDay()]})</span>
                    </span>
                  )}
                  {parsed.recurrence === 'daily' && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-medium inline-flex items-center gap-0.5 select-none"
                      title="Repeats every day"
                    >
                      <span>☀️</span>
                      <span>Daily</span>
                    </span>
                  )}
                  {parsed.recurrence === 'yearly-gregorian' && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 font-medium inline-flex items-center gap-0.5 select-none"
                      title="Repeats annually on Solar / Gregorian calendar"
                    >
                      <span>📅</span>
                      <span>Yearly (Solar)</span>
                    </span>
                  )}
                  {parsed.recurrence === 'yearly-hebrew' && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200/80 font-medium inline-flex items-center gap-0.5 select-none"
                      title="Repeats annually on Hebrew calendar"
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
            <span>No events for this date • Pick an icon, timing (Multi-Day / Single / Weekly / Yearly) and add your event below</span>
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

            {/* 2. Dedicated Recurrence Selector button on the side - 100% English */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsRecurrencePickerOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border shadow-2xs transition cursor-pointer text-xs font-medium group ${
                  newEventRecurrence !== 'none'
                    ? 'bg-pink-100 border-pink-400 text-pink-950 font-semibold'
                    : 'bg-white border-pink-300 hover:border-pink-400 hover:bg-pink-50/70 text-pink-950'
                }`}
                title="Select Recurrence (Single Day, Multi-Day Range, Weekly, Daily, Yearly)"
              >
                <span className="text-pink-500">
                  {newEventRecurrence === 'none'
                    ? '🗓️'
                    : newEventRecurrence === 'date-range'
                    ? '📅'
                    : newEventRecurrence === 'weekly-custom'
                    ? '💪'
                    : newEventRecurrence === 'weekly'
                    ? '🔁'
                    : newEventRecurrence === 'daily'
                    ? '☀️'
                    : newEventRecurrence === 'yearly-gregorian'
                    ? '📅'
                    : '🕍'}
                </span>
                <span className="hidden sm:inline">
                  {newEventRecurrence === 'none'
                    ? 'Single Day'
                    : newEventRecurrence === 'date-range'
                    ? `Multi-Day (${newEventEndDate ? `to ${newEventEndDate.slice(5)}` : 'Range'})`
                    : newEventRecurrence === 'weekly-custom'
                    ? `Days (${newEventDays.map((d) => WEEKDAY_NAMES_EN[d]).join(', ') || 'Choose'})`
                    : newEventRecurrence === 'weekly'
                    ? `Weekly (${WEEKDAY_NAMES_EN[parseDateKey(selectedDate).getDay()]})`
                    : newEventRecurrence === 'daily'
                    ? 'Daily (Every day)'
                    : newEventRecurrence === 'yearly-gregorian'
                    ? 'Yearly (Solar)'
                    : 'Yearly (Hebrew)'}
                </span>
                <span className="sm:hidden">
                  {newEventRecurrence === 'none'
                    ? 'Once'
                    : newEventRecurrence === 'date-range'
                    ? 'Range'
                    : newEventRecurrence === 'weekly-custom'
                    ? 'Days'
                    : newEventRecurrence === 'weekly'
                    ? 'Weekly'
                    : newEventRecurrence === 'daily'
                    ? 'Daily'
                    : newEventRecurrence === 'yearly-gregorian'
                    ? 'Solar'
                    : 'Hebrew'}
                </span>
                <span className="text-[9px] text-pink-400 select-none">▼</span>
              </button>

              {/* Recurrence Dropdown - 100% English */}
              {isRecurrencePickerOpen && (
                <div className="absolute top-full left-0 mt-1.5 z-40 p-2.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-pink-200 w-72 max-h-96 overflow-y-auto space-y-2">
                  <div className="text-[10px] font-semibold text-pink-900 border-b border-pink-100 pb-1 mb-1 px-1 flex justify-between items-center">
                    <span>Event Timing & Recurrence</span>
                    <button
                      type="button"
                      onClick={() => setIsRecurrencePickerOpen(false)}
                      className="text-stone-400 hover:text-stone-700 text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Single Day */}
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
                      <span className="font-medium">▫️ Single Day (Today only)</span>
                      <span className="text-[10px] text-stone-500">Event occurs on this date only</span>
                    </div>
                    {newEventRecurrence === 'none' && <Check className="w-3.5 h-3.5 text-pink-600" />}
                  </button>

                  {/* Multi-Day Date Range (Consecutive days e.g. trips, seminars) */}
                  <button
                    type="button"
                    onClick={() => {
                      setNewEventRecurrence('date-range');
                      if (!newEventEndDate || newEventEndDate < selectedDate) {
                        const d = parseDateKey(selectedDate);
                        d.setDate(d.getDate() + 2);
                        setNewEventEndDate(formatDateKey(d));
                      }
                      setIsRecurrencePickerOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                      newEventRecurrence === 'date-range'
                        ? 'bg-indigo-100 text-indigo-950 font-semibold'
                        : 'hover:bg-indigo-50/60 text-stone-700'
                    }`}
                  >
                    <div className="flex flex-col text-left">
                      <span className="font-medium">🗓️ Multi-Day / Date Range</span>
                      <span className="text-[10px] text-stone-500">
                        Consecutive days (e.g. 3-day trip, conference, seminar)
                      </span>
                    </div>
                    {newEventRecurrence === 'date-range' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>

                  {/* Weekly Custom Days Option (Fitness, lessons, workouts) */}
                  <div
                    className={`p-2.5 rounded-xl border transition ${
                      newEventRecurrence === 'weekly-custom'
                        ? 'bg-pink-50/90 border-pink-300'
                        : 'bg-stone-50 border-stone-200'
                    }`}
                  >
                    <div
                      onClick={() => {
                        setNewEventRecurrence('weekly-custom');
                        if (newEventDays.length === 0) {
                          setNewEventDays([parseDateKey(selectedDate).getDay()]);
                        }
                      }}
                      className="flex items-center justify-between cursor-pointer pb-1.5 mb-1.5 border-b border-pink-200/60"
                    >
                      <div className="flex flex-col text-left">
                        <span className="font-semibold text-pink-950 flex items-center gap-1">
                          <span>💪 Weekly on selected days</span>
                        </span>
                        <span className="text-[10px] text-pink-700 font-normal">
                          Workouts, classes, or recurring activities
                        </span>
                      </div>
                      {newEventRecurrence === 'weekly-custom' && (
                        <Check className="w-3.5 h-3.5 text-pink-600" />
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-1 mb-2">
                      {WEEKDAY_NAMES_EN.map((enName, dIdx) => {
                        const isSel = newEventDays.includes(dIdx);
                        return (
                          <button
                            key={dIdx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewEventRecurrence('weekly-custom');
                              setNewEventDays((prev) =>
                                prev.includes(dIdx)
                                  ? prev.filter((d) => d !== dIdx)
                                  : [...prev, dIdx].sort((a, b) => a - b)
                              );
                            }}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                              isSel
                                ? 'bg-pink-600 text-white shadow-2xs scale-105'
                                : 'bg-white text-stone-600 border border-pink-200 hover:bg-pink-100'
                            }`}
                            title={enName}
                          >
                            {enName.charAt(0)}
                          </button>
                        );
                      })}
                    </div>

                    {/* Presets */}
                    <div className="flex items-center gap-1 flex-wrap text-[10px]">
                      <span className="text-stone-400">Presets:</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewEventRecurrence('weekly-custom');
                          setNewEventDays([0, 2, 4]); // Sun, Tue, Thu
                        }}
                        className="px-2 py-0.5 rounded-md bg-white border border-pink-200 text-pink-800 hover:bg-pink-100 font-medium cursor-pointer"
                      >
                        Sun, Tue, Thu
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewEventRecurrence('weekly-custom');
                          setNewEventDays([1, 3]); // Mon, Wed
                        }}
                        className="px-2 py-0.5 rounded-md bg-white border border-pink-200 text-pink-800 hover:bg-pink-100 font-medium cursor-pointer"
                      >
                        Mon, Wed
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewEventRecurrence('weekly-custom');
                          setNewEventDays([0, 1, 2, 3, 4]);
                        }}
                        className="px-2 py-0.5 rounded-md bg-white border border-pink-200 text-pink-800 hover:bg-pink-100 font-medium cursor-pointer"
                      >
                        Weekdays
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setNewEventRecurrence('weekly');
                      setIsRecurrencePickerOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                      newEventRecurrence === 'weekly'
                        ? 'bg-pink-100 text-pink-900 font-semibold'
                        : 'hover:bg-pink-50 text-stone-700'
                    }`}
                  >
                    <div className="flex flex-col text-left">
                      <span className="font-medium">🔁 Weekly (Same weekday)</span>
                      <span className="text-[10px] text-stone-500">
                        Repeats every {WEEKDAY_NAMES_EN[parseDateKey(selectedDate).getDay()]}
                      </span>
                    </div>
                    {newEventRecurrence === 'weekly' && <Check className="w-3.5 h-3.5 text-pink-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewEventRecurrence('daily');
                      setIsRecurrencePickerOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                      newEventRecurrence === 'daily'
                        ? 'bg-pink-100 text-pink-900 font-semibold'
                        : 'hover:bg-pink-50 text-stone-700'
                    }`}
                  >
                    <div className="flex flex-col text-left">
                      <span className="font-medium">☀️ Daily (Every single day)</span>
                      <span className="text-[10px] text-stone-500">Appears every single day</span>
                    </div>
                    {newEventRecurrence === 'daily' && <Check className="w-3.5 h-3.5 text-pink-600" />}
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
                        Repeats annually on {selectedDate.slice(5)}
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
                        Repeats annually on Hebrew date
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
              placeholder="Event, trip or routine title (e.g. Flight to London, Yoga Retreat, Seminar)..."
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

        {/* Inline Date Range Picker if date-range is active */}
        {newEventRecurrence === 'date-range' && (
          <div className="mt-2.5 p-2.5 rounded-2xl bg-indigo-50/90 border border-indigo-200/90 flex flex-wrap items-center justify-between gap-2 shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-1.5 text-xs text-indigo-950 font-semibold">
              <span>🗓️</span>
              <span>Multi-Day Event: From {selectedDate} to</span>
              <input
                type="date"
                min={selectedDate}
                value={newEventEndDate}
                onChange={(e) => setNewEventEndDate(e.target.value)}
                className="px-2.5 py-1 text-xs font-mono font-bold bg-white rounded-lg border border-indigo-300 text-indigo-950 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <span className="text-indigo-500 font-medium">Duration:</span>
              <button
                type="button"
                onClick={() => {
                  const d = parseDateKey(selectedDate);
                  d.setDate(d.getDate() + 2); // 3 days total
                  setNewEventEndDate(formatDateKey(d));
                }}
                className="px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-100 font-medium cursor-pointer"
              >
                3 Days (+2d)
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = parseDateKey(selectedDate);
                  d.setDate(d.getDate() + 4);
                  setNewEventEndDate(formatDateKey(d));
                }}
                className="px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-100 font-medium cursor-pointer"
              >
                5 Days (+4d)
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = parseDateKey(selectedDate);
                  d.setDate(d.getDate() + 6);
                  setNewEventEndDate(formatDateKey(d));
                }}
                className="px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-100 font-medium cursor-pointer"
              >
                1 Week (+6d)
              </button>
            </div>
          </div>
        )}

        {/* Inline Day Selector if weekly-custom is active */}
        {newEventRecurrence === 'weekly-custom' && (
          <div className="mt-2.5 p-2.5 rounded-2xl bg-pink-50/90 border border-pink-200/90 flex flex-wrap items-center justify-between gap-2 shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-1.5 text-xs text-pink-950 font-semibold">
              <span>💪</span>
              <span>Weekly Recurring Days:</span>
              <span className="text-[11px] font-normal text-pink-700">
                ({newEventDays.length > 0 ? newEventDays.map((d) => WEEKDAY_NAMES_EN[d]).join(', ') : 'Select days below'})
              </span>
            </div>
            <div className="flex items-center gap-1">
              {WEEKDAY_NAMES_EN.map((enName, dIdx) => {
                const isSel = newEventDays.includes(dIdx);
                return (
                  <button
                    key={dIdx}
                    type="button"
                    onClick={() => {
                      setNewEventDays((prev) =>
                        prev.includes(dIdx)
                          ? prev.filter((d) => d !== dIdx)
                          : [...prev, dIdx].sort((a, b) => a - b)
                      );
                    }}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                      isSel
                        ? 'bg-pink-600 text-white shadow-xs scale-105'
                        : 'bg-white text-stone-600 border border-pink-200 hover:bg-pink-100'
                    }`}
                    title={enName}
                  >
                    {enName.charAt(0)}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <button
                type="button"
                onClick={() => setNewEventDays([0, 2, 4])}
                className="px-2 py-0.5 rounded-md bg-white border border-pink-200 text-pink-800 hover:bg-pink-100 font-medium cursor-pointer"
              >
                Sun, Tue, Thu
              </button>
              <button
                type="button"
                onClick={() => setNewEventDays([1, 3])}
                className="px-2 py-0.5 rounded-md bg-white border border-pink-200 text-pink-800 hover:bg-pink-100 font-medium cursor-pointer"
              >
                Mon, Wed
              </button>
              <button
                type="button"
                onClick={() => setNewEventDays([0, 1, 2, 3, 4])}
                className="px-2 py-0.5 rounded-md bg-white border border-pink-200 text-pink-800 hover:bg-pink-100 font-medium cursor-pointer"
              >
                Weekdays
              </button>
            </div>
          </div>
        )}

        {/* Quick Routine & Multi-Day Chips - 100% English */}
        <div className="mt-2.5 pt-2 border-t border-pink-100/70 flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-[10px] text-pink-600 font-semibold flex items-center gap-1 shrink-0">
            <span>⚡</span>
            <span>Quick Templates:</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedEventIcon('✈️');
              setNewEventText('Trip / Vacation');
              setNewEventRecurrence('date-range');
              const d = parseDateKey(selectedDate);
              d.setDate(d.getDate() + 2);
              setNewEventEndDate(formatDateKey(d));
            }}
            className="px-2 py-1 rounded-xl bg-white hover:bg-indigo-50 text-indigo-950 border border-indigo-200 flex items-center gap-1 cursor-pointer transition shadow-2xs hover:scale-102 text-[11px]"
            title="Schedule a 3-day trip across consecutive dates"
          >
            <span>✈️ 3-Day Trip (Multi-Day)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedEventIcon('🏋️‍♀️');
              setNewEventText('Fitness Workout');
              setNewEventRecurrence('weekly-custom');
              setNewEventDays([0, 2, 4]); // Sun, Tue, Thu
            }}
            className="px-2 py-1 rounded-xl bg-white hover:bg-pink-100 text-pink-900 border border-pink-200 flex items-center gap-1 cursor-pointer transition shadow-2xs hover:scale-102 text-[11px]"
            title="Schedule fitness workouts on Sunday, Tuesday and Thursday"
          >
            <span>🏋️‍♀️ Workout (Sun, Tue, Thu)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedEventIcon('🧘‍♀️');
              setNewEventText('Pilates / Yoga');
              setNewEventRecurrence('weekly-custom');
              setNewEventDays([1, 3]); // Mon, Wed
            }}
            className="px-2 py-1 rounded-xl bg-white hover:bg-pink-100 text-pink-900 border border-pink-200 flex items-center gap-1 cursor-pointer transition shadow-2xs hover:scale-102 text-[11px]"
            title="Schedule Pilates or Yoga on Monday and Wednesday"
          >
            <span>🧘‍♀️ Pilates & Yoga (Mon, Wed)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedEventIcon('🏃‍♀️');
              setNewEventText('Walk & Run');
              setNewEventRecurrence('weekly-custom');
              setNewEventDays([0, 2, 4, 5]); // Sun, Tue, Thu, Fri
            }}
            className="px-2 py-1 rounded-xl bg-white hover:bg-pink-100 text-pink-900 border border-pink-200 flex items-center gap-1 cursor-pointer transition shadow-2xs hover:scale-102 text-[11px]"
            title="Schedule walking or running 4 days a week"
          >
            <span>🏃‍♀️ Walk & Run (4 Days)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedEventIcon('📚');
              setNewEventText('Weekly Class');
              setNewEventRecurrence('weekly');
              setNewEventDays([parseDateKey(selectedDate).getDay()]);
            }}
            className="px-2 py-1 rounded-xl bg-white hover:bg-pink-100 text-pink-900 border border-pink-200 flex items-center gap-1 cursor-pointer transition shadow-2xs hover:scale-102 text-[11px]"
            title="Schedule a weekly class on this day"
          >
            <span>📚 Weekly Class</span>
          </button>
        </div>
      </div>

      {/* Modal for Moving Day to Another Date */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in" dir="ltr">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-pink-200 space-y-4 text-stone-800 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-pink-100">
              <div className="flex items-center gap-2.5 text-pink-900">
                <div className="w-9 h-9 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-600 shadow-2xs">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-pink-950 font-serif">Move Day to Another Date</h4>
                  <p className="text-[11px] text-pink-600">Accidentally wrote on the wrong day? Transfer everything seamlessly.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Source Info */}
            <div className="p-3 rounded-2xl bg-pink-50/60 border border-pink-100 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-semibold text-pink-900">
                <span>From Date:</span>
                <span className="font-mono bg-white px-2 py-0.5 rounded-lg border border-pink-200">{selectedDate}</span>
              </div>
              <div className="text-[11px] text-pink-800/80 flex flex-wrap gap-x-3 gap-y-1">
                <span>📋 {dayTasks.length} tasks</span>
                <span>⏰ {Object.values(schedule).filter((v) => typeof v === 'string' && v.trim()).length} scheduled hours</span>
                <span>✦ Top Priorities & Notes</span>
                {allEventsForThisDay.length > 0 && <span>🎀 {allEventsForThisDay.length} events</span>}
              </div>
            </div>

            {/* Target Date Picker */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-pink-950">
                Choose Target Destination Date:
              </label>
              <input
                type="date"
                value={transferTargetDate}
                onChange={(e) => setTransferTargetDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-medium bg-white rounded-xl border border-pink-200 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 text-pink-950 shadow-2xs"
              />
              {/* Quick shortcut pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const d = parseDateKey(selectedDate);
                    d.setDate(d.getDate() + 1);
                    setTransferTargetDate(formatDateKey(d));
                  }}
                  className="px-2 py-0.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-[10px] font-semibold text-pink-800 border border-pink-200 cursor-pointer"
                >
                  Tomorrow (+1d)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = parseDateKey(selectedDate);
                    d.setDate(d.getDate() - 1);
                    setTransferTargetDate(formatDateKey(d));
                  }}
                  className="px-2 py-0.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-[10px] font-semibold text-pink-800 border border-pink-200 cursor-pointer"
                >
                  Yesterday (-1d)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = parseDateKey(selectedDate);
                    d.setDate(d.getDate() + 7);
                    setTransferTargetDate(formatDateKey(d));
                  }}
                  className="px-2 py-0.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-[10px] font-semibold text-pink-800 border border-pink-200 cursor-pointer"
                >
                  Next Week (+7d)
                </button>
              </div>
            </div>

            {/* Clean Move Assurance Box (Never copy, strictly move!) */}
            <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-xs space-y-1.5 text-stone-800">
              <div className="flex items-center justify-between font-bold text-amber-950 text-xs">
                <span className="flex items-center gap-1.5">
                  <span>✂️</span>
                  <span>העברה מלאה ומוחלטת (Move & Clear Source)</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-bold">
                  ללא שכפול
                </span>
              </div>
              <p className="text-[11px] text-amber-900/90 leading-relaxed">
                כל המשימות, שעות היום, הפתקים, והאירועים החשובים יועברו במלואם לתאריך היעד ויימחקו לחלוטין מהתאריך הנוכחי. היומן של היום השגוי יתנקה לחלוטין.
              </p>
            </div>

            {/* Conflict handling (If target date already has items) */}
            <div className="p-3 rounded-2xl bg-pink-50/60 border border-pink-100 text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-stone-700">
                <span className="font-bold text-pink-950">אם כבר קיימים נתונים בתאריך היעד:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTransferConflict('merge')}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer transition ${
                      transferConflict === 'merge'
                        ? 'bg-pink-600 text-white border-pink-600 shadow-2xs'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    מיזוג (Merge)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferConflict('replace')}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer transition ${
                      transferConflict === 'replace'
                        ? 'bg-pink-600 text-white border-pink-600 shadow-2xs'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    החלפה (Replace)
                  </button>
                </div>
              </div>
              <div className="text-[10px] text-stone-500">
                {transferConflict === 'merge'
                  ? 'מיזוג (מומלץ): מצרף את הדברים המועברים לפריטים שכבר קיימים בתאריך היעד.'
                  : 'החלפה: מוחק את מה שקיים בתאריך היעד ומחליף אותו לחלוטין במה שהועבר.'}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-pink-100">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition cursor-pointer"
              >
                ביטול
              </button>
              <button
                type="button"
                disabled={!transferTargetDate || transferTargetDate === selectedDate}
                onClick={handleExecuteTransfer}
                className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:opacity-40 text-white text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>העבר את כל נתוני היום ✈️</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Event Deletion (Workspace API Safe Guard) */}
      {eventPendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in" dir="ltr">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-rose-200 space-y-3.5 text-stone-800">
            <div className="flex items-center gap-2.5 text-rose-700">
              <div className="p-2 rounded-xl bg-rose-100">
                <CalendarIcon className="w-5 h-5 text-rose-600" />
              </div>
              <h4 className="font-bold text-sm">Delete Event?</h4>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-stone-900">"{eventPendingDelete.parsed.title}"</span>?
              {isGcalConnected && (
                <span className="block mt-1 text-rose-700 font-medium">
                  This will also remove the event from your Google Calendar.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-100">
              <button
                type="button"
                onClick={() => setEventPendingDelete(null)}
                className="px-3.5 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmRemoveEvent(eventPendingDelete)}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}

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

            <div className="grid grid-cols-3 gap-2 text-center">
              {MOODS.map((m) => {
                const isSelected = currentMoods.includes(m.type);
                return (
                  <button
                    key={m.type}
                    type="button"
                    onClick={() => handleToggleDayMood(m.type)}
                    className={`py-2 px-1.5 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-pink-100 border-pink-400 ring-2 ring-pink-300 shadow-2xs font-bold scale-[1.02]'
                        : 'bg-pink-50/25 hover:bg-pink-50/80 border-pink-100 text-pink-900 opacity-75 hover:opacity-100'
                    }`}
                    title={isSelected ? `Click to deselect ${m.label}` : `Select ${m.label}`}
                  >
                    <span className="text-xl select-none leading-none">{m.emoji}</span>
                    <span className="text-[10.5px] font-semibold text-pink-950 leading-tight">{m.label}</span>
                  </button>
                );
              })}
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
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAddingTimeSlot((prev) => !prev)}
                  className="text-[10px] px-2 py-0.5 rounded-lg border font-semibold flex items-center gap-1 transition-all cursor-pointer bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200 shadow-2xs"
                  title="Add a custom hour/time slot to the schedule"
                >
                  <Plus className="w-3 h-3 text-pink-500" />
                  <span>Add Hour</span>
                </button>
                <span className="text-sm">🎀</span>
              </div>
            </div>

            {/* Custom Time Slot Inline Adder */}
            {isAddingTimeSlot && (
              <div className="mb-2 p-2 rounded-xl bg-pink-50/70 border border-pink-200 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-[10px] font-bold text-pink-900">
                  <span>Add Time Slot (e.g. 8:30 AM, 12:30 PM, 14:15):</span>
                  <button
                    type="button"
                    onClick={() => setIsAddingTimeSlot(false)}
                    className="text-stone-400 hover:text-stone-700 text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
                {/* Quick suggestions */}
                <div className="flex flex-wrap items-center gap-1">
                  {['5:30 AM', '6:30 AM', '7:30 AM', '8:30 AM', '12:30 PM', '1:30 PM', '2:30 PM', '5:30 PM', '10:30 PM', '11:30 PM'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleAddCustomTimeSlot(preset)}
                      className="px-1.5 py-0.5 rounded-md bg-white hover:bg-pink-100 border border-pink-200 text-[9px] font-medium text-pink-800 transition cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                {/* Free input */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <input
                    type="text"
                    autoFocus
                    value={newCustomTimeInput}
                    onChange={(e) => setNewCustomTimeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTimeSlot();
                      } else if (e.key === 'Escape') {
                        setIsAddingTimeSlot(false);
                      }
                    }}
                    placeholder="Type hour, e.g. 8:30 AM..."
                    className="flex-1 px-2.5 py-1 text-xs bg-white rounded-lg border border-pink-200 focus:outline-none focus:border-pink-400 text-pink-950 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCustomTimeSlot()}
                    disabled={!newCustomTimeInput.trim()}
                    className="px-2.5 py-1 rounded-lg bg-pink-500 hover:bg-pink-600 disabled:opacity-40 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[620px] pr-1 lined-paper">
              {allScheduleTimes.map((timeStr, index) => {
                const noteValue = schedule[timeStr] || '';
                const hasValue = Boolean(noteValue.trim());
                const isCustomTime = !DEFAULT_SCHEDULE_TIMES.includes(timeStr);

                return (
                  <div key={timeStr} className="flex items-start gap-2 py-0.5 border-b border-pink-100/50 last:border-b-0 group">
                    <div className="w-12 pt-0.5 shrink-0 flex items-center justify-between select-none">
                      <span className={`text-[10px] font-bold font-mono text-left ${isCustomTime ? 'text-pink-600 font-semibold' : 'text-pink-700/80'}`}>
                        {timeStr}
                      </span>
                      {hasValue && (
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0" title="Scheduled note" />
                      )}
                    </div>
                    <textarea
                      ref={(el) => {
                        scheduleInputRefs.current[timeStr] = el;
                      }}
                      rows={1}
                      value={noteValue}
                      onChange={(e) => {
                        handleScheduleChange(timeStr, e.target.value);
                        autoResizeTextarea(e.target);
                      }}
                      onKeyDown={(e) => handleScheduleKeyDown(timeStr, index, e)}
                      placeholder=""
                      className="flex-1 px-1.5 py-0.5 text-xs bg-transparent hover:bg-pink-50/20 focus:bg-pink-50/40 border-0 border-b border-pink-200/60 focus:border-pink-400 focus:outline-none text-pink-950 placeholder:text-pink-300 resize-none leading-5 transition-colors font-sans whitespace-pre-wrap break-words min-h-[22px] overflow-hidden"
                    />
                    {isCustomTime && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomTimeSlot(timeStr)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-stone-300 hover:text-rose-500 transition cursor-pointer self-center"
                        title="Remove custom time slot"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-2 pt-1.5 border-t border-pink-100/70 flex items-center justify-between text-[10px] text-pink-600/70">
              <span className="flex items-center gap-1">
                <span>💡</span>
                <span>Use <kbd className="px-1 py-0.2 bg-pink-50 border border-pink-200 rounded font-mono text-[9px] text-pink-700 font-bold">↓</kbd> / <kbd className="px-1 py-0.2 bg-pink-50 border border-pink-200 rounded font-mono text-[9px] text-pink-700 font-bold">↑</kbd> to move between hours</span>
              </span>
              <span className="font-mono text-[9px] text-pink-400">
                {Object.values(schedule).filter((v) => typeof v === 'string' && v.trim()).length}/{allScheduleTimes.length} booked
              </span>
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

          {/* 2. DAILY HABITS & DUOLINGO (Dedicated ritual tracker separate from calendar) */}
          <div className="p-3.5 rounded-2xl bg-white border border-pink-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-base select-none">🦉</span>
                <h3 className="text-xs font-bold text-pink-950 uppercase tracking-wider">
                  Daily Habits & Duolingo
                </h3>
              </div>
              <span className="text-sm">🎀</span>
            </div>

            <p className="text-[10.5px] text-pink-600/80 mb-2.5 font-script">
              Daily practice & streaks without cluttering the monthly calendar ♡
            </p>

            <div className="space-y-1.5">
              {effectiveHabits.length === 0 ? (
                <div className="p-3 text-center text-xs text-pink-400 italic bg-pink-50/20 rounded-xl border border-dashed border-pink-200">
                  No habits added yet ♡ Click below to add one!
                </div>
              ) : (
                effectiveHabits.map((habit) => {
                  const isCompleted = Boolean(habitsProgress[habit.id]);
                  const streak = getHabitStreak(habit.id);
                  const isDuolingo = habit.id === 'duolingo' || habit.name.toLowerCase().includes('duolingo');
                  const isEditing = editingHabitId === habit.id;

                  if (isEditing) {
                    return (
                      <form
                        key={habit.id}
                        onSubmit={handleSaveEditHabit}
                        className="p-2.5 rounded-xl bg-pink-50 border border-pink-300 shadow-2xs space-y-2 animate-in fade-in"
                      >
                        <div className="text-[10px] font-bold text-pink-900 flex items-center justify-between border-b border-pink-200 pb-1">
                          <span className="flex items-center gap-1">
                            <Pencil className="w-3 h-3 text-pink-500" />
                            <span>Edit Habit & Daily Reminder</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingHabitId(null)}
                            className="text-stone-400 hover:text-stone-700 text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <select
                            value={editingHabitIcon}
                            onChange={(e) => setEditingHabitIcon(e.target.value)}
                            className="text-sm p-1.5 bg-white border border-pink-300 rounded-lg focus:outline-none cursor-pointer"
                            title="Choose icon"
                          >
                            <option value="🦉">🦉 Duolingo / Language</option>
                            <option value="📖">📖 Reading</option>
                            <option value="👟">👟 Walk / Steps</option>
                            <option value="✨">✨ Mindfulness</option>
                            <option value="💊">💊 Vitamins / Meds</option>
                            <option value="🧘‍♀️">🧘‍♀️ Yoga / Stretch</option>
                            <option value="🎨">🎨 Creative</option>
                            <option value="💧">💧 Hydrate</option>
                            <option value="🌸">🌸 Self-care</option>
                            <option value="📝">📝 Journaling</option>
                            <option value="🍎">🍎 Nutrition</option>
                            <option value="🍵">🍵 Calm / Tea</option>
                            <option value="🏋️‍♀️">🏋️‍♀️ Workout</option>
                            <option value="💤">💤 Rest / Sleep</option>
                          </select>
                          <input
                            type="text"
                            value={editingHabitName}
                            onChange={(e) => setEditingHabitName(e.target.value)}
                            placeholder="Habit name..."
                            className="flex-1 px-2.5 py-1 text-xs bg-white border border-pink-300 rounded-lg text-pink-950 focus:outline-none focus:border-pink-500 shadow-inner"
                            autoFocus
                          />
                        </div>

                        {/* Daily Reminder Time Picker */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-white/90 border border-pink-200 text-xs">
                          <div className="flex items-center gap-1.5 text-pink-950 font-medium">
                            <Bell className="w-3.5 h-3.5 text-pink-500" />
                            <span className="text-[11px]">Daily Reminder Time:</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="time"
                              value={editingHabitReminder}
                              onChange={(e) => setEditingHabitReminder(e.target.value)}
                              className="px-2 py-0.5 text-xs bg-pink-50 border border-pink-300 rounded-md font-mono text-pink-950 focus:outline-none"
                            />
                            {editingHabitReminder ? (
                              <button
                                type="button"
                                onClick={() => setEditingHabitReminder('')}
                                className="text-[10px] text-stone-400 hover:text-stone-700 underline cursor-pointer"
                                title="No reminder"
                              >
                                None
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setEditingHabitReminder('19:00')}
                                className="text-[10px] text-pink-600 hover:text-pink-800 underline cursor-pointer"
                              >
                                19:00
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => handleRemoveHabit(habit.id)}
                            className="text-[10.5px] text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 cursor-pointer hover:underline"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete this habit</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingHabitId(null)}
                              className="text-[10.5px] text-stone-500 hover:text-stone-800 px-2.5 py-1 rounded-lg"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={!editingHabitName.trim()}
                              className="px-3 py-1 rounded-full bg-pink-500 hover:bg-pink-600 disabled:opacity-40 text-white text-[10.5px] font-bold shadow-2xs transition cursor-pointer"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      </form>
                    );
                  }

                  const reminderDisplay = habit.reminderTime || (isDuolingo ? '19:00' : undefined);
                  const habitDisplayName = isDuolingo ? 'Duolingo' : habit.name;

                  return (
                    <div
                      key={habit.id}
                      className={`group relative p-2.5 rounded-xl border transition-all ${
                        isCompleted
                          ? 'bg-gradient-to-r from-pink-50/95 to-rose-50/80 border-pink-300 text-pink-950 shadow-2xs'
                          : isDuolingo
                          ? 'bg-gradient-to-r from-emerald-50/40 to-teal-50/20 hover:bg-emerald-50/60 border-emerald-200/80 text-emerald-950'
                          : 'bg-pink-50/20 hover:bg-pink-50/50 border-pink-100 text-pink-950'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base shrink-0 select-none">{habit.icon}</span>
                          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                            <span className={`text-xs font-bold ${isCompleted ? 'text-pink-950' : 'text-stone-900'}`}>
                              {habitDisplayName}
                            </span>
                            {reminderDisplay && (
                              <span
                                className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md bg-white border border-pink-200 text-pink-700 font-mono shadow-2xs select-none shrink-0"
                                title={`Daily reminder chime at ${reminderDisplay}`}
                              >
                                <Bell className="w-2.5 h-2.5 text-pink-500 shrink-0" />
                                <span>{reminderDisplay}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {streak > 0 && (
                            <span
                              className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100/90 text-amber-900 border border-amber-300/80 shadow-2xs"
                              title={`${streak} consecutive days completed!`}
                            >
                              <span>🔥</span>
                              <span>{streak}d</span>
                            </span>
                          )}

                          {/* Complete / Check button */}
                          <button
                            type="button"
                            onClick={() => handleToggleHabit(habit.id)}
                            className={`px-2.5 py-1 rounded-full text-[10.5px] font-semibold border transition cursor-pointer flex items-center gap-1 shadow-2xs ${
                              isCompleted
                                ? 'bg-pink-500 hover:bg-pink-600 text-white border-pink-600'
                                : 'bg-white hover:bg-pink-100 text-pink-900 border-pink-200'
                            }`}
                            title={isCompleted ? 'Mark uncompleted' : 'Mark completed today'}
                          >
                            <span className="text-xs">{isCompleted ? '♥' : '♡'}</span>
                            <span>{isCompleted ? 'Done' : 'Mark'}</span>
                          </button>

                          {/* Edit Button - only for custom habits, Duolingo is permanent */}
                          {!isDuolingo && (
                            <button
                              type="button"
                              onClick={() => handleStartEditHabit(habit)}
                              className="p-1 rounded-lg text-stone-400 hover:text-pink-600 hover:bg-pink-50 transition cursor-pointer"
                              title="Edit habit name, icon & reminder time"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}

                          {/* Delete Button - only for custom habits, Duolingo is permanent */}
                          {!isDuolingo && (
                            <button
                              type="button"
                              onClick={() => handleRemoveHabit(habit.id)}
                              className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Delete habit"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Bottom Status Row for Duolingo */}
                      {isDuolingo && (
                        <div className="mt-1.5 pt-1.5 border-t border-pink-100/80 flex items-center justify-between text-[10px]">
                          <span className="flex items-center gap-1 font-medium text-pink-800">
                            {isCompleted ? (
                              <>
                                <span>🎉</span>
                                <span>Practiced today! Streak kept alive ♡</span>
                              </>
                            ) : (
                              <>
                                <span>⚡</span>
                                <span>Daily reminder • Practice languages!</span>
                              </>
                            )}
                          </span>
                          <span className="text-[9px] text-pink-600/70 font-mono hidden sm:inline">
                            {isCompleted ? 'Completed ✓' : `Reminder at ${reminderDisplay}`}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Habit Toggle & Form */}
            <div className="mt-2.5 pt-2 border-t border-pink-100 flex flex-wrap items-center justify-between gap-1.5 text-xs">
              {!isAddingHabit ? (
                <div className="flex flex-wrap items-center justify-between w-full gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingHabit(true)}
                    className="text-[10px] text-pink-700 hover:text-pink-950 font-medium flex items-center gap-1 cursor-pointer transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add daily habit</span>
                  </button>

                  {/* Desktop notification permission button */}
                  {typeof window !== 'undefined' && 'Notification' in window && desktopNotificationPermission !== 'granted' && (
                    <button
                      type="button"
                      onClick={handleRequestDesktopPermission}
                      className="text-[9.5px] text-pink-700 hover:text-pink-950 bg-pink-50 hover:bg-pink-100 px-2 py-0.5 rounded-full border border-pink-200 shadow-2xs transition flex items-center gap-1 cursor-pointer"
                      title="Receive pop-up alerts on your desktop computer"
                    >
                      <Bell className="w-2.5 h-2.5 text-pink-500" />
                      <span>Enable Desktop Alerts</span>
                    </button>
                  )}
                  {desktopNotificationPermission === 'granted' && (
                    <span className="text-[9px] text-emerald-700 flex items-center gap-0.5 font-medium">
                      <Check className="w-2.5 h-2.5" /> Desktop alerts active
                    </span>
                  )}
                </div>
              ) : (
                <form onSubmit={handleAddCustomHabit} className="w-full space-y-1.5 animate-in fade-in">
                  <div className="flex items-center gap-1.5">
                    <select
                      value={newHabitIcon}
                      onChange={(e) => setNewHabitIcon(e.target.value)}
                      className="text-xs p-1 bg-pink-50 border border-pink-200 rounded-lg focus:outline-none"
                    >
                      <option value="🦉">🦉</option>
                      <option value="📖">📖</option>
                      <option value="👟">👟</option>
                      <option value="✨">✨</option>
                      <option value="💊">💊</option>
                      <option value="🧘‍♀️">🧘‍♀️</option>
                      <option value="🎨">🎨</option>
                      <option value="💧">💧</option>
                    </select>
                    <input
                      type="text"
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      placeholder="Habit name (e.g. Reading, Vitamins)..."
                      className="flex-1 px-2 py-1 text-xs bg-pink-50/30 border border-pink-200 rounded-lg text-pink-950 focus:outline-none focus:border-pink-400"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-pink-700 flex items-center gap-1">
                        <Bell className="w-2.5 h-2.5 text-pink-500" />
                        <span>Daily Alert:</span>
                      </span>
                      <input
                        type="time"
                        value={newHabitReminder}
                        onChange={(e) => setNewHabitReminder(e.target.value)}
                        className="px-1.5 py-0.5 text-[10px] bg-white border border-pink-200 rounded font-mono text-pink-950 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsAddingHabit(false)}
                        className="text-[10px] text-stone-500 px-2 py-0.5 hover:text-stone-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!newHabitName.trim()}
                        className="px-2.5 py-0.5 rounded-full bg-pink-500 hover:bg-pink-600 disabled:opacity-40 text-white text-[10px] font-semibold transition shadow-2xs"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* 3. SELF-CARE CHECKLIST (Image 2 style with heart checkboxes ♡) */}
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

          {/* 4. PERSONAL TRACKER 🌸 (Image 2 style: Discreet Flower & Did Not Occur Option) */}
          {settings.enableCycleTracker && (
            <div className="p-3.5 rounded-2xl bg-white border border-pink-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-pink-950 uppercase tracking-wider flex items-center gap-1">
                  <span>🌸</span>
                  <span>Personal Tracker</span>
                </h3>
                <span className="text-sm">🎀</span>
              </div>

              <div className="space-y-1.5">
                {/* Active period / flower toggle */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-pink-50/40 border border-pink-100">
                  <div className="flex items-center gap-2">
                    <span className="text-sm select-none">{isFlowerDay ? '🌸' : '🌱'}</span>
                    <span className="text-xs font-medium text-pink-950">
                      {isFlowerDay ? 'Active Period Day 🌸' : 'Period Today?'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleFlower}
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border transition cursor-pointer ${
                      isFlowerDay
                        ? 'bg-rose-500 text-white border-rose-600 shadow-2xs'
                        : 'bg-white hover:bg-pink-100 text-pink-900 border-pink-200'
                    }`}
                  >
                    {isFlowerDay ? 'Marked 🌸' : '+ Mark Day'}
                  </button>
                </div>

                {/* Did not occur option - Small, beautiful, English */}
                <div className={`p-2 rounded-xl border flex items-center justify-between transition ${
                  isDidNotOccur
                    ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                    : 'bg-pink-50/20 hover:bg-pink-50/40 border-pink-100 text-stone-600'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs select-none">{isDidNotOccur ? '🚫' : '🕊️'}</span>
                    <span className="text-[11px] font-medium">
                      {isDidNotOccur ? 'Period did not occur' : "Didn't happen?"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleDidNotOccur}
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border transition cursor-pointer shadow-2xs ${
                      isDidNotOccur
                        ? 'bg-white text-amber-900 border-amber-300 hover:bg-amber-50'
                        : 'bg-white hover:bg-pink-100 text-pink-900 border-pink-200'
                    }`}
                  >
                    {isDidNotOccur ? 'Reset' : 'Did Not Occur ✕'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          DAILY JOKES, IDIOMS & WITTICISMS (Compact & proportional)
         ======================================================== */}
      <div className="mt-3.5 p-2.5 sm:p-3 rounded-2xl bg-[#fffbfc] border border-amber-200/70 shadow-2xs relative">
        <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-amber-100/80">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-base select-none">🃏</span>
            <h3 className="text-xs font-serif font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5 truncate">
              <span>Jokes, Idioms & Catchy Phrases</span>
              {witItems.length > 0 && (
                <span className="text-[9.5px] font-sans font-medium text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded-full border border-amber-200">
                  {witItems.length}
                </span>
              )}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenJokesDigest && (
              <button
                type="button"
                onClick={onOpenJokesDigest}
                className="px-2.5 py-1 text-[11px] bg-amber-100/80 hover:bg-amber-200/80 text-amber-900 rounded-lg font-medium border border-amber-200/80 shadow-2xs transition flex items-center gap-1 cursor-pointer"
                title="View Gems Treasury"
              >
                <span>💎</span>
                <span>Gems</span>
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
              className="px-2.5 py-1 text-[11px] bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold shadow-2xs transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Existing Wit Items */}
        {witItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-1">
            {witItems.map((item) => (
              <div
                key={item.id}
                className="p-2.5 bg-white rounded-xl border border-amber-200/80 shadow-2xs relative hover:border-amber-300 transition"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs">
                      {item.type === 'joke' ? '😂' : item.type === 'idiom' ? '💡' : item.type === 'quote' ? '📜' : '✨'}
                    </span>
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-full border border-amber-200/60">
                      {item.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStartEditWit(item)}
                      className="px-1.5 py-0.5 text-stone-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 transition cursor-pointer flex items-center gap-1 text-[9.5px] font-medium shadow-2xs"
                      title="Edit this entry"
                    >
                      <Pencil className="w-2.5 h-2.5 text-amber-600" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteWit(item.id)}
                      className="p-1 text-stone-400 hover:text-rose-500 rounded cursor-pointer transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <p dir="auto" className="text-xs font-semibold text-stone-900 leading-relaxed text-start">
                  {item.text}
                  {item.meaningOrPunchline ? (
                    <span className="font-normal font-script text-amber-800 ml-1.5">
                      — {item.meaningOrPunchline}
                    </span>
                  ) : null}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-1 py-2 px-3 rounded-xl bg-amber-50/30 border border-dashed border-amber-200/70 text-center text-[11px] text-amber-700/80">
            No jokes, idioms or quotes saved yet for today. Heard something clever? Click "+ Add" above!
          </div>
        )}

        {/* Add/Edit Form Modal/Inline */}
        {isAddingWit && (
          <form onSubmit={handleSaveWit} className="p-2.5 bg-white rounded-xl border-2 border-amber-300 space-y-2 animate-in fade-in my-2">
            <div className="flex items-center justify-between border-b border-amber-100 pb-1">
              <span className="text-[11px] font-bold text-amber-950">
                {editingWitId ? 'Edit Entry' : 'Add Joke, Idiom or Phrase'}
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

            <div className="flex flex-wrap items-center gap-1">
              {(['joke', 'idiom', 'quote', 'witticism'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setWitType(t)}
                  className={`text-[10.5px] px-2 py-0.5 rounded-full border transition cursor-pointer capitalize ${
                    witType === t
                      ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}
                >
                  {t === 'joke' ? '😂 Joke' : t === 'idiom' ? '💡 Idiom' : t === 'quote' ? '📜 Quote' : '✨ Witticism'}
                </button>
              ))}
            </div>

            <div>
              <textarea
                rows={1}
                dir="auto"
                value={witText}
                onChange={(e) => {
                  setWitText(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                placeholder={
                  witType === 'joke'
                    ? "Write your joke here... 😂"
                    : witType === 'idiom'
                    ? "Write the idiom or phrase and its meaning... 💡"
                    : witType === 'quote'
                    ? "Write the quote and who said it... 📜"
                    : "Write the witty remark or phrase... ✨"
                }
                className="w-full p-2 text-xs bg-amber-50/20 rounded-xl border border-amber-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-400 text-stone-900 text-start resize-none min-h-[34px] leading-relaxed"
                autoFocus
                required
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
