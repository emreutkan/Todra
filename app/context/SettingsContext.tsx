import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import { STORAGE_KEYS } from "../constants/StorageKeys";

// Import Task type from types.ts to maintain consistency
import { categoryStorageService } from "../services/categoryStorageService";
import { taskStorageService } from "../services/taskStorageService";
import { Task } from "../types";

// Define the settings shape
type Settings = {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  confirmDeleteEnabled: boolean;
  autoArchiveEnabled: boolean;
  showCompletedTasks: boolean;
  darkModeEnabled: boolean;
  lastBackupDate: string | null;
};

// Default settings
const defaultSettings: Settings = {
  notificationsEnabled: true,
  soundEnabled: true,
  confirmDeleteEnabled: true,
  autoArchiveEnabled: false,
  showCompletedTasks: false,
  darkModeEnabled: false,
  lastBackupDate: null,
};

// Define the context type
type SettingsContextType = {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetSettings: () => void;
  exportData: () => Promise<string>;
  importData: (data: string, mode?: "merge" | "replace") => Promise<boolean>;
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
      // Fetch from centralized services to ensure correct keys and formats
      const currentTasks = await taskStorageService.getActiveTasks();
      const archivedTasks = await taskStorageService.getArchivedTasks();
      const categories = await categoryStorageService.loadCategories();

      const exportObject = {
        metadata: {
          version: "1.0.0",
          exportDate: new Date().toISOString(),
          platform: Platform.OS,
        },
        // Export in a flat, self-descriptive shape
        currentTasks,
        archivedTasks,
        categories,
        settings,
      };

      return JSON.stringify(exportObject, null, 2);
    } catch (error) {
      console.error("Failed to export data:", error);
      throw new Error("Failed to export data");
    }
  };

  // Import data function
  const importData = async (
    data: string,
    mode: "merge" | "replace" = "replace"
  ): Promise<boolean> => {
    try {
      const parsed = JSON.parse(data);

      // Accept multiple shapes: legacy { data: { tasks, archivedTasks, categories, settings } }
      // or new flat { currentTasks, archivedTasks, categories, settings }
      const inferred = (() => {
        if (parsed?.data) {
          return {
            currentTasks: parsed.data.tasks || parsed.data.currentTasks || [],
            archivedTasks: parsed.data.archivedTasks || [],
            categories: parsed.data.categories || [],
            settings: parsed.data.settings,
          };
        }
        return {
          currentTasks: parsed.currentTasks || [],
          archivedTasks: parsed.archivedTasks || [],
          categories: parsed.categories || [],
          settings: parsed.settings,
        };
      })();

      if (!Array.isArray(inferred.currentTasks)) {
        throw new Error("Invalid data format: currentTasks must be an array");
      }
      if (!Array.isArray(inferred.archivedTasks)) {
        throw new Error("Invalid data format: archivedTasks must be an array");
      }

      // Save tasks
      if (mode === "replace") {
        await taskStorageService.saveActiveTasks(inferred.currentTasks);
        await taskStorageService.saveArchivedTasks(inferred.archivedTasks);
      } else {
        // Merge and dedupe by id; incoming overrides existing
        const existingActive = await taskStorageService.getActiveTasks();
        const existingArchived = await taskStorageService.getArchivedTasks();

        const mergedById = <T extends { id: string }>(
          base: T[],
          incoming: T[]
        ) => {
          const map = new Map<string, T>();
          for (const item of base) map.set(item.id, item);
          for (const item of incoming) map.set(item.id, item);
          return Array.from(map.values());
        };

        const mergedActive = mergedById(existingActive, inferred.currentTasks);
        const mergedArchived = mergedById(
          existingArchived,
          inferred.archivedTasks
        );

        await taskStorageService.saveActiveTasks(mergedActive);
        await taskStorageService.saveArchivedTasks(mergedArchived);
      }

      // Save categories
      if (
        Array.isArray(inferred.categories) &&
        inferred.categories.length > 0
      ) {
        if (mode === "replace") {
          await categoryStorageService.saveCategories(inferred.categories);
        } else {
          const existingCategories =
            await categoryStorageService.loadCategories();
          const map = new Map<string, any>();
          for (const c of existingCategories) map.set(c.id, c);
          for (const c of inferred.categories) map.set(c.id, c);
          await categoryStorageService.saveCategories(Array.from(map.values()));
        }
      }

      // Save settings if present
      if (inferred.settings && typeof inferred.settings === "object") {
        setSettings({
          ...defaultSettings,
          ...(mode === "replace" ? {} : settings),
          ...inferred.settings,
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
