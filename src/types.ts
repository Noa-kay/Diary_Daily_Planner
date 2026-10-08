export type Priority = 'low' | 'medium' | 'high';

export type TaskCategory = 
  | 'Personal' 
  | 'Work' 
  | 'Home' 
  | 'Study' 
  | 'Health' 
  | 'Errands' 
  | 'Other'
  | 'אישי' 
  | 'עבודה' 
  | 'בית' 
  | 'לימודים' 
  | 'בריאות' 
  | 'סידורים' 
  | 'אחר';

export interface Task {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  completed: boolean;
  priority: Priority;
  category: TaskCategory;
  time?: string; // e.g. "09:00"
  createdAt: number;
}

export type IdeaCategory = 
  | 'Reflection' 
  | 'Idea' 
  | 'Project' 
  | 'Inspiration' 
  | 'Insight' 
  | 'Dream' 
  | 'Creative' 
  | 'Quotes'
  | 'Vision'
  | 'Other'
  | 'רעיון' 
  | 'מחשבה' 
  | 'תובנה' 
  | 'פרויקט' 
  | 'חלום' 
  | 'השראה' 
  | 'יצירה';

export type MoodType = 'great' | 'calm' | 'tired' | 'stressed' | 'sad' | 'creative';

export type IdeaStatus = 'spark' | 'in_progress' | 'cherished' | 'completed';

export interface IdeaCheckItem {
  id: string;
  text: string;
  done: boolean;
}

export interface IdeaEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  category: IdeaCategory;
  mood?: MoodType;
  tags: string[];
  pinned?: boolean;
  colorTheme?: 'pink' | 'amber' | 'lavender' | 'emerald' | 'rose' | 'sky';
  sparkRating?: number; // 1 to 5 stars
  status?: IdeaStatus;
  checkItems?: IdeaCheckItem[];
  sticker?: string; // decorative sticker emoji
  audioData?: string; // audio recording (base64 or voice memo)
  targetDate?: string; // optional milestone/target date
  createdAt: number;
  updatedAt: number;
}

export type FlowLevel = 'spotting' | 'light' | 'medium' | 'heavy';

export type CycleSymptom = 
  | 'Cramps'
  | 'Headache'
  | 'Bloating'
  | 'Fatigue'
  | 'Tender'
  | 'Backache'
  | 'Mood Swings'
  | 'Cravings'
  | 'Acne'
  | 'High Energy'
  | 'התכווצויות'
  | 'כאב ראש'
  | 'נפיחות'
  | 'עייפות'
  | 'רגישות בחזה'
  | 'כאבי גב'
  | 'חשקים למתוק'
  | 'מצב רוח תנודתי'
  | 'פצעונים'
  | 'אנרגיה גבוהה';

export interface CycleDayLog {
  date: string; // YYYY-MM-DD
  isPeriod: boolean;
  flow?: FlowLevel;
  symptoms: CycleSymptom[];
  notes?: string;
  painLevel?: number; // 0 to 10 comfort/pain rating
  temperature?: number;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  targetPerDay: number;
  unit: string;
}

export interface DayHabitProgress {
  habitId: string;
  value: number; // e.g. glasses of water, 1 for boolean
}

export type EventRecurrence = 'none' | 'yearly-gregorian' | 'yearly-hebrew';

export interface DailyWitItem {
  id: string;
  type: 'joke' | 'idiom' | 'quote' | 'witticism';
  text: string;
  meaningOrPunchline?: string;
  createdAt: number;
}

export interface MiddayCheckIn {
  timestamp: number;
  moodShift: string; // e.g., 'Energized', 'Peaceful', 'Need a Breather', 'Feeling Accomplished', 'A Bit Drained', 'Creative'
  cravingOrDesire?: string; // What do I crave or want to do right now?
  afternoonIntention?: string; // How I'll make the afternoon wonderful
  completed: boolean;
}

export interface DayLog {
  date: string; // YYYY-MM-DD
  gratitude?: string;
  topPriorities?: [string, string, string];
  dailyNote?: string;
  dailyThoughts?: string;
  dailyAffirmation?: string;
  importantEvents?: string[]; // Events that show on the monthly calendar square
  witItems?: DailyWitItem[]; // Jokes, idioms and catchy phrases of the day
  middayCheckIn?: MiddayCheckIn; // Midday pulse, mood change, and cravings
  mood?: MoodType;
  energyLevel?: number; // 1 to 5 stars/hearts
  meals?: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
    snack?: string;
  };
  accomplishments?: string[];
  schedule?: Record<string, string>; // e.g. "08:00": "Gentle morning"
  selfCare?: string[]; // checked self care items
  habitsProgress?: Record<string, number>;
}

export type AppTheme = 'paper' | 'leather' | 'rose' | 'lavender' | 'slate' | 'midnight';

export type BookView = 'calendar' | 'day' | 'ideas' | 'cycle' | 'jokes-digest';
export type ActiveTab = BookView;

export interface AppSettings {
  theme: AppTheme;
  enableCycleTracker: boolean;
  cycleDiscreteMode: boolean; // Replaces period icons/terms with discrete flower
  averageCycleLength: number; // default 28 days
  averagePeriodLength: number; // default 5 days
  pinCode?: string; // 4 digits, optional
  isPinLocked: boolean;
  autoLockMinutes?: number; // Auto-lock inactivity timeout in minutes (default 20, 0 = disabled)
  userDisplayName?: string;
  soundAlertsEnabled?: boolean; // Gentle chime reminder when events/tasks approach
  monthlyNotes?: Record<string, string>; // YYYY-MM -> monthly goals
}

export interface JournalDatabase {
  version: number;
  tasks: Task[];
  ideas: IdeaEntry[];
  cycleLogs: Record<string, CycleDayLog>; // key: YYYY-MM-DD
  dayLogs: Record<string, DayLog>; // key: YYYY-MM-DD
  habits: Habit[];
  settings: AppSettings;
  lastUpdated: number;
}
