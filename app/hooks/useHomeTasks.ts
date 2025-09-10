import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import {
  deleteTask,
  getActiveTasks,
  updateTask,
} from "../services/taskStorageService";
import { RootStackParamList, Task } from "../types";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

export const useHomeTasks = (selectedDate?: Date) => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter tasks based on selected date
  const tasks = useMemo(() => {
    if (!selectedDate) return allTasks;

    const selectedDateStart = new Date(selectedDate);
    selectedDateStart.setHours(0, 0, 0, 0);

    const selectedDateEnd = new Date(selectedDate);
    selectedDateEnd.setHours(23, 59, 59, 999);

    return allTasks.filter((task) => {
      const taskDate = new Date(task.dueDate);
      return taskDate >= selectedDateStart && taskDate <= selectedDateEnd;
    });
  }, [allTasks, selectedDate]);

  const loadTasks = useCallback(async () => {
    setRefreshing(true);
    try {
      const activeTasks = await getActiveTasks();
      setAllTasks(activeTasks);
      return activeTasks;
    } catch (error) {
      console.error("Error loading tasks:", error);
      Alert.alert("Error", "Failed to load tasks");
      return [];
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  const handleToggleTaskCompletion = useCallback(
    async (taskId: string) => {
      try {
        const task = allTasks.find((t) => t.id === taskId);
        if (!task) return;

        const updatedTask = { ...task, completed: !task.completed };
        await updateTask(updatedTask);

        setAllTasks((prev) =>
          prev.map((t) => (t.id === taskId ? updatedTask : t))
        );
      } catch (error) {
        console.error("Error toggling task completion:", error);
        Alert.alert("Error", "Failed to update task");
      }
    },
    [allTasks]
  );

  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setAllTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
      Alert.alert("Error", "Failed to delete task");
    }
  }, []);

  const handleTaskPress = useCallback(
    (taskId: string) => {
      navigation.navigate("TaskDetails", { taskId });
    },
    [navigation]
  );

  const handleAddTask = useCallback(() => {
    navigation.navigate("AddTask", { selectedDate });
  }, [navigation, selectedDate]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return {
    tasks,
    loading,
    refreshing,
    loadTasks,
    handleToggleTaskCompletion,
    handleDeleteTask,
    handleTaskPress,
    handleAddTask,
  };
};
