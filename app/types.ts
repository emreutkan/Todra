export interface Task {
    id: string;
    title: string;
    description: string;
    priority: TaskPriority;
    completed: boolean;
    createdAt: number; // timestamp
    dueDate: number;   // timestamp
    category: string;
    predecessorIds: string[]; // Add this new field
    archived: boolean; // New field to track archived status
}
export type TaskPriority = 'low' | 'normal' | 'high';

export type RootStackParamList = {
    Splash: undefined;
    WelcomeSlider: undefined;
    Home: undefined;
    AddTask: undefined;
    EditTask: { taskId: string };
    TaskDetails: { taskId: string };
    Settings: undefined;
    AllTasks: undefined;
    ArchivedTasks: undefined; // New screen for viewing archived tasks
};