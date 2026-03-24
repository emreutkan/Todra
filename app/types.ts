export interface RepetitionRule {
  enabled: boolean;
  type: "daily" | "weekly" | "monthly";
  interval: number; // Every X days/weeks/months
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  endDate?: number; // Optional end date for repetition (timestamp)
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  completed: boolean;
  createdAt: number; // timestamp
  dueDate: number; // timestamp
  category: string;
  predecessorIds: string[]; // Add this new field
  archived: boolean; // New field to track archived status
  archivedAt?: string; // Optional field for when task was archived
  repetition?: RepetitionRule; // Optional repetition rule
  isRecurring?: boolean; // Flag to indicate if this is a recurring task
  parentTaskId?: string; // ID of the original task if this is a generated recurring task
  remindMe?: ReminderSettings; // Optional reminder preferences
}
export type TaskPriority = "low" | "normal" | "high";

export type ReminderPreset = "none" | "1h" | "2h" | "6h" | "24h" | "custom";

export interface ReminderSettings {
  enabled: boolean;
  preset: ReminderPreset; // quick preset, or custom
  customOffsetMs?: number; // if preset = custom, milliseconds before dueDate
  spamMode?: boolean; // aggressive reminders pattern
}

export type HabitScheduleType = "daily" | "interval" | "weekly";

export interface DayPhase {
  dayOfWeek: number; // 0–6 (for "weekly" schedule — fixed per weekday)
  name: string; // "Push Day", "Pull Day", etc.
  description?: string;
}

export interface HabitCompletion {
  date: string; // "YYYY-MM-DD"
  completedAt: number; // unix timestamp
  phaseName?: string; // snapshot of phase name at time of completion
}

export interface Habit {
  id: string;
  title: string;
  description: string;
  category: string;
  color: string; // hex accent (left border, checkbox fill)
  icon: string; // Ionicons name
  scheduleType: HabitScheduleType;
  // "daily": shown every day
  // "interval": every N days, phases cycle by occurrence count
  intervalDays: number; // for "interval": every N days (default 1)
  intervalPhases: string[]; // for "interval": ["Push", "Pull", "Legs"]
  // "weekly": specific weekdays, each with an optional phase name
  dayPhases: DayPhase[]; // for "weekly": [{dayOfWeek: 1, name: "Push Day"}, ...]
  startDate: string; // "YYYY-MM-DD"
  endDate?: string; // "YYYY-MM-DD", optional
  completions: HabitCompletion[];
  createdAt: number;
  isArchived: boolean;
  archivedAt?: string;
}

export type RootStackParamList = {
  Splash: undefined;
  Home:
    | { showSuccessMessage?: boolean; message?: string; timestamp?: number }
    | undefined;
  AddTask: { selectedDate?: Date } | undefined;
  EditTask: { taskId: string };
  TaskDetails: { taskId: string };
  Settings: undefined;
  AllTasks: undefined;
  ArchivedTasks: undefined; // New screen for viewing archived tasks
  AiAssistant: undefined;
  AiSettings: undefined;
  Habits: undefined;
  AddHabit: { habitId?: string } | undefined;
  HabitDetail: { habitId: string };
};
