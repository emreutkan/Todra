export interface Task {
    id: string;
    title: string;
    description: string;
    priority: TaskPriority;
    completed: boolean;
    createdAt: number; // timestamp
    dueDate: number;   // timestamp - new field
    category: string;  // new field
}

export type TaskPriority = 'optional' | 'normal' | 'high' | 'crucial';

export type RootStackParamList = {
    Splash: undefined;
    Home: undefined;
    AddTask: undefined;
    EditTask: { taskId: string };
    TaskDetails: { taskId: string };
};