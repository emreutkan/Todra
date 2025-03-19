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
}
export type TaskPriority = 'low' | 'normal' | 'high';

export type RootStackParamList = {
    Splash: undefined;
    Home: undefined;
    AddTask: undefined;
    EditTask: { taskId: string };
    TaskDetails: { taskId: string };
};