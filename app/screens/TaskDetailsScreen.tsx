import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BlurView } from "expo-blur";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../context/ThemeContext";
import { useAddTask } from "../hooks/useAddTask";
import {
  deleteTask,
  getActiveTasks,
  getArchivedTasks,
  updateTask as updateTaskService,
} from "../services/taskStorageService";
import { SIZES } from "../theme";
import { RootStackParamList, Task } from "../types";

// Import AddTaskScreen components for edit mode
import ActionFooter from "../components/AddTaskComponents/ActionFooter";
import CategorySelector from "../components/AddTaskComponents/CategorySelector";
import DateTimePicker from "../components/AddTaskComponents/DateTimePicker";
import PredecessorTaskSelector from "../components/AddTaskComponents/PredecessorTaskSelector";
import PrioritySelector from "../components/AddTaskComponents/PrioritySelector";
import RepetitionSelector from "../components/AddTaskComponents/RepetitionSelector";
import TaskDescription from "../components/AddTaskComponents/TaskDescription";
import TaskTitleInput from "../components/AddTaskComponents/TaskTitleInput";
import RemindMeButton from "../components/common/RemindMeButton";
import ScreenHeader from "../components/common/ScreenHeader";

type TaskDetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "TaskDetails"
>;
type TaskDetailsScreenRouteProp = RouteProp<RootStackParamList, "TaskDetails">;

