// This is a sample implementation - adjust to match your actual storage service
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from './types';

const TASKS_STORAGE_KEY = 'tasks_data';

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
                };
            });

            await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(validatedTasks));
            console.log('Tasks saved successfully');
        } catch (error) {
            console.error('Error saving tasks:', error);
            throw error;
        }
    },

    // Load tasks from AsyncStorage
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
                };
            });

            console.log(`Loaded ${migratedTasks.length} tasks from storage`);
            return migratedTasks;
        } catch (error) {
            console.error('Error loading tasks:', error);
            return []; // Return empty array on error
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
    }
};