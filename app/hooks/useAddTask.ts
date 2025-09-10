import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { DEFAULT_CATEGORIES } from "../constants/CategoryConstants";
import {
  addTask,
  getActiveTasks,
  getArchivedTasks,
  updateTask as updateTaskService,
} from "../services/taskStorageService";
import {
  ReminderSettings,
  RepetitionRule,
  RootStackParamList,
  Task,
  TaskPriority,
} from "../types";

type AddTaskScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AddTask" | "EditTask"
>;
type AddTaskScreenRouteProp = RouteProp<
  RootStackParamList,
  "AddTask" | "EditTask"
>;

export const useAddTask = () => {
  const navigation = useNavigation<AddTaskScreenNavigationProp>();
  const route = useRoute<AddTaskScreenRouteProp>();

  // Check if we're editing an existing task
  const isEditing = route.name === "EditTask";
  const taskId = (route.params as any)?.taskId;
  const selectedDate = (route.params as any)?.selectedDate || new Date();

  // Set default time to 23:59
  const defaultDate = new Date(selectedDate);
  defaultDate.setHours(23, 59, 0, 0);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [dueDate, setDueDate] = useState<Date>(defaultDate);
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORIES[0].id);
  const [isFormValid, setIsFormValid] = useState(false);
  const [loading, setLoading] = useState(false);

  // Predecessor functionality
  const [predecessorIds, setPredecessorIds] = useState<string[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [originalTask, setOriginalTask] = useState<Task | null>(null);

  // Repetition functionality
  const [repetition, setRepetition] = useState<RepetitionRule>({
    enabled: false,
    type: "weekly",
    interval: 1,
    daysOfWeek: [],
  });

  // Reminder state
  const [remindMe, setRemindMe] = useState<ReminderSettings | undefined>({
    enabled: false,
    preset: "none",
    customOffsetMs: undefined,
    spamMode: false,
  });

  // Load available tasks for predecessor selection and existing task data if editing
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load available tasks for predecessor selection
        const tasks = await getActiveTasks();
        setAvailableTasks(tasks);

        // If editing, load the existing task data
        if (isEditing && taskId) {
          // Check active tasks first
          let existingTask = tasks.find((t) => t.id === taskId);

          // If not found in active tasks, check archived tasks
          if (!existingTask) {
            const archivedTasks = await getArchivedTasks();
            existingTask = archivedTasks.find((t) => t.id === taskId);
          }

          if (existingTask) {
            setOriginalTask(existingTask);
            setTitle(existingTask.title);
            setDescription(existingTask.description);
            setPriority(existingTask.priority);
            setDueDate(new Date(existingTask.dueDate));
            setCategory(existingTask.category);
            setPredecessorIds(existingTask.predecessorIds || []);
            setRemindMe(existingTask.remindMe);
          } else {
            Alert.alert("Error", "Task not found");
            navigation.goBack();
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        Alert.alert("Error", "Failed to load task data");
      }
    };
    loadData();
  }, [isEditing, taskId, navigation]);

  // Check form validity whenever title changes
  useEffect(() => {
    setIsFormValid(title.trim().length > 0);
  }, [title]);

  // Simple circular dependency check
  const hasCircularDependency = (taskIds: string[], tasks: Task[]): boolean => {
    const visited = new Set<string>();
    const check = (id: string): boolean => {
      if (visited.has(id)) return true;
      visited.add(id);
      const task = tasks.find((t) => t.id === id);
      return (
        task?.predecessorIds?.some(
          (predId) => taskIds.includes(predId) || check(predId)
        ) || false
      );
    };
    return taskIds.some(check);
  };

  const handleSave = useCallback(async () => {
    if (!isFormValid) {
      Alert.alert("Error", "Please enter a task title");
      return;
    }

    try {
      setLoading(true);

      // Load existing tasks
      const existingTasks = await getActiveTasks();

      // Check for circular dependencies
      if (hasCircularDependency(predecessorIds, existingTasks)) {
        Alert.alert(
          "Error",
          "Cannot add these predecessors as they would create a circular dependency"
        );
        return;
      }

      if (isEditing && taskId && originalTask) {
        // Update existing task
        const updatedTask: Task = {
          id: taskId,
          title: title.trim(),
          description: description.trim(),
          priority,
          completed: originalTask.completed, // Keep existing completion status
          createdAt: originalTask.createdAt, // Keep original creation date
          dueDate: dueDate.getTime(),
          category,
          predecessorIds,
          archived: originalTask.archived, // Keep existing archived status
          remindMe,
        };

        // Update task
        const success = await updateTaskService(updatedTask);
        if (success) {
          // Navigate back with success message
          navigation.navigate("Home", {
            showSuccessMessage: true,
            message: "Task updated successfully",
            timestamp: Date.now(),
          });
        } else {
          Alert.alert("Error", "Failed to update task");
        }
      } else {
        // Create new task
        const newTask: Task = {
          id: Date.now().toString(),
          title: title.trim(),
          description: description.trim(),
          priority,
          completed: false,
          createdAt: selectedDate.getTime(),
          dueDate: dueDate.getTime(),
          category,
          predecessorIds: repetition.enabled ? [] : predecessorIds, // No predecessors for recurring tasks
          archived: false,
          repetition: repetition.enabled ? repetition : undefined,
          isRecurring: repetition.enabled,
          remindMe,
        };

        // Save task
        const success = await addTask(newTask);
        if (success) {
          // Navigate back with success message
          navigation.navigate("Home", {
            showSuccessMessage: true,
            message: "Task added successfully",
            timestamp: Date.now(),
          });
        } else {
          Alert.alert("Error", "Failed to save task");
        }
      }
    } catch (error) {
      console.error("Error saving task:", error);
      Alert.alert(
        "Error Saving Task",
        "Failed to save task. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [
    title,
    description,
    priority,
    dueDate,
    category,
    predecessorIds,
    repetition,
    isFormValid,
    navigation,
    selectedDate,
    isEditing,
    taskId,
    originalTask,
  ]);

  const handleCancel = useCallback(() => {
    if (title.trim() || description.trim() || predecessorIds.length > 0) {
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to discard them?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [title, description, predecessorIds, navigation]);

  const handlePredecessorSelect = useCallback((taskId: string) => {
    setPredecessorIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  }, []);

  const updateTask = useCallback(
    async (taskData: Partial<Task>) => {
      if (!originalTask) {
        throw new Error("Cannot update task: missing original task data");
      }

      try {
        setLoading(true);

        // Load existing tasks
        const existingTasks = await getActiveTasks();

        // Check for circular dependencies
        if (hasCircularDependency(predecessorIds, existingTasks)) {
          Alert.alert(
            "Error",
            "Cannot add these predecessors as they would create a circular dependency"
          );
          return false;
        }

        const updatedTask: Task = {
          ...originalTask,
          ...taskData,
          id: taskId,
          title: taskData.title || title,
          description: taskData.description || description,
          priority: taskData.priority || priority,
          dueDate: taskData.dueDate || dueDate.getTime(),
          category: taskData.category || category,
          predecessorIds: taskData.predecessorIds || predecessorIds,
          remindMe: taskData.remindMe || remindMe,
        };

        const success = await updateTaskService(updatedTask);
        if (success) {
          // Update local state
          setTitle(updatedTask.title);
          setDescription(updatedTask.description);
          setPriority(updatedTask.priority);
          setDueDate(new Date(updatedTask.dueDate));
          setCategory(updatedTask.category);
          setPredecessorIds(updatedTask.predecessorIds || []);
          setRemindMe(updatedTask.remindMe);
          setOriginalTask(updatedTask);
        }

        return success;
      } catch (error) {
        console.error("Error updating task:", error);
        Alert.alert("Error", "Failed to update task");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [
      originalTask,
      title,
      description,
      priority,
      dueDate,
      category,
      predecessorIds,
      remindMe,
    ]
  );

  return {
    // Form state
    title,
    setTitle,
    description,
    setDescription,
    priority,
    setPriority,
    dueDate,
    setDueDate,
    category,
    setCategory,
    isFormValid,
    loading,

    // Predecessor state
    predecessorIds,
    setPredecessorIds,
    availableTasks,

    // Repetition state
    repetition,
    setRepetition,

    // Reminder state
    remindMe,
    setRemindMe,

    // Actions
    handleSave,
    handleCancel,
    handlePredecessorSelect,
    updateTask,

    // Meta
    isEditing,
  };
};
