export type Priority = 'low' | 'medium' | 'high';

export type TaskCategory = 'אישי' | 'עבודה' | 'בית' | 'לימודים' | 'בריאות' | 'סידורים' | 'אחר';

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
  | 'Other'
  | 'רעיון' 
  | 'מחשבה' 
  | 'תובנה' 
  | 'פרויקט' 
  | 'חלום' 
  | 'השראה' 
  | 'יצירה';

export type MoodType = 'great' | 'calm' | 'tired' | 'stressed' | 'sad' | 'creative';

export interface IdeaEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  category: IdeaCategory;
  mood?: MoodType;
  tags: string[];
  pinned?: boolean;
  createdAt: number;
  updatedAt: number;
}

export type FlowLevel = 'spotting' | 'light' | 'medium' | 'heavy';

export type CycleSymptom = 
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

export interface DayLog {
  date: string; // YYYY-MM-DD
  gratitude?: string;
  topPriorities?: [string, string, string];
  dailyNote?: string;
  dailyThoughts?: string;
  importantEvents?: string[]; // Events that show on the monthly calendar square
  mood?: MoodType;
  energyLevel?: number; // 1 to 5 stars/hearts
  meals?: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
    snack?: string;
  };
  accomplishments?: string[];
  schedule?: Record<string, string>; // e.g. "08:00": "בוקר רגוע"
  selfCare?: string[]; // checked self care items
  habitsProgress?: Record<string, number>;
}

export type AppTheme = 'paper' | 'leather' | 'rose' | 'lavender' | 'slate' | 'midnight';

export type BookView = 'calendar' | 'day' | 'ideas' | 'cycle';
export type ActiveTab = BookView;

export interface AppSettings {
  theme: AppTheme;
  enableCycleTracker: boolean;
  cycleDiscreteMode: boolean; // Replaces period icons/terms with discrete flower
  averageCycleLength: number; // default 28 days
  averagePeriodLength: number; // default 5 days
  pinCode?: string; // 4 digits, optional
  isPinLocked: boolean;
  userDisplayName?: string;
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
