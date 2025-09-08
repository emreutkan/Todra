import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import {
  deleteTask,
  getActiveTasks,
  getArchivedTasks,
  updateTask,
} from "../services/taskStorageService";
import { RootStackParamList, Task } from "../types";

type TaskDetailsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "TaskDetails"
>;

export const useTaskDetails = (taskId: string) => {
  const navigation = useNavigation<TaskDetailsNavigationProp>();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedTasks, setRelatedTasks] = useState<Task[]>([]);

  const loadTask = useCallback(async () => {
    try {
      // First check active tasks
      const activeTasks = await getActiveTasks();
      let foundTask = activeTasks.find((t) => t.id === taskId);

      // If not found, check archived tasks
      if (!foundTask) {
        const archivedTasks = await getArchivedTasks();
        foundTask = archivedTasks.find((t) => t.id === taskId);
      }

      if (foundTask) {
        setTask(foundTask);

        // Load related tasks (predecessors)
        if (foundTask.predecessorIds && foundTask.predecessorIds.length > 0) {
          const allTasks = [...activeTasks, ...(await getArchivedTasks())];
          const related = allTasks.filter((t) =>
            foundTask?.predecessorIds?.includes(t.id)
          );
          setRelatedTasks(related);
        }
      } else {
        Alert.alert("Error", "Task not found");
        navigation.goBack();
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading task:", error);
      setLoading(false);
      Alert.alert("Error", "Failed to load task details");
      navigation.goBack();
    }
  }, [taskId, navigation]);

  const handleToggleComplete = useCallback(async () => {
    if (!task) return;

    // Check for prerequisites
    if (
      !task.completed &&
      task.predecessorIds &&
      task.predecessorIds.length > 0
    ) {
      const incompletePrereqs = relatedTasks.filter(
        (t) => !t.completed && task.predecessorIds?.includes(t.id)
      );

      if (incompletePrereqs.length > 0) {
        // Show error with specific prereq information
        const prereqNames = incompletePrereqs
          .map((task) => `• ${task.title}`)
          .join("\n");

        Alert.alert(
          "Prerequisites Required",
          `You need to complete these tasks first:\n\n${prereqNames}`,
          [
            {
              text: "View First Task",
              onPress: () =>
                incompletePrereqs[0] &&
                navigation.navigate("TaskDetails", {
                  taskId: incompletePrereqs[0].id,
                }),
            },
            { text: "OK" },
          ]
        );
        return;
      }
    }

    try {
      const updatedTask = { ...task, completed: !task.completed };
      await updateTask(updatedTask);
      setTask(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      Alert.alert("Error", "Failed to update task");
    }
  }, [task, relatedTasks, navigation]);

  const handleEdit = useCallback(() => {
    navigation.navigate("EditTask", { taskId });
  }, [navigation, taskId]);

  const handleDelete = useCallback(async () => {
    Alert.alert(
      "Delete Task",
      "Are you sure you want to delete this task? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTask(taskId);
              navigation.navigate("Home");
            } catch (error) {
              console.error("Error deleting task:", error);
              Alert.alert("Error", "Failed to delete task");
            }
          },
        },
      ]
    );
  }, [taskId, navigation]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  return {
    task,
    loading,
    relatedTasks,
    handleToggleComplete,
    handleEdit,
    handleDelete,
    reloadTask: loadTask,
  };
};

