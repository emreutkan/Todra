import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { useTheme } from "../context/ThemeContext";
import { SIZES } from "../theme";
import { RootStackParamList, Task, TaskPriority } from "../types";

// Component imports
import ActionFooter from "../components/AddTaskComponents/ActionFooter";
import CategorySelector from "../components/AddTaskComponents/CategorySelector";
import DateTimePicker from "../components/AddTaskComponents/DateTimePicker";
import PredecessorTaskSelector from "../components/AddTaskComponents/PredecessorTaskSelector";
import PrioritySelector from "../components/AddTaskComponents/PrioritySelector";
import TaskDescription from "../components/AddTaskComponents/TaskDescription";
import TaskTitleInput from "../components/AddTaskComponents/TaskTitleInput";
import ScreenHeader from "../components/common/ScreenHeader";
import {
  addTask,
  getActiveTasks,
  getArchivedTasks,
  updateTask,
} from "../services/taskStorageService";

type AddTaskScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AddTask" | "EditTask"
>;
type AddTaskScreenRouteProp = RouteProp<
  RootStackParamList,
  "AddTask" | "EditTask"
>;

const AddTaskScreen: React.FC = () => {
  const navigation = useNavigation<AddTaskScreenNavigationProp>();
  const route = useRoute<AddTaskScreenRouteProp>();

  // Check if we're editing an existing task
  const isEditing = route.name === "EditTask";
  const taskId = route.params?.taskId;

  // Get the selected date from navigation params or default to today
  const selectedDate = route.params?.selectedDate || new Date();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [dueDate, setDueDate] = useState<Date>(selectedDate);
  const [category, setCategory] = useState<string>("personal");
  const [isFormValid, setIsFormValid] = useState(false);
  const [loading, setLoading] = useState(false);

  // New state for predecessor functionality
  const [predecessorIds, setPredecessorIds] = useState<string[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [originalTask, setOriginalTask] = useState<Task | null>(null);

  const { colors } = useTheme();
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: SIZES.medium,
      paddingBottom: SIZES.extraLarge * 2,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
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

  // Function to check for circular dependencies
  const checkForCircularDependencies = (
    taskIds: string[],
    currentId: string,
    visited: Set<string>,
    tasks: Task[]
  ): boolean => {
    if (visited.has(currentId)) return true;
    visited.add(currentId);

    const task = tasks.find((t) => t.id === currentId);
    if (!task) return false;

    for (const predId of task.predecessorIds || []) {
      if (
        taskIds.includes(predId) ||
        checkForCircularDependencies(taskIds, predId, visited, tasks)
      ) {
        return true;
      }
    }
    return false;
  };

  // Update handleSave:
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
      for (const predId of predecessorIds) {
        if (
          checkForCircularDependencies(
            predecessorIds,
            predId,
            new Set(),
            existingTasks
          )
        ) {
          Alert.alert(
            "Error",
            "Cannot add these predecessors as they would create a circular dependency"
          );
          return;
        }
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
        };

        // Update task
        const success = await updateTask(updatedTask);
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
          predecessorIds,
          archived: false,
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      // keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <StatusBar style="dark" />
      <ScreenHeader
        title={isEditing ? "Edit Task" : "Create New Task"}
        showBackButton
        onBackPress={handleCancel}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <TaskTitleInput value={title} onChangeText={setTitle} />

        <CategorySelector
          selectedCategory={category}
          onSelectCategory={setCategory}
        />

        <PrioritySelector
          selectedPriority={priority}
          onSelectPriority={setPriority}
        />

        <DateTimePicker
          dueDate={dueDate}
          onDateChange={setDueDate}
          initialDate={selectedDate}
        />

        <PredecessorTaskSelector
          availableTasks={availableTasks}
          selectedPredecessors={predecessorIds}
          onSelectPredecessor={(taskId) => {
            setPredecessorIds((prev) =>
              prev.includes(taskId)
                ? prev.filter((id) => id !== taskId)
                : [...prev, taskId]
            );
          }}
        />

        <TaskDescription value={description} onChangeText={setDescription} />
      </ScrollView>

      <ActionFooter
        onCancel={handleCancel}
        onSave={handleSave}
        saveEnabled={isFormValid}
      />
    </KeyboardAvoidingView>
  );
};

export default AddTaskScreen;
