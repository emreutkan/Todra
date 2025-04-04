// This is a sample implementation - adjust to match your actual storage service
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from './types';

const TASKS_STORAGE_KEY = 'tasks_data';
const ARCHIVED_TASKS_STORAGE_KEY = 'archived_tasks_data';

export const storageService = {
    // Save tasks to AsyncStorage
    saveTasks: async (tasks: Task[]): Promise<void> => {
        try {
            // Log for debugging
            console.log('Saving tasks:', JSON.stringify(tasks));

            // Make sure all tasks have all required fields
            const validatedTasks = tasks.map(task => {
                // Ensure all new fields have default values if they don't exist
                return {
                    ...task,
                    dueDate: task.dueDate || task.createdAt, // Default to createdAt if no dueDate
                    category: task.category || 'personal',   // Default category if none exists
                    archived: task.archived || false,        // Default to not archived
                };
            });

            // Separate active and archived tasks
            const activeTasks = validatedTasks.filter(task => !task.archived);
            const archivedTasks = validatedTasks.filter(task => task.archived);

            // Save active tasks
            await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(activeTasks));

            // If there are archived tasks, merge them with existing archived tasks
            if (archivedTasks.length > 0) {
                const existingArchivedTasks = await loadArchivedTasks();
                const mergedArchivedTasks = [...existingArchivedTasks, ...archivedTasks];
                await AsyncStorage.setItem(ARCHIVED_TASKS_STORAGE_KEY, JSON.stringify(mergedArchivedTasks));
            }

            console.log('Tasks saved successfully');
        } catch (error) {
            console.error('Error saving tasks:', error);
            throw error;
        }
    },

    // Load active (non-archived) tasks from AsyncStorage
    loadTasks: async (): Promise<Task[]> => {
        try {
            const tasksJson = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
            if (!tasksJson) {
                console.log('No tasks found in storage, returning empty array');
                return [];
            }

            const tasks = JSON.parse(tasksJson) as Task[];

            // Migrate old task format to new format if needed
            const migratedTasks = tasks.map(task => {
                return {
                    ...task,
                    dueDate: task.dueDate || task.createdAt, // Add dueDate if missing
                    category: task.category || 'personal',   // Add category if missing
                    archived: task.archived || false,        // Add archived flag if missing
                };
            });

            console.log(`Loaded ${migratedTasks.length} active tasks from storage`);
            return migratedTasks;
        } catch (error) {
            console.error('Error loading tasks:', error);
            return []; // Return empty array on error
        }
    },

    // Load archived tasks from AsyncStorage
    loadArchivedTasks: async (): Promise<Task[]> => {
        try {
            const tasksJson = await AsyncStorage.getItem(ARCHIVED_TASKS_STORAGE_KEY);
            if (!tasksJson) {
                console.log('No archived tasks found in storage, returning empty array');
                return [];
            }

            const tasks = JSON.parse(tasksJson) as Task[];
            console.log(`Loaded ${tasks.length} archived tasks from storage`);
            return tasks;
        } catch (error) {
            console.error('Error loading archived tasks:', error);
            return []; // Return empty array on error
        }
    },

    // Archive a task
    archiveTask: async (taskId: string): Promise<void> => {
        try {
            // Load active tasks
            const activeTasks = await storageService.loadTasks();

            // Find the task to archive
            const taskToArchive = activeTasks.find(task => task.id === taskId);
            if (!taskToArchive) {
                console.error('Task not found for archiving:', taskId);
                return;
            }

            // Mark task as archived
            taskToArchive.archived = true;

            // Remove task from active list
            const remainingActiveTasks = activeTasks.filter(task => task.id !== taskId);

            // Load archived tasks and add the newly archived task
            const archivedTasks = await storageService.loadArchivedTasks();
            archivedTasks.push(taskToArchive);

            // Save both lists
            await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(remainingActiveTasks));
            await AsyncStorage.setItem(ARCHIVED_TASKS_STORAGE_KEY, JSON.stringify(archivedTasks));

            console.log('Task archived successfully:', taskId);
        } catch (error) {
            console.error('Error archiving task:', error);
            throw error;
        }
    },

    // Archive all completed tasks
    archiveCompletedTasks: async (): Promise<number> => {
        try {
            // Load active tasks
            const activeTasks = await storageService.loadTasks();

            // Separate completed and non-completed tasks
            const completedTasks = activeTasks.filter(task => task.completed);
            const remainingTasks = activeTasks.filter(task => !task.completed);

            // If no completed tasks, return 0
            if (completedTasks.length === 0) {
                return 0;
            }

            // Mark completed tasks as archived
            completedTasks.forEach(task => {
                task.archived = true;
            });

            // Load existing archived tasks
            const archivedTasks = await storageService.loadArchivedTasks();

            // Add newly archived tasks
            const updatedArchivedTasks = [...archivedTasks, ...completedTasks];

            // Save both lists
            await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(remainingTasks));
            await AsyncStorage.setItem(ARCHIVED_TASKS_STORAGE_KEY, JSON.stringify(updatedArchivedTasks));

            console.log(`${completedTasks.length} completed tasks archived successfully`);
            return completedTasks.length;
        } catch (error) {
            console.error('Error archiving completed tasks:', error);
            return 0;
        }
    },

    // Restore a task from archive to active tasks
    restoreTask: async (taskId: string): Promise<void> => {
        try {
            // Load archived tasks
            const archivedTasks = await storageService.loadArchivedTasks();

            // Find the task to restore
            const taskToRestore = archivedTasks.find(task => task.id === taskId);
            if (!taskToRestore) {
                console.error('Task not found for restoration:', taskId);
                return;
            }

            // Mark as not archived
            taskToRestore.archived = false;

            // Remove from archived list
            const remainingArchivedTasks = archivedTasks.filter(task => task.id !== taskId);

            // Add to active tasks
            const activeTasks = await storageService.loadTasks();
            activeTasks.push(taskToRestore);

            // Save both lists
            await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(activeTasks));
            await AsyncStorage.setItem(ARCHIVED_TASKS_STORAGE_KEY, JSON.stringify(remainingArchivedTasks));

            console.log('Task restored successfully:', taskId);
        } catch (error) {
            console.error('Error restoring task:', error);
            throw error;
        }
    },

    // Clear all tasks (useful for testing)
    clearTasks: async (): Promise<void> => {
        try {
            await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify([]));
            console.log('All tasks cleared from storage');
        } catch (error) {
            console.error('Error clearing tasks:', error);
            throw error;
        }
    },

    // Clear all archived tasks
    clearArchivedTasks: async (): Promise<void> => {
        try {
            await AsyncStorage.setItem(ARCHIVED_TASKS_STORAGE_KEY, JSON.stringify([]));
            console.log('All archived tasks cleared from storage');
        } catch (error) {
            console.error('Error clearing archived tasks:', error);
            throw error;
        }
    }
};

// Export the loadArchivedTasks function for external use
export const loadArchivedTasks = storageService.loadArchivedTasks;