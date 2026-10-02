import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Calendar as CalendarIcon,
  Tag,
  AlertCircle,
  Heart,
  Forward,
  Check,
  Flame
} from 'lucide-react';
import { Task, TaskCategory, Priority, DayLog, Habit } from '../types';
import { formatDateKey, formatHebrewDateString, parseDateKey } from '../services/storage';

interface DailyPlannerProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onCarryOverTasks: (fromDate: string, toDate: string) => void;
  dayLog?: DayLog;
  onUpdateDayLog: (date: string, partial: Partial<DayLog>) => void;
  habits: Habit[];
}

const CATEGORIES: TaskCategory[] = ['אישי', 'עבודה', 'בית', 'בריאות', 'לימודים', 'סידורים', 'אחר'];

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  'אישי': 'bg-pink-100 text-pink-700 border-pink-200',
  'עבודה': 'bg-blue-100 text-blue-700 border-blue-200',
  'בית': 'bg-amber-100 text-amber-700 border-amber-200',
  'בריאות': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'לימודים': 'bg-purple-100 text-purple-700 border-purple-200',
  'סידורים': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'אחר': 'bg-stone-100 text-stone-700 border-stone-200',
};

export const DailyPlanner: React.FC<DailyPlannerProps> = ({
  selectedDate,
  onSelectDate,
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onCarryOverTasks,
  dayLog,
  onUpdateDayLog,
  habits,
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TaskCategory>('אישי');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newTime, setNewTime] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isAdding, setIsAdding] = useState(false);

  const todayStr = formatDateKey(new Date());
  const isToday = selectedDate === todayStr;

  // Filter tasks for this specific date
  const dayTasks = tasks.filter((t) => t.date === selectedDate);
  const completedCount = dayTasks.filter((t) => t.completed).length;
  const totalCount = dayTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredTasks = dayTasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

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
      priority: newPriority,
      category: newCategory,
      time: newTime || undefined,
    });

    setNewTaskTitle('');
    setNewTime('');
    setIsAdding(false);
  };

  const handleTaskCheckbox = (taskId: string, wasCompleted: boolean) => {
    onToggleTask(taskId);
    if (!wasCompleted) {
      // Fire subtle celebratory confetti
      confetti({
        particleCount: 28,
        spread: 45,
        origin: { y: 0.8 },
        colors: ['#f43f5e', '#6366f1', '#10b981', '#f59e0b'],
      });
    }
  };

  const handleCarryOver = () => {
    const d = parseDateKey(selectedDate);
    d.setDate(d.getDate() + 1);
    const tomorrowStr = formatDateKey(d);
    onCarryOverTasks(selectedDate, tomorrowStr);
  };

  // Top 3 Priorities
  const priorities = dayLog?.topPriorities || ['', '', ''];
  const updatePriority = (index: number, val: string) => {
    const next: [string, string, string] = [priorities[0], priorities[1], priorities[2]];
    next[index] = val;
    onUpdateDayLog(selectedDate, { topPriorities: next });
  };

  // Gratitude
  const gratitudeText = dayLog?.gratitude || '';
  const updateGratitude = (val: string) => {
    onUpdateDayLog(selectedDate, { gratitude: val });
  };

  // Habit progress
  const habitsProgress = dayLog?.habitsProgress || {};
  const handleHabitChange = (habitId: string, val: number) => {
    onUpdateDayLog(selectedDate, {
      habitsProgress: {
        ...habitsProgress,
        [habitId]: val,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Date Navigation Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white/90 shadow-xs border border-stone-200">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-xl hover:bg-stone-100 text-stone-600 transition cursor-pointer"
            title="יום קודם"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="text-center sm:text-right px-2">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900">
                {formatHebrewDateString(selectedDate)}
              </h2>
              {isToday && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-rose-100 text-rose-700 rounded-full">
                  היום
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500">
              {totalCount === 0
                ? 'אין עדיין משימות ליום זה'
                : `${completedCount} מתוך ${totalCount} משימות הושלמו (${progressPercent}%)`}
            </p>
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 rounded-xl hover:bg-stone-100 text-stone-600 transition cursor-pointer"
            title="יום הבא"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {!isToday && (
            <button
              onClick={() => onSelectDate(todayStr)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 transition cursor-pointer"
            >
              קפוץ להיום
            </button>
          )}

          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && onSelectDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-xl border border-stone-200 bg-stone-50 hover:bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-indigo-500 to-rose-500 transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Top 3 Priorities of the Day */}
      <div className="p-5 rounded-2xl bg-linear-to-br from-amber-50/70 via-orange-50/40 to-stone-50 border border-amber-200/70 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <h3 className="font-bold text-sm text-stone-900">
            3 הדברים החשובים ביותר להיום (Top Priorities)
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[0, 1, 2].map((idx) => (
            <div key={idx} className="relative flex items-center">
              <span className="absolute right-3 text-xs font-bold text-amber-600/80">
                #{idx + 1}
              </span>
              <input
                type="text"
                value={priorities[idx] || ''}
                onChange={(e) => updatePriority(idx, e.target.value)}
                placeholder={
                  idx === 0
                    ? 'המיקוד המרכזי של היום...'
                    : idx === 1
                    ? 'דבר שני שחשוב לסיים...'
                    : 'דבר קטן נוסף לעצמי...'
                }
                className="w-full pr-8 pl-3 py-2 text-xs rounded-xl bg-white/90 border border-amber-200/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-stone-400"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Tasks Section */}
      <div className="p-5 rounded-2xl bg-white shadow-xs border border-stone-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-stone-900">
              רשימת מטלות ומשימות ליום זה
            </h3>
            <p className="text-xs text-stone-500">
              דברים שאני רוצה לעשות, סידורים ופרויקטים
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* Filter buttons */}
            <div className="flex bg-stone-100 p-0.5 rounded-xl text-xs">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  filter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
                }`}
              >
                הכל ({dayTasks.length})
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  filter === 'active' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
                }`}
              >
                לביצוע ({dayTasks.filter((t) => !t.completed).length})
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  filter === 'completed' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
                }`}
              >
                הושלמו ({completedCount})
              </button>
            </div>

            {/* Carry over button if unfinished tasks exist */}
            {dayTasks.some((t) => !t.completed) && (
              <button
                onClick={handleCarryOver}
                title="העבר את כל המשימות הפתוחות שלא הספקתי ליום המחר"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition cursor-pointer"
              >
                <Forward className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">העבר פתוחות למחר</span>
              </button>
            )}
          </div>
        </div>

        {/* Add Task Trigger / Form */}
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-stone-200 hover:border-indigo-400 hover:bg-indigo-50/30 text-stone-500 hover:text-indigo-600 text-sm font-medium flex items-center justify-center gap-2 transition cursor-pointer mb-4"
          >
            <Plus className="w-4 h-4" />
            <span>הוספת משימה חדשה להיום</span>
          </button>
        ) : (
          <form
            onSubmit={handleCreateTask}
            className="mb-4 p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 animate-in fade-in duration-150"
          >
            <div>
              <input
                type="text"
                autoFocus
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="מה תרצי לעשות היום?"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {/* Category selector */}
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                  className="px-2.5 py-1.5 rounded-xl border border-stone-300 bg-white text-xs text-stone-700 focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      קטגוריה: {c}
                    </option>
                  ))}
                </select>

                {/* Priority selector */}
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as Priority)}
                  className="px-2.5 py-1.5 rounded-xl border border-stone-300 bg-white text-xs text-stone-700 focus:outline-none"
                >
                  <option value="low">עדיפות רגילה / פנאי</option>
                  <option value="medium">עדיפות בינונית</option>
                  <option value="high">עדיפות גבוהה / דחוף</option>
                </select>

                {/* Time slot */}
                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-stone-300 text-xs">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="bg-transparent focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={!newTaskTitle.trim()}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  הוסף משימה
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Task items list */}
        {filteredTasks.length === 0 ? (
          <div className="py-8 text-center text-stone-400">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30 text-stone-400" />
            <p className="text-sm font-medium">אין משימות תואמות להצגה</p>
            <p className="text-xs text-stone-400 mt-1">
              הוסיפי משימה בעזרת הכפתור למעלה כדי להתחיל את היום מסודר
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-150 ${
                  task.completed
                    ? 'bg-stone-50/70 border-stone-200/80 text-stone-400'
                    : 'bg-white hover:bg-stone-50/60 border-stone-200 text-stone-800 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleTaskCheckbox(task.id, task.completed)}
                    className="text-stone-400 hover:text-indigo-600 transition shrink-0 cursor-pointer"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                    ) : (
                      <Circle className="w-5 h-5 hover:scale-105 transition" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium leading-relaxed truncate ${
                        task.completed ? 'line-through text-stone-400' : 'text-stone-800'
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${
                          CATEGORY_COLORS[task.category] || CATEGORY_COLORS['אחר']
                        }`}
                      >
                        {task.category}
                      </span>

                      {task.priority === 'high' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 font-semibold flex items-center gap-0.5">
                          דחוף
                        </span>
                      )}

                      {task.time && (
                        <span className="text-[10px] text-stone-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.time}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition shrink-0">
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="מחק משימה"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daily Habits Tracker (Water, Reading, Walk, Mindfulness) */}
      <div className="p-5 rounded-2xl bg-white shadow-xs border border-stone-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <h3 className="font-bold text-sm text-stone-900">
              מעקב הרגלים יומיים (Habits)
            </h3>
          </div>
          <span className="text-xs text-stone-500">
            הקליקי לסימון
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {habits.map((habit) => {
            const currentVal = habitsProgress[habit.id] || 0;
            const isCompleted = currentVal >= habit.targetPerDay;

            if (habit.id === 'water') {
              // Interactive water cups
              return (
                <div
                  key={habit.id}
                  className="p-3 rounded-xl bg-sky-50/60 border border-sky-200/80 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-sky-950 flex items-center gap-1.5">
                      <span>💧</span> {habit.name}
                    </span>
                    <span className="text-[11px] font-bold text-sky-700">
                      {currentVal}/{habit.targetPerDay}
                    </span>
                  </div>
                  <div className="flex gap-1 justify-center flex-wrap">
                    {Array.from({ length: habit.targetPerDay }).map((_, cupIdx) => {
                      const filled = cupIdx < currentVal;
                      return (
                        <button
                          key={cupIdx}
                          type="button"
                          onClick={() =>
                            handleHabitChange(
                              habit.id,
                              filled && cupIdx === currentVal - 1 ? cupIdx : cupIdx + 1
                            )
                          }
                          className={`w-6 h-7 rounded-b-md border transition cursor-pointer flex items-end justify-center pb-0.5 text-[10px] ${
                            filled
                              ? 'bg-sky-500 border-sky-600 text-white shadow-xs'
                              : 'bg-white border-sky-300 text-sky-400 hover:bg-sky-100'
                          }`}
                          title={`כוס ${cupIdx + 1}`}
                        >
                          💧
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={habit.id}
                onClick={() =>
                  handleHabitChange(habit.id, isCompleted ? 0 : habit.targetPerDay)
                }
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                  isCompleted
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{habit.icon}</span>
                  <div>
                    <p className="text-xs font-bold leading-tight">{habit.name}</p>
                    <p className="text-[10px] text-stone-500">
                      {isCompleted ? 'בוצע היום!' : 'טרם בוצע'}
                    </p>
                  </div>
                </div>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border transition ${
                    isCompleted
                      ? 'bg-emerald-500 border-emerald-600 text-white'
                      : 'border-stone-300 bg-white'
                  }`}
                >
                  {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Gratitude & Notes */}
      <div className="p-5 rounded-2xl bg-linear-to-br from-rose-50/50 via-pink-50/30 to-purple-50/40 border border-rose-200/60 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-4 h-4 text-rose-500 fill-rose-100" />
          <h3 className="font-bold text-sm text-stone-900">
            הודיה של היום (Gratitude)
          </h3>
        </div>
        <p className="text-xs text-stone-500 mb-3">
          דבר אחד לפחות שקרה היום ומילא את הלב בתודה או שמחה קטנה:
        </p>
        <textarea
          rows={2}
          value={gratitudeText}
          onChange={(e) => updateGratitude(e.target.value)}
          placeholder="אני מודה היום על..."
          className="w-full p-3 rounded-xl bg-white/90 border border-rose-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs sm:text-sm text-stone-800 resize-none leading-relaxed"
        />
      </div>
    </div>
  );
};
