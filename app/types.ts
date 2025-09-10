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

export type RootStackParamList = {
  Splash: undefined;
  WelcomeSlider: undefined;
  Home:
    | { showSuccessMessage?: boolean; message?: string; timestamp?: number }
    | undefined;
  AddTask: { selectedDate?: Date } | undefined;
  EditTask: { taskId: string };
  TaskDetails: { taskId: string };
  Settings: undefined;
  AllTasks: undefined;
  ArchivedTasks: undefined; // New screen for viewing archived tasks
};
