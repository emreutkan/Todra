import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Task } from './types';
import * as FileSystem from 'expo-file-system';
import * as Device from 'expo-device';

const TASKS_KEY = '@task_planner_tasks';

// Check if iCloud is available (this is a simplified check)
const isICloudAvailable = Platform.OS === 'ios' && Device.isDevice;

export const storageService = {
    // Save tasks to storage
    saveTasks: async (tasks: Task[]): Promise<void> => {
        try {
            const jsonValue = JSON.stringify(tasks);
            await AsyncStorage.setItem(TASKS_KEY, jsonValue);

            // For iOS - save to iCloud directory if available
            if (isICloudAvailable && FileSystem.documentDirectory) {
                // Note: This is simplified - real iCloud integration requires more steps
                console.log('iCloud backup would be implemented here in a real app');
            }
        } catch (error) {
            console.error('Error saving tasks:', error);
            throw error;
        }
    },

    // Load tasks from storage
    loadTasks: async (): Promise<Task[]> => {
        try {
            const jsonValue = await AsyncStorage.getItem(TASKS_KEY);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (error) {
            console.error('Error loading tasks:', error);
            return [];
        }
    },

    // Clear all tasks
    clearTasks: async (): Promise<void> => {
        try {
            await AsyncStorage.removeItem(TASKS_KEY);
        } catch (error) {
            console.error('Error clearing tasks:', error);
        }
    },

    // Get storage information
    getStorageInfo: async (): Promise<string> => {
        try {
            // Get all keys
            const keys = await AsyncStorage.getAllKeys();
            const storageInfo = {
                storageLocation: Platform.OS === 'ios' ?
                    (isICloudAvailable ? 'iOS AsyncStorage with iCloud backup option' : 'iOS AsyncStorage') :
                    'Android AsyncStorage',
                keys: keys,
                tasksCount: 0,
                byteSize: 0
            };

            // Get tasks count
            const tasksJson = await AsyncStorage.getItem(TASKS_KEY);
            if (tasksJson) {
                const tasks = JSON.parse(tasksJson);
                storageInfo.tasksCount = tasks.length;
                storageInfo.byteSize = new Blob([tasksJson]).size;
            }

            console.log('Storage Information:', JSON.stringify(storageInfo, null, 2));
            return JSON.stringify(storageInfo);
        } catch (error) {
            console.error('Error getting storage info:', error);
            return 'Error getting storage information';
        }
    }
};