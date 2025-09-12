import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants/StorageKeys";
import { Task } from "../types";
import { notificationService } from "./notificationService";

/**
 * Unified Task Storage Service
 * Combines functionality from both previous implementations
 */

// Helper function to schedule notifications for a task
const scheduleTaskNotifications = async (task: Task) => {
  try {
    if (!task.remindMe || !task.remindMe.enabled) {
      return;
    }

    // Check if notifications are enabled in settings
    const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (settingsJson) {
      const settings = JSON.parse(settingsJson);
      if (!settings.notificationsEnabled) {
        console.log(
          "Notifications disabled in settings, skipping notification scheduling"
        );
        return;
      }
    }

    const { remindMe } = task;
    const dueDateMs = task.dueDate;
    const title = `Task Reminder: ${task.title}`;
    const body = task.description || "Don't forget to complete this task!";

    console.log(
      `Scheduling notification for task: ${task.title} at ${new Date(
        dueDateMs
      ).toLocaleString()}`
    );

    if (remindMe.spamMode) {
      // Use spam mode - multiple notifications
      await notificationService.scheduleSpamPlan({
        dueDateMs,
        title,
        body,
      });
    } else if (remindMe.preset === "custom" && remindMe.customOffsetMs) {
      // Custom offset
      await notificationService.scheduleOffset({
        dueDateMs,
        offsetMs: remindMe.customOffsetMs,
        title,
        body,
      });
    } else if (remindMe.preset !== "none") {
      // Preset offset
      const offsetMs = getPresetOffsetMs(remindMe.preset);
      if (offsetMs) {
        await notificationService.scheduleOffset({
          dueDateMs,
          offsetMs,
          title,
          body,
        });
      }
    }
  } catch (error) {
    console.error("Failed to schedule notifications for task:", error);
  }
};

// Helper function to get offset in milliseconds for preset values
const getPresetOffsetMs = (preset: string): number | null => {
  switch (preset) {
    case "1h":
      return 60 * 60 * 1000; // 1 hour
    case "2h":
      return 2 * 60 * 60 * 1000; // 2 hours
    case "6h":
      return 6 * 60 * 60 * 1000; // 6 hours
    case "24h":
      return 24 * 60 * 60 * 1000; // 24 hours
    default:
      return null;
  }
};

