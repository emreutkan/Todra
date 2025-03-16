export type TaskPriority = 'normal' | 'high' | 'crucial' | 'optional';

export interface Task {
    id: string;
    title: string;
    description?: string;
    priority: TaskPriority;
    completed: boolean;
    createdAt: number;
    dueDate?: number;
}

export type RootStackParamList = {
    Splash: undefined;
    Home: undefined;
    AddTask: undefined;
    EditTask: { taskId: string };
    TaskDetails: { taskId: string };
};