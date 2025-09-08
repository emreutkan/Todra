import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { useSettings } from "../context/SettingsContext";
import { Task } from "../types";
import { RootStackParamList } from "../types";

type AllTasksNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AllTasks"
>;

export type TaskCategory = "current" | "archived";

export const useAllTasks = () => {
  const navigation = useNavigation<AllTasksNavigationProp>();
  const { getCurrentTasks, getArchivedTasks, archiveCompletedTasks } =
    useSettings();

  const [isLoading, setIsLoading] = useState(true);
  const [currentTasks, setCurrentTasks] = useState<Task[]>([]);
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<TaskCategory>("current");

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const current = await getCurrentTasks();
      const archived = await getArchivedTasks();

      console.log("Current tasks:", current);
      console.log("Archived tasks:", archived);

      setCurrentTasks(current);
      setArchivedTasks(archived);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      Alert.alert("Error", "Failed to load tasks. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentTasks, getArchivedTasks]);

  const handleArchiveAllCompleted = useCallback(async () => {
    try {
      const count = await archiveCompletedTasks();
      if (count > 0) {
        Alert.alert(
          "Success",
          `${count} completed task${count !== 1 ? "s" : ""} archived.`
        );
        fetchTasks(); // Refresh the lists
      } else {
        Alert.alert("No Tasks", "There are no completed tasks to archive.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to archive tasks. Please try again.");
    }
  }, [archiveCompletedTasks, fetchTasks]);

  const handleTaskPress = useCallback(
    (task: Task) => {
      navigation.navigate("TaskDetails", { taskId: task.id });
    },
    [navigation]
  );

  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    isLoading,
    currentTasks,
    archivedTasks,
    selectedCategory,
    setSelectedCategory,
    handleArchiveAllCompleted,
    handleTaskPress,
    handleBackPress,
    refreshTasks: fetchTasks,
  };
};