// Animated Button Component (matching HomeScreen style)
const AnimatedActionButton = ({
  onPress,
  iconName,
  iconColor,
  backgroundColor,
  borderColor,
  label,
}: {
  onPress: () => void;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  backgroundColor: string;
  borderColor?: string;
  label: string;
}) => {
  const pressAnim = useRef(new Animated.Value(1)).current;
  const sizeAnim = useRef(new Animated.Value(56)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(pressAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(sizeAnim, {
        toValue: 67, // 56 * 1.2 = 67
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(pressAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(sizeAnim, {
        toValue: 56,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={[
        styles.fab,
        {
          backgroundColor,
          borderColor,
          borderWidth: borderColor ? 1 : 0,
          width: sizeAnim,
          height: sizeAnim,
          borderRadius: Animated.divide(sizeAnim, 2),
        },
        styles.shadow,
        { transform: [{ scale: pressAnim }] },
      ]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={label}
        accessibilityRole="button"
        style={styles.touchable}>
        <Ionicons name={iconName} size={22} color={iconColor} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Special AddButton-style component for Mark Complete (larger size like AddButton)
const AnimatedAddStyleButton = ({
  onPress,
  iconName,
  iconColor,
  backgroundColor,
  label,
}: {
  onPress: () => void;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  backgroundColor: string;
  label: string;
}) => {
  const pressAnim = useRef(new Animated.Value(1)).current;
  const sizeAnim = useRef(new Animated.Value(70)).current; // Base width for AddButton
  const heightAnim = useRef(new Animated.Value(56)).current; // Base height for AddButton

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(pressAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(sizeAnim, {
        toValue: 84, // 70 * 1.2 = 84
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(heightAnim, {
        toValue: 67, // 56 * 1.2 = 67
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(pressAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(sizeAnim, {
        toValue: 70,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(heightAnim, {
        toValue: 56,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={[
        styles.addStyleFab,
        {
          backgroundColor,
          width: sizeAnim,
          height: heightAnim,
          borderRadius: Animated.divide(heightAnim, 2),
        },
        styles.addStyleShadow,
        { transform: [{ scale: pressAnim }] },
      ]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={label}
        accessibilityRole="button"
        style={styles.touchable}>
        <Ionicons name={iconName} size={24} color={iconColor} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const TaskDetailsScreen = () => {
  const navigation = useNavigation<TaskDetailsScreenNavigationProp>();
  const route = useRoute<TaskDetailsScreenRouteProp>();
  const { taskId } = route.params;
  const { colors, isDark } = useTheme();
  const bottomInsets = useSafeAreaInsets();

  const [task, setTask] = useState<Task | null>(null);
  const [relatedTasks, setRelatedTasks] = useState<Task[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  // Refs for scrolling to sections
  const scrollViewRef = useRef<ScrollView>(null);

  // Initialize useAddTask hook for edit mode
  const {
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
    handlePredecessorSelect,
  } = useAddTask();

  useEffect(() => {
    loadTask();
  }, [taskId]);

  // Animate elements when task loads
  useEffect(() => {
    if (task && !isAnimating) {
      setIsAnimating(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          setIsAnimating(false);
        }, 0);
      });
    }
  }, [task, fadeAnim, isAnimating]);

  // Load task data into form when entering edit mode
  useEffect(() => {
    if (isEditMode && task) {
      setTitle(task.title);
      setDescription(task.description);
      setPriority(task.priority);
      setDueDate(new Date(task.dueDate));
      setCategory(task.category);
      setPredecessorIds(task.predecessorIds || []);
      setRemindMe(task.remindMe);
      if (task.repetition) {
        setRepetition(task.repetition);
      }
    }
  }, [
    isEditMode,
    task,
    setTitle,
    setDescription,
    setPriority,
    setDueDate,
    setCategory,
    setPredecessorIds,
    setRemindMe,
    setRepetition,
  ]);

  const isOverdue = (dueDate: number) => {
    return !task?.completed && dueDate < Date.now();
  };

  const loadTask = async () => {
    try {
      setIsLoading(true);
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
    } catch (error) {
      Alert.alert("Error", "Failed to load task details");
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async () => {
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
      await updateTaskService(updatedTask);
      setTask(updatedTask);

      // Provide visual feedback with a separate animation value
      const feedbackAnim = new Animated.Value(1);
      Animated.sequence([
        Animated.timing(feedbackAnim, {
          toValue: 0.7,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(feedbackAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error("Error updating task:", error);
      Alert.alert("Error", "Failed to update task");
    }
  };

  const handleDelete = async () => {
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
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const handleSaveEdit = async () => {
    if (!task) return;

    try {
      const updatedTaskData = {
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate.getTime(),
        category,
        predecessorIds,
        remindMe,
      };

      // Create the complete updated task
      const updatedTask: Task = {
        ...task,
        ...updatedTaskData,
      };

      // Save to storage
      const success = await updateTaskService(updatedTask);
      if (success) {
        // Update the task state with the new data
        setTask(updatedTask);
        setIsEditMode(false);
      } else {
        Alert.alert("Error", "Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      Alert.alert("Error", "Failed to update task");
    }
  };

  const renderPrerequisites = () => {
    if (!task?.predecessorIds || task.predecessorIds.length === 0) {
      return null;
    }

    return (
      <View style={styles.prerequisitesSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Prerequisites
        </Text>
        <View style={styles.prerequisitesContainer}>
          {relatedTasks.map((prereqTask) => (
            <TouchableOpacity
              key={prereqTask.id}
              style={[
                styles.prerequisiteItem,
                {
                  borderColor: prereqTask.completed
                    ? colors.success
                    : colors.warning,
                  backgroundColor: colors.card,
                },
              ]}
              onPress={() =>
                navigation.push("TaskDetails", { taskId: prereqTask.id })
              }
              activeOpacity={0.7}>
              <View style={styles.prerequisiteContent}>
                <View
                  style={[
                    styles.prerequisiteStatus,
                    {
                      backgroundColor: prereqTask.completed
                        ? colors.success
                        : colors.warning + "40",
                    },
                  ]}>
                  <Ionicons
                    name={prereqTask.completed ? "checkmark" : "time-outline"}
                    size={14}
                    color={prereqTask.completed ? "white" : colors.warning}
                  />
                </View>
                <View>
                  <Text
                    style={[
                      styles.prerequisiteTitle,
                      {
                        color: colors.text,
                        textDecorationLine: prereqTask.completed
                          ? "line-through"
                          : "none",
                      },
                    ]}
                    numberOfLines={1}>
                    {prereqTask.title}
                  </Text>
                  <Text style={[{ color: colors.textSecondary }]}>
                    {prereqTask.completed ? "Completed" : "Pending"}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      full: `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`,
    };
  };

  const formatReminderText = (remindMe: any) => {
    if (!remindMe || !remindMe.enabled) return "No reminder";

    if (remindMe.preset === "custom" && remindMe.customOffsetMs) {
      const hours = Math.floor(remindMe.customOffsetMs / (1000 * 60 * 60));
      const minutes = Math.floor(
        (remindMe.customOffsetMs % (1000 * 60 * 60)) / (1000 * 60)
      );

      if (hours > 0) {
        return `${hours}h ${minutes}m before due`;
      } else {
        return `${minutes}m before due`;
      }
    }

    return remindMe.preset === "none" ? "Custom reminder" : remindMe.preset;
  };

  const formatRepetitionText = (repetition: any) => {
    if (!repetition || !repetition.enabled) return "No repetition";

    const intervalText =
      repetition.interval === 1 ? "" : `every ${repetition.interval} `;
    const typeText =
      repetition.type === "weekly"
        ? "week(s)"
        : repetition.type === "monthly"
        ? "month(s)"
        : "day(s)";

    return `${intervalText}${repetition.type}${
      repetition.interval > 1 ? ` (${typeText})` : ""
    }`;
  };

  const renderStaticTaskDetails = () => {
    if (!task) return null;

    const createdDateTime = formatDateTime(task.createdAt);
    const dueDateTime = formatDateTime(task.dueDate);
    const archivedDateTime = task.archivedAt
      ? formatDateTime(new Date(task.archivedAt).getTime())
      : null;

    return (
      <Animated.View
        style={[
          styles.mainCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}>
        {/* Status Row */}
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusIndicator,
              {
                backgroundColor: task.completed
                  ? colors.success
                  : isOverdue(task.dueDate)
                  ? colors.error
                  : colors.warning,
              },
            ]}>
            <Ionicons
              name={
                task.completed
                  ? "checkmark"
                  : isOverdue(task.dueDate)
                  ? "alert"
                  : "time"
              }
              size={16}
              color="white"
            />
          </View>
          <Text
            style={[
              styles.statusText,
              {
                color: task.completed
                  ? colors.success
                  : isOverdue(task.dueDate)
                  ? colors.error
                  : colors.warning,
              },
            ]}>
            {task.completed
              ? "Completed"
              : isOverdue(task.dueDate)
              ? "Overdue"
              : "In Progress"}
          </Text>
          {task.archived && (
            <View
              style={[
                styles.archivedBadge,
                { backgroundColor: colors.textSecondary },
              ]}>
              <Ionicons name="archive" size={12} color="white" />
              <Text style={styles.archivedText}>Archived</Text>
            </View>
          )}
        </View>

        {/* Task Title */}
        <View style={styles.staticField}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Title
          </Text>
          <Text style={[styles.fieldValue, { color: colors.text }]}>
            {task.title}
          </Text>
        </View>

        {/* Description */}
        {task.description && (
          <View style={styles.staticField}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Description
            </Text>
            <Text style={[styles.fieldValue, { color: colors.text }]}>
              {task.description}
            </Text>
          </View>
        )}

        {/* Category */}
        <View style={styles.staticField}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Category
          </Text>
          <View style={styles.categoryRow}>
            <Text style={[styles.fieldValue, { color: colors.text }]}>
              {task.category}
            </Text>
          </View>
        </View>

        {/* Priority */}
        <View style={styles.staticField}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Priority
          </Text>
          <View
            style={[
              styles.priorityBadge,
              {
                backgroundColor:
                  task.priority === "high"
                    ? colors.error
                    : task.priority === "low"
                    ? colors.success
                    : colors.warning,
              },
            ]}>
            <Text style={styles.priorityText}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Text>
          </View>
        </View>

        {/* Due Date */}
        <View style={styles.staticField}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Due Date
          </Text>
          <Text style={[styles.fieldValue, { color: colors.text }]}>
            {dueDateTime.full}
          </Text>
        </View>

        {/* Created Date */}
        <View style={styles.staticField}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Created
          </Text>
          <Text style={[styles.fieldValue, { color: colors.text }]}>
            {createdDateTime.full}
          </Text>
        </View>

        {/* Archived Date */}
        {task.archived && archivedDateTime && (
          <View style={styles.staticField}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Archived
            </Text>
            <Text style={[styles.fieldValue, { color: colors.text }]}>
              {archivedDateTime.full}
            </Text>
          </View>
        )}

        {/* Reminder */}
        <View style={styles.staticField}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Reminder
          </Text>
          <Text style={[styles.fieldValue, { color: colors.text }]}>
            {formatReminderText(task.remindMe)}
          </Text>
        </View>

        {/* Repetition */}
        <View style={styles.staticField}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Repetition
          </Text>
          <Text style={[styles.fieldValue, { color: colors.text }]}>
            {formatRepetitionText(task.repetition)}
          </Text>
        </View>

        {/* Recurring Task Info */}
        {task.isRecurring && (
          <View style={styles.staticField}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Recurring Task
            </Text>
            <View style={styles.recurringInfo}>
              <Ionicons name="repeat" size={16} color={colors.primary} />
              <Text
                style={[
                  styles.fieldValue,
                  { color: colors.text, marginLeft: 8 },
                ]}>
                {task.parentTaskId
                  ? "Generated from recurring task"
                  : "Original recurring task"}
              </Text>
            </View>
          </View>
        )}

        {/* Task ID (for debugging/admin purposes) */}
        <View style={styles.staticField}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Task ID
          </Text>
          <Text
            style={[
              styles.fieldValue,
              { color: colors.textSecondary, fontSize: 12 },
            ]}>
            {task.id}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderEditMode = () => {
    return (
      <Animated.ScrollView
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

        <DateTimePicker dueDate={dueDate} onDateChange={setDueDate} />

        {/* Remind me under due date/time */}
        <View style={{ marginTop: 12 }}>
          <RemindMeButton
            value={remindMe}
            onChange={setRemindMe}
            maxOffsetMs={Math.max(dueDate.getTime() - Date.now(), 0)}
          />
        </View>

        <RepetitionSelector
          repetition={repetition}
          onRepetitionChange={(newRepetition) => setRepetition(newRepetition)}
        />

        {!repetition.enabled && (
          <PredecessorTaskSelector
            availableTasks={availableTasks}
            selectedPredecessors={predecessorIds}
            onSelectPredecessor={handlePredecessorSelect}
          />
        )}

        <TaskDescription value={description} onChangeText={setDescription} />
      </Animated.ScrollView>
    );
  };

  if (isLoading) {
    return (
      <View
        style={[styles.mainContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <ScreenHeader
          title="Task Details"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading task details...
          </Text>
        </View>
      </View>
    );
  }

  if (!task) {
    return (
      <View
        style={[styles.mainContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <ScreenHeader
          title="Task Details"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={colors.error}
          />
          <Text
            style={[styles.loadingText, { color: colors.text, marginTop: 16 }]}>
            Task not found
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScreenHeader
        title={isEditMode ? "Edit Task" : "Task Details"}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      {isEditMode ? (
        renderEditMode()
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          ref={scrollViewRef}>
          {renderStaticTaskDetails()}

          {/* Prerequisites */}
          {task?.predecessorIds && task.predecessorIds.length > 0 && (
            <Animated.View style={{ opacity: fadeAnim }}>
              {renderPrerequisites()}
            </Animated.View>
          )}
        </ScrollView>
      )}

      {/* Action Footer */}
      {isEditMode ? (
        <ActionFooter
          onCancel={handleCancelEdit}
          onSave={handleSaveEdit}
          saveEnabled={isFormValid}
        />
      ) : (
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
          <View style={[styles.wrapper, { marginBottom: bottomInsets.bottom }]}>
            <BlurView
              style={styles.container}
              intensity={100}
              tint="systemUltraThinMaterialLight">
              <AnimatedActionButton
                onPress={handleDelete}
                iconName="trash-outline"
                iconColor={colors.error}
                backgroundColor={colors.card}
                borderColor={colors.border}
                label="Delete Task"
              />
              <AnimatedAddStyleButton
                onPress={handleToggleComplete}
                iconName={task.completed ? "close-circle" : "checkmark-circle"}
                iconColor="white"
                backgroundColor={colors.success}
                label={task.completed ? "Mark Incomplete" : "Mark Complete"}
              />
              <AnimatedActionButton
                onPress={handleEdit}
                iconName="create-outline"
                iconColor="white"
                backgroundColor={colors.primary}
                label="Edit Task"
              />
            </BlurView>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.medium,
    paddingBottom: 120, // Add extra padding to prevent content from being hidden behind floating buttons
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: SIZES.medium,
    marginTop: SIZES.medium,
  },

  // Main Card
  mainCard: {
    padding: SIZES.medium,
    paddingTop: 120, // Add more top padding for better spacing after header slides up
    paddingBottom: SIZES.extraLarge * 2,
    borderRadius: 16,
    marginBottom: SIZES.medium,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  // Status
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SIZES.large,
    paddingVertical: SIZES.medium,
    paddingHorizontal: SIZES.medium,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.03)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  statusIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SIZES.small,
  },
  statusText: {
    fontSize: SIZES.font + 1,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Static Fields
  staticField: {
    marginBottom: SIZES.medium,
    paddingVertical: SIZES.small,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  fieldLabel: {
    fontSize: SIZES.font - 1,
    fontWeight: "600",
    marginBottom: SIZES.small,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  fieldValue: {
    fontSize: SIZES.font + 1,
    lineHeight: 24,
    letterSpacing: 0.2,
    fontWeight: "500",
  },

  // Priority Badge
  priorityBadge: {
    paddingHorizontal: SIZES.medium,
    paddingVertical: SIZES.small,
    borderRadius: 20,
    alignSelf: "flex-start",
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  priorityText: {
    color: "white",
    fontSize: SIZES.font,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Archived Badge
  archivedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.small,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: SIZES.small,
  },
  archivedText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },

  // Category Row
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  // Recurring Info
  recurringInfo: {
    flexDirection: "row",
    alignItems: "center",
  },

  // Section Title
  sectionTitle: {
    fontSize: SIZES.medium,
    fontWeight: "600",
    marginBottom: SIZES.small,
  },
  prerequisitesSection: {
    marginTop: SIZES.medium,
  },
  prerequisitesContainer: {
    gap: SIZES.small,
  },
  prerequisiteItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    borderWidth: 1,
    padding: SIZES.small,
  },
  prerequisiteContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  prerequisiteStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SIZES.small,
  },
  prerequisiteTitle: {
    fontSize: SIZES.font,
    fontWeight: "500",
  },

  // Bottom Button Container (matching HomeScreen exactly)
  wrapper: {
    borderRadius: 100,
    overflow: "hidden",
    alignSelf: "flex-end",
    marginRight: 10,
  },
  container: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-end",
    justifyContent: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 12,
    zIndex: 1000,
    backgroundColor: "transparent",
    flexShrink: 0,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  addStyleFab: {
    width: 70,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  touchable: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 28,
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  addStyleShadow: {
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});

export default TaskDetailsScreen;
