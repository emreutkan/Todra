import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import { STORAGE_KEYS } from "../constants/StorageKeys";

// Import Task type from types.ts to maintain consistency
import { Task } from "../types";
import { taskStorageService } from "../services/taskStorageService";

// Define the settings shape
type Settings = {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  confirmDeleteEnabled: boolean;
  autoArchiveEnabled: boolean;
  showCompletedTasks: boolean;
  lastBackupDate: string | null;
};

// Default settings
const defaultSettings: Settings = {
  notificationsEnabled: true,
  soundEnabled: true,
  confirmDeleteEnabled: true,
  autoArchiveEnabled: false,
  showCompletedTasks: false,
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

// Create the context
const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
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
        console.error("Failed to load settings:", error);
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
          await AsyncStorage.setItem(
            STORAGE_KEYS.SETTINGS,
            JSON.stringify(settings)
          );
        } catch (error) {
          console.error("Failed to save settings:", error);
        }
      };

      saveSettings();
    }
  }, [settings, isLoaded]);

  // Function to update a single setting
  const updateSetting = <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: value };

      // If autoArchiveEnabled is turned on, archive completed tasks
      if (key === "autoArchiveEnabled" && value === true) {
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
    return await taskStorageService.getActiveTasks();
  };

  // Get archived tasks
  const getArchivedTasks = async (): Promise<Task[]> => {
    return await taskStorageService.getArchivedTasks();
  };


  // Function to archive completed tasks
  const archiveCompletedTasks = async (): Promise<number> => {
    try {
      // Get current tasks
      const currentTasks = await getCurrentTasks();

      // Separate completed and active tasks
      const completedTasks = currentTasks.filter((task) => task.completed);
      const activeTasks = currentTasks.filter((task) => !task.completed);

      if (completedTasks.length === 0) {
        return 0; // No tasks to archive
      }

      // Mark tasks as archived and add archived timestamp
      const tasksToArchive = completedTasks.map((task) => ({
        ...task,
        archived: true,
        archivedAt: new Date().toISOString(),
      }));

      // Get existing archived tasks and append new ones
      const archivedTasks = await getArchivedTasks();
      const updatedArchivedTasks = [...archivedTasks, ...tasksToArchive];

      // Save both lists using the centralized service
      await taskStorageService.saveActiveTasks(activeTasks);
      await taskStorageService.saveArchivedTasks(updatedArchivedTasks);

      return completedTasks.length;
    } catch (error) {
      console.error("Failed to archive completed tasks:", error);
      return 0;
    }
  };
  // Export data function
  const exportData = async (): Promise<string> => {
    try {
      // Get all tasks from AsyncStorage
      const allTasks = (await AsyncStorage.getItem("@tasks")) || "[]";
      const allCategories = (await AsyncStorage.getItem("@categories")) || "[]";

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
          settings: settings,
        },
      };

      // Convert to string for export
      return JSON.stringify(exportObject, null, 2); // Pretty print with indentation
    } catch (error) {
      console.error("Failed to export data:", error);
      throw new Error("Failed to export data");
    }
  };

  // Import data function
  const importData = async (data: string): Promise<boolean> => {
    try {
      const parsedData = JSON.parse(data);

      // Validate the data structure
      if (!parsedData.currentTasks || !Array.isArray(parsedData.currentTasks)) {
        throw new Error("Invalid data format: missing or invalid currentTasks");
      }

      if (
        !parsedData.archivedTasks ||
        !Array.isArray(parsedData.archivedTasks)
      ) {
        // If archivedTasks is missing, create an empty array
        parsedData.archivedTasks = [];
      }

      // Save the imported data using centralized service
      await taskStorageService.saveActiveTasks(parsedData.currentTasks);
      await taskStorageService.saveArchivedTasks(parsedData.archivedTasks);

      // Import settings if available
      if (parsedData.settings) {
        setSettings({
          ...defaultSettings, // Start with defaults for any missing fields
          ...parsedData.settings,
          // Mark the last backup date as the import date
          lastBackupDate: new Date().toISOString(),
        });
      }

      return true;
    } catch (error) {
      console.error("Failed to import data:", error);
      return false;
    }
  };

  // Clear all tasks function
  const clearAllTasks = async (): Promise<boolean> => {
    return await taskStorageService.clearAllTasks();
  };

  // Get the last backup date
  const getLastBackupDate = (): string | null => {
    return settings.lastBackupDate;
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSetting,
        resetSettings,
        exportData,
        importData,
        clearAllTasks,
        archiveCompletedTasks,
        getCurrentTasks,
        getArchivedTasks,
        getLastBackupDate,
      }}>
      {children}
    </SettingsContext.Provider>
  );
};

// Hook to use the settings context
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
