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
}
export type TaskPriority = "low" | "normal" | "high";

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
