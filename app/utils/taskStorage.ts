import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../types';

// Storage Keys
const ACTIVE_TASKS_KEY = '@tasks:active';
const ARCHIVED_TASKS_KEY = '@tasks:archived';
const CATEGORIES_KEY = '@categories';

// Get all active tasks
export const getActiveTasks = async (): Promise<Task[]> => {
    try {
        const tasksJson = await AsyncStorage.getItem(ACTIVE_TASKS_KEY);
        return tasksJson ? JSON.parse(tasksJson) : [];
    } catch (error) {
        console.error('Failed to get active tasks:', error);
        return [];
    }
};

// Get all archived tasks
export const getArchivedTasks = async (): Promise<Task[]> => {
    try {
        const tasksJson = await AsyncStorage.getItem(ARCHIVED_TASKS_KEY);
        return tasksJson ? JSON.parse(tasksJson) : [];
    } catch (error) {
        console.error('Failed to get archived tasks:', error);
        return [];
    }
};

// Save active tasks
export const saveActiveTasks = async (tasks: Task[]): Promise<boolean> => {
    try {
        await AsyncStorage.setItem(ACTIVE_TASKS_KEY, JSON.stringify(tasks));
        return true;
    } catch (error) {
        console.error('Failed to save active tasks:', error);
        return false;
    }
};

// Save archived tasks
export const saveArchivedTasks = async (tasks: Task[]): Promise<boolean> => {
    try {
        await AsyncStorage.setItem(ARCHIVED_TASKS_KEY, JSON.stringify(tasks));
        return true;
    } catch (error) {
        console.error('Failed to save archived tasks:', error);
        return false;
    }
};

// Archive a task
export const archiveTask = async (taskId: string): Promise<boolean> => {
    try {
        // Get current active and archived tasks
        const activeTasks = await getActiveTasks();
        const archivedTasks = await getArchivedTasks();

        // Find the task to archive
        const taskIndex = activeTasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) return false;

        // Move task from active to archived
        const [task] = activeTasks.splice(taskIndex, 1);
        archivedTasks.push({...task, archivedAt: new Date().toISOString()});

        // Save both arrays
        await saveActiveTasks(activeTasks);
        await saveArchivedTasks(archivedTasks);

        return true;
    } catch (error) {
        console.error('Failed to archive task:', error);
        return false;
    }
};

// Unarchive a task
export const unarchiveTask = async (taskId: string): Promise<boolean> => {
    try {
        // Get current active and archived tasks
        const activeTasks = await getActiveTasks();
        const archivedTasks = await getArchivedTasks();

        // Find the task to unarchive
        const taskIndex = archivedTasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) return false;

        // Move task from archived to active
        const [task] = archivedTasks.splice(taskIndex, 1);
        // Remove the archivedAt property
        const { archivedAt, ...restTask } = task;
        activeTasks.push(restTask);

        // Save both arrays
        await saveActiveTasks(activeTasks);
        await saveArchivedTasks(archivedTasks);

        return true;
    } catch (error) {
        console.error('Failed to unarchive task:', error);
        return false;
    }
};

// Add new task (always to active tasks)
export const addTask = async (task: Task): Promise<boolean> => {
    try {
        const tasks = await getActiveTasks();
        tasks.push(task);
        return await saveActiveTasks(tasks);
    } catch (error) {
        console.error('Failed to add task:', error);
        return false;
    }
};

// Update a task in either active or archived list
export const updateTask = async (updatedTask: Task): Promise<boolean> => {
    try {
        // Check active tasks first
        let activeTasks = await getActiveTasks();
        const activeIndex = activeTasks.findIndex(task => task.id === updatedTask.id);

        if (activeIndex !== -1) {
            // Update in active tasks
            activeTasks[activeIndex] = updatedTask;
            return await saveActiveTasks(activeTasks);
        }

        // If not in active, check archived
        let archivedTasks = await getArchivedTasks();
        const archivedIndex = archivedTasks.findIndex(task => task.id === updatedTask.id);

        if (archivedIndex !== -1) {
            // Update in archived tasks
            archivedTasks[archivedIndex] = updatedTask;
            return await saveArchivedTasks(archivedTasks);
        }

        return false;
    } catch (error) {
        console.error('Failed to update task:', error);
        return false;
    }
};

// Delete a task from either active or archived list
export const deleteTask = async (taskId: string): Promise<boolean> => {
    try {
        // Try to delete from active tasks first
        let activeTasks = await getActiveTasks();
        const activeTaskIndex = activeTasks.findIndex(task => task.id === taskId);

        if (activeTaskIndex !== -1) {
            activeTasks.splice(activeTaskIndex, 1);
            return await saveActiveTasks(activeTasks);
        }

        // If not in active, try archived
        let archivedTasks = await getArchivedTasks();
        const archivedTaskIndex = archivedTasks.findIndex(task => task.id === taskId);

        if (archivedTaskIndex !== -1) {
            archivedTasks.splice(archivedTaskIndex, 1);
            return await saveArchivedTasks(archivedTasks);
        }

        return false;
    } catch (error) {
        console.error('Failed to delete task:', error);
        return false;
    }
};

// Auto-archive completed tasks
export const autoArchiveCompletedTasks = async (): Promise<number> => {
    try {
        const activeTasks = await getActiveTasks();
        const archivedTasks = await getArchivedTasks();

        // Find completed tasks
        const completedTasks = activeTasks.filter(task => task.completed);
        const remainingTasks = activeTasks.filter(task => !task.completed);

        // If there are no completed tasks, nothing to do
        if (completedTasks.length === 0) return 0;

        // Add archived timestamp to completed tasks
        const tasksToArchive = completedTasks.map(task => ({
            ...task,
            archivedAt: new Date().toISOString()
        }));

        // Add to archived tasks
        archivedTasks.push(...tasksToArchive);

        // Save both lists
        await saveActiveTasks(remainingTasks);
        await saveArchivedTasks(archivedTasks);

        return completedTasks.length;
    } catch (error) {
        console.error('Failed to auto-archive tasks:', error);
        return 0;
    }
};

// Clear all tasks (both active and archived)
export const clearAllTasks = async (): Promise<boolean> => {
    try {
        await AsyncStorage.removeItem(ACTIVE_TASKS_KEY);
        await AsyncStorage.removeItem(ARCHIVED_TASKS_KEY);
        return true;
    } catch (error) {
        console.error('Failed to clear all tasks:', error);
        return false;
    }
};

// Get all tasks (both active and archived)
export const getAllTasks = async (): Promise<{ active: Task[], archived: Task[] }> => {
    try {
        const active = await getActiveTasks();
        const archived = await getArchivedTasks();
        return { active, archived };
    } catch (error) {
        console.error('Failed to get all tasks:', error);
        return { active: [], archived: [] };
    }
};