export const taskStorageService = {
  // Get active tasks
  getActiveTasks: async (): Promise<Task[]> => {
    try {
      const tasksJson = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_TASKS);
      if (!tasksJson) {
        console.log("No active tasks found in storage, returning empty array");
        return [];
      }

      const tasks = JSON.parse(tasksJson) as Task[];

      // Migrate old task format to new format if needed
      const migratedTasks = tasks.map((task) => ({
        ...task,
        dueDate: task.dueDate || task.createdAt, // Add dueDate if missing
        category: task.category || "personal", // Add category if missing
        archived: task.archived || false, // Add archived flag if missing
      }));

      console.log(`Loaded ${migratedTasks.length} active tasks from storage`);
      return migratedTasks;
    } catch (error) {
      console.error("Failed to get active tasks:", error);
      return [];
    }
  },

  // Get archived tasks
  getArchivedTasks: async (): Promise<Task[]> => {
    try {
      const tasksJson = await AsyncStorage.getItem(STORAGE_KEYS.ARCHIVED_TASKS);
      if (!tasksJson) {
        console.log(
          "No archived tasks found in storage, returning empty array"
        );
        return [];
      }

      const tasks = JSON.parse(tasksJson) as Task[];
      console.log(`Loaded ${tasks.length} archived tasks from storage`);
      return tasks;
    } catch (error) {
      console.error("Failed to get archived tasks:", error);
      return [];
    }
  },

  // Save active tasks
  saveActiveTasks: async (tasks: Task[]): Promise<boolean> => {
    try {
      console.log("Saving active tasks:", JSON.stringify(tasks));
      await AsyncStorage.setItem(
        STORAGE_KEYS.ACTIVE_TASKS,
        JSON.stringify(tasks)
      );
      console.log("Active tasks saved successfully");
      return true;
    } catch (error) {
      console.error("Failed to save active tasks:", error);
      return false;
    }
  },

  // Save archived tasks
  saveArchivedTasks: async (tasks: Task[]): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.ARCHIVED_TASKS,
        JSON.stringify(tasks)
      );
      console.log("Archived tasks saved successfully");
      return true;
    } catch (error) {
      console.error("Failed to save archived tasks:", error);
      return false;
    }
  },

  // Add new task (always to active tasks)
  addTask: async (task: Task): Promise<boolean> => {
    try {
      // Ensure the task has all required fields
      const validatedTask = {
        ...task,
        dueDate: task.dueDate || task.createdAt,
        category: task.category || "personal",
        archived: false, // New tasks should never be archived
      };

      const tasks = await taskStorageService.getActiveTasks();
      tasks.push(validatedTask);
      const success = await taskStorageService.saveActiveTasks(tasks);

      // Schedule notifications if task was saved successfully
      if (success) {
        await scheduleTaskNotifications(validatedTask);
      }

      return success;
    } catch (error) {
      console.error("Failed to add task:", error);
      return false;
    }
  },

  // Update a task in either active or archived list
  updateTask: async (updatedTask: Task): Promise<boolean> => {
    try {
      // Original task comparison logic removed as it's not currently used

      // Check active tasks first
      let activeTasks = await taskStorageService.getActiveTasks();
      const activeIndex = activeTasks.findIndex(
        (task) => task.id === updatedTask.id
      );

      if (activeIndex !== -1) {
        // Store original task for comparison (currently unused)
        // Update in active tasks
        activeTasks[activeIndex] = updatedTask;
        const success = await taskStorageService.saveActiveTasks(activeTasks);

        // Schedule notifications if task was updated successfully and is not completed
        if (success && !updatedTask.completed) {
          await scheduleTaskNotifications(updatedTask);
        }

        return success;
      }

      // If not in active, check archived
      let archivedTasks = await taskStorageService.getArchivedTasks();
      const archivedIndex = archivedTasks.findIndex(
        (task) => task.id === updatedTask.id
      );

      if (archivedIndex !== -1) {
        // Store original task for comparison (currently unused)
        // Update in archived tasks
        archivedTasks[archivedIndex] = updatedTask;
        return await taskStorageService.saveArchivedTasks(archivedTasks);
      }

      return false;
    } catch (error) {
      console.error("Failed to update task:", error);
      return false;
    }
  },

  // Delete a task from either active or archived list
  deleteTask: async (taskId: string): Promise<boolean> => {
    try {
      // Try to delete from active tasks first
      let activeTasks = await taskStorageService.getActiveTasks();
      const activeTaskIndex = activeTasks.findIndex(
        (task) => task.id === taskId
      );

      if (activeTaskIndex !== -1) {
        activeTasks.splice(activeTaskIndex, 1);
        return await taskStorageService.saveActiveTasks(activeTasks);
      }

      // If not in active, try archived
      let archivedTasks = await taskStorageService.getArchivedTasks();
      const archivedTaskIndex = archivedTasks.findIndex(
        (task) => task.id === taskId
      );

      if (archivedTaskIndex !== -1) {
        archivedTasks.splice(archivedTaskIndex, 1);
        return await taskStorageService.saveArchivedTasks(archivedTasks);
      }

      return false;
    } catch (error) {
      console.error("Failed to delete task:", error);
      return false;
    }
  },

  // Archive a task
  archiveTask: async (taskId: string): Promise<boolean> => {
    try {
      // Get current active and archived tasks
      const activeTasks = await taskStorageService.getActiveTasks();
      const archivedTasks = await taskStorageService.getArchivedTasks();

      // Find the task to archive
      const taskIndex = activeTasks.findIndex((task) => task.id === taskId);
      if (taskIndex === -1) return false;

      // Move task from active to archived
      const [task] = activeTasks.splice(taskIndex, 1);
      archivedTasks.push({
        ...task,
        archived: true,
        archivedAt: new Date().toISOString(),
      });

      // Save both arrays
      await taskStorageService.saveActiveTasks(activeTasks);
      await taskStorageService.saveArchivedTasks(archivedTasks);

      return true;
    } catch (error) {
      console.error("Failed to archive task:", error);
      return false;
    }
  },

  // Unarchive a task (restore)
  unarchiveTask: async (taskId: string): Promise<boolean> => {
    try {
      // Get current active and archived tasks
      const activeTasks = await taskStorageService.getActiveTasks();
      const archivedTasks = await taskStorageService.getArchivedTasks();

      // Find the task to unarchive
      const taskIndex = archivedTasks.findIndex((task) => task.id === taskId);
      if (taskIndex === -1) return false;

      // Move task from archived to active
      const [task] = archivedTasks.splice(taskIndex, 1);
      // Remove the archivedAt property and set archived to false
      const { archivedAt, ...restTask } = task;
      activeTasks.push({
        ...restTask,
        archived: false,
      });

      // Save both arrays
      await taskStorageService.saveActiveTasks(activeTasks);
      await taskStorageService.saveArchivedTasks(archivedTasks);

      return true;
    } catch (error) {
      console.error("Failed to unarchive task:", error);
      return false;
    }
  },

  // Auto-archive completed tasks
  autoArchiveCompletedTasks: async (): Promise<number> => {
    try {
      const activeTasks = await taskStorageService.getActiveTasks();
      const archivedTasks = await taskStorageService.getArchivedTasks();

      // Find completed tasks
      const completedTasks = activeTasks.filter((task) => task.completed);
      const remainingTasks = activeTasks.filter((task) => !task.completed);

      // If there are no completed tasks, nothing to do
      if (completedTasks.length === 0) return 0;

      // Add archived timestamp to completed tasks
      const tasksToArchive = completedTasks.map((task) => ({
        ...task,
        archived: true,
        archivedAt: new Date().toISOString(),
      }));

      // Add to archived tasks
      archivedTasks.push(...tasksToArchive);

      // Save both lists
      await taskStorageService.saveActiveTasks(remainingTasks);
      await taskStorageService.saveArchivedTasks(archivedTasks);

      return completedTasks.length;
    } catch (error) {
      console.error("Failed to auto-archive tasks:", error);
      return 0;
    }
  },

  // Clear all tasks (both active and archived)
  clearAllTasks: async (): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_TASKS);
      await AsyncStorage.removeItem(STORAGE_KEYS.ARCHIVED_TASKS);
      console.log("All tasks cleared from storage");
      return true;
    } catch (error) {
      console.error("Failed to clear all tasks:", error);
      return false;
    }
  },

  // Clear only archived tasks
  clearArchivedTasks: async (): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ARCHIVED_TASKS);
      console.log("All archived tasks cleared from storage");
      return true;
    } catch (error) {
      console.error("Failed to clear archived tasks:", error);
      return false;
    }
  },

  // Get all tasks (both active and archived)
  getAllTasks: async (): Promise<{ active: Task[]; archived: Task[] }> => {
    try {
      const active = await taskStorageService.getActiveTasks();
      const archived = await taskStorageService.getArchivedTasks();
      return { active, archived };
    } catch (error) {
      console.error("Failed to get all tasks:", error);
      return { active: [], archived: [] };
    }
  },
};

// For backward compatibility, expose individual functions
export const getActiveTasks = taskStorageService.getActiveTasks;
export const getArchivedTasks = taskStorageService.getArchivedTasks;
export const saveActiveTasks = taskStorageService.saveActiveTasks;
export const saveArchivedTasks = taskStorageService.saveArchivedTasks;
export const addTask = taskStorageService.addTask;
export const updateTask = taskStorageService.updateTask;
export const deleteTask = taskStorageService.deleteTask;
export const archiveTask = taskStorageService.archiveTask;
export const unarchiveTask = taskStorageService.unarchiveTask;
export const autoArchiveCompletedTasks =
  taskStorageService.autoArchiveCompletedTasks;
export const clearAllTasks = taskStorageService.clearAllTasks;
export const clearArchivedTasks = taskStorageService.clearArchivedTasks;
export const getAllTasks = taskStorageService.getAllTasks;
