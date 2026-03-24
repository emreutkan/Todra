import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants/StorageKeys";
import { Habit, HabitCompletion } from "../types";

const migrateHabit = (raw: Habit): Habit => ({
  ...raw,
  intervalDays: raw.intervalDays ?? 1,
  intervalPhases: Array.isArray(raw.intervalPhases) ? raw.intervalPhases : [],
  dayPhases: Array.isArray(raw.dayPhases) ? raw.dayPhases : [],
  completions: Array.isArray(raw.completions) ? raw.completions : [],
  isArchived: raw.isArchived ?? false,
});

const saveHabits = async (habits: Habit[]): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
    return true;
  } catch (error) {
    console.error("Failed to save habits:", error);
    return false;
  }
};

export const habitStorageService = {
  getHabits: async (): Promise<Habit[]> => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.HABITS);
      if (!json) return [];
      const parsed = JSON.parse(json) as Habit[];
      return parsed.map(migrateHabit);
    } catch (error) {
      console.error("Failed to get habits:", error);
      return [];
    }
  },

  addHabit: async (habit: Habit): Promise<boolean> => {
    try {
      const habits = await habitStorageService.getHabits();
      habits.push(migrateHabit(habit));
      return saveHabits(habits);
    } catch (error) {
      console.error("Failed to add habit:", error);
      return false;
    }
  },

  updateHabit: async (updated: Habit): Promise<boolean> => {
    try {
      const habits = await habitStorageService.getHabits();
      const idx = habits.findIndex((h) => h.id === updated.id);
      if (idx === -1) return false;
      habits[idx] = migrateHabit(updated);
      return saveHabits(habits);
    } catch (error) {
      console.error("Failed to update habit:", error);
      return false;
    }
  },

  deleteHabit: async (habitId: string): Promise<boolean> => {
    try {
      const habits = await habitStorageService.getHabits();
      const next = habits.filter((h) => h.id !== habitId);
      if (next.length === habits.length) return false;
      return saveHabits(next);
    } catch (error) {
      console.error("Failed to delete habit:", error);
      return false;
    }
  },

  archiveHabit: async (habitId: string): Promise<boolean> => {
    try {
      const habits = await habitStorageService.getHabits();
      const idx = habits.findIndex((h) => h.id === habitId);
      if (idx === -1) return false;
      habits[idx] = {
        ...habits[idx],
        isArchived: true,
        archivedAt: new Date().toISOString(),
      };
      return saveHabits(habits);
    } catch (error) {
      console.error("Failed to archive habit:", error);
      return false;
    }
  },

  toggleCompletion: async (
    habitId: string,
    date: string,
    phaseName?: string
  ): Promise<boolean> => {
    try {
      const habits = await habitStorageService.getHabits();
      const idx = habits.findIndex((h) => h.id === habitId);
      if (idx === -1) return false;
      const habit = habits[idx];
      const existing = habit.completions.find((c) => c.date === date);
      let completions: HabitCompletion[];
      if (existing) {
        completions = habit.completions.filter((c) => c.date !== date);
      } else {
        const entry: HabitCompletion = {
          date,
          completedAt: Date.now(),
          ...(phaseName ? { phaseName } : {}),
        };
        completions = [...habit.completions, entry];
      }
      habits[idx] = { ...habit, completions };
      return saveHabits(habits);
    } catch (error) {
      console.error("Failed to toggle habit completion:", error);
      return false;
    }
  },
};
