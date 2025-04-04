import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from "react-native";

// Define task-related types
export interface Task {
    id: string;
    title: string;
    description: string;
    priority: string;
    dueDate: string;
    completed: boolean;
    createdAt: string;
    updatedAt: string;
}

// Define the settings shape
type Settings = {
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    confirmDeleteEnabled: boolean;
    autoArchiveEnabled: boolean;
    lastBackupDate: string | null;
};

// Default settings
const defaultSettings: Settings = {
    notificationsEnabled: true,
    soundEnabled: true,
    confirmDeleteEnabled: true,
    autoArchiveEnabled: false,
    lastBackupDate: null,
};

// Define the context type
type SettingsContextType = {
    settings: Settings;
    updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
    resetSettings: () => void;
    exportData: () => Promise<string>;
    importData: (data: string) => Promise<boolean>;
    clearAllTasks: () => Promise<boolean>;
    archiveCompletedTasks: () => Promise<number>;
    getCurrentTasks: () => Promise<Task[]>;
    getArchivedTasks: () => Promise<Task[]>;
    getLastBackupDate: () => string | null;
};

// Storage keys
const STORAGE_KEYS = {
    SETTINGS: '@taskplanner_settings',
    CURRENT_TASKS: '@taskplanner_current_tasks',
    ARCHIVED_TASKS: '@taskplanner_archived_tasks',
};

// Create the context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load settings from AsyncStorage when the component mounts
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const savedSettings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
                if (savedSettings) {
                    setSettings(JSON.parse(savedSettings));
                }
                setIsLoaded(true);
            } catch (error) {
                console.error('Failed to load settings:', error);
                setIsLoaded(true);
            }
        };

        loadSettings();
    }, []);

    // Save settings to AsyncStorage whenever they change
    useEffect(() => {
        if (isLoaded) {
            const saveSettings = async () => {
                try {
                    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
                } catch (error) {
                    console.error('Failed to save settings:', error);
                }
            };

            saveSettings();
        }
    }, [settings, isLoaded]);

    // Function to update a single setting
    const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
        setSettings(prev => {
            const newSettings = { ...prev, [key]: value };

            // If autoArchiveEnabled is turned on, archive completed tasks
            if (key === 'autoArchiveEnabled' && value === true) {
                archiveCompletedTasks();
            }

            return newSettings;
        });
    };

    // Function to reset all settings to defaults
    const resetSettings = () => {
        setSettings(defaultSettings);
    };

    // Get current (active) tasks
    const getCurrentTasks = async (): Promise<Task[]> => {
        try {
            const tasksData = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_TASKS);
            return tasksData ? JSON.parse(tasksData) : [];
        } catch (error) {
            console.error('Failed to get current tasks:', error);
            return [];
        }
    };

    // Get archived tasks
    const getArchivedTasks = async (): Promise<Task[]> => {
        try {
            const archivedData = await AsyncStorage.getItem(STORAGE_KEYS.ARCHIVED_TASKS);
            return archivedData ? JSON.parse(archivedData) : [];
        } catch (error) {
            console.error('Failed to get archived tasks:', error);
            return [];
        }
    };

    // Save current tasks
    const saveCurrentTasks = async (tasks: Task[]): Promise<void> => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_TASKS, JSON.stringify(tasks));
        } catch (error) {
            console.error('Failed to save current tasks:', error);
        }
    };

    // Save archived tasks
    const saveArchivedTasks = async (tasks: Task[]): Promise<void> => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.ARCHIVED_TASKS, JSON.stringify(tasks));
        } catch (error) {
            console.error('Failed to save archived tasks:', error);
        }
    };

    // Function to archive completed tasks
    const archiveCompletedTasks = async (): Promise<number> => {
        try {
            // Get current tasks
            const currentTasks = await getCurrentTasks();

            // Separate completed and active tasks
            const completedTasks = currentTasks.filter(task => task.completed);
            const activeTasks = currentTasks.filter(task => !task.completed);

            if (completedTasks.length === 0) {
                return 0; // No tasks to archive
            }

            // Get existing archived tasks and append new ones
            const archivedTasks = await getArchivedTasks();
            const updatedArchivedTasks = [...archivedTasks, ...completedTasks];

            // Save both lists
            await saveCurrentTasks(activeTasks);
            await saveArchivedTasks(updatedArchivedTasks);

            return completedTasks.length;
        } catch (error) {
            console.error('Failed to archive completed tasks:', error);
            return 0;
        }
    };

    // Export data function
    const exportData = async (): Promise<string> => {
        try {
            // Get all tasks from AsyncStorage
            const allTasks = await AsyncStorage.getItem('@tasks') || '[]';
            const allCategories = await AsyncStorage.getItem('@categories') || '[]';

            // Create a well-formatted export object with current timestamp
            const exportObject = {
                metadata: {
                    version: "1.0.0",
                    exportDate: new Date().toISOString(),
                    platform: Platform.OS,
                },
                data: {
                    tasks: JSON.parse(allTasks),
                    categories: JSON.parse(allCategories),
                    settings: settings
                }
            };

            // Convert to string for export
            return JSON.stringify(exportObject, null, 2); // Pretty print with indentation
        } catch (error) {
            console.error('Failed to export data:', error);
            throw new Error('Failed to export data');
        }
    };

    // Import data function
    const importData = async (data: string): Promise<boolean> => {
        try {
            const parsedData = JSON.parse(data);

            // Validate the data structure
            if (!parsedData.currentTasks || !Array.isArray(parsedData.currentTasks)) {
                throw new Error('Invalid data format: missing or invalid currentTasks');
            }

            if (!parsedData.archivedTasks || !Array.isArray(parsedData.archivedTasks)) {
                // If archivedTasks is missing, create an empty array
                parsedData.archivedTasks = [];
            }

            // Save the imported data
            await saveCurrentTasks(parsedData.currentTasks);
            await saveArchivedTasks(parsedData.archivedTasks);

            // Import settings if available
            if (parsedData.settings) {
                setSettings({
                    ...defaultSettings, // Start with defaults for any missing fields
                    ...parsedData.settings,
                    // Mark the last backup date as the import date
                    lastBackupDate: new Date().toISOString()
                });
            }

            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    };

    // Clear all tasks function
    const clearAllTasks = async (): Promise<boolean> => {
        try {
            // Clear both current and archived tasks
            await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_TASKS);
            await AsyncStorage.removeItem(STORAGE_KEYS.ARCHIVED_TASKS);
            return true;
        } catch (error) {
            console.error('Failed to clear tasks:', error);
            return false;
        }
    };

    // Get the last backup date
    const getLastBackupDate = (): string | null => {
        return settings.lastBackupDate;
    };

    return (
        <SettingsContext.Provider value={{
            settings,
            updateSetting,
            resetSettings,
            exportData,
            importData,
            clearAllTasks,
            archiveCompletedTasks,
            getCurrentTasks,
            getArchivedTasks,
            getLastBackupDate
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

// Hook to use the settings context
export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};