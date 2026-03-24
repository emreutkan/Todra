import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../context/ThemeContext";
import { useAddTask } from "../hooks/useAddTask";
import { useReducedMotion } from "../hooks/useReducedMotion";
import {
  deleteTask,
  getActiveTasks,
  getArchivedTasks,
  updateTask as updateTaskService,
} from "../services/taskStorageService";
import { RADII, SIZES } from "../theme";
import { typography } from "../typography";
import { RootStackParamList, Task } from "../types";

/** Tight stack inside grouped cards; generous gaps between sections (arrange rhythm). */
const SECTION_AFTER_HERO = SIZES.extraLarge;
const GROUP_LABEL_GAP = SIZES.small;
const FIELD_ROW_PAD_V = SIZES.medium;
const FIELD_ROW_PAD_H = SIZES.small;

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
  reducedMotion,
}: {
  onPress: () => void;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  backgroundColor: string;
  borderColor?: string;
  label: string;
  reducedMotion: boolean;
}) => {
  const { colors } = useTheme();
  const pressScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (reducedMotion) {
      pressScale.setValue(1.2);
      return;
    }
    Animated.timing(pressScale, {
      toValue: 1.2,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (reducedMotion) {
      pressScale.setValue(1);
      return;
    }
    Animated.timing(pressScale, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.fab,
        {
          backgroundColor,
          borderColor,
          borderWidth: borderColor ? 1 : 0,
          transform: [{ scale: pressScale }],
        },
        styles.shadow,
        { shadowColor: colors.shadowColor },
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
  reducedMotion,
  strongShadow,
}: {
  onPress: () => void;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  backgroundColor: string;
  label: string;
  reducedMotion: boolean;
  /** Primary-style glow for the main action (e.g. mark complete). */
  strongShadow?: boolean;
}) => {
  const { colors } = useTheme();
  const pressScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (reducedMotion) {
      pressScale.setValue(1.2);
      return;
    }
    Animated.timing(pressScale, {
      toValue: 1.2,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (reducedMotion) {
      pressScale.setValue(1);
      return;
    }
    Animated.timing(pressScale, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.addStyleFab,
        {
          backgroundColor,
          transform: [{ scale: pressScale }],
        },
        styles.addStyleShadow,
        { shadowColor: colors.shadowColor },
        strongShadow &&
          Platform.select({
            ios: {
              shadowColor: backgroundColor,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.38,
              shadowRadius: 14,
            },
            android: { elevation: 12 },
            default: {
              shadowColor: backgroundColor,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.32,
              shadowRadius: 12,
            },
          }),
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
  const reducedMotion = useReducedMotion();

  const [task, setTask] = useState<Task | null>(null);
  const [relatedTasks, setRelatedTasks] = useState<Task[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fadeInDoneForTaskId = useRef<string | null>(null);

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

  // Animate elements when task loads (once per task id)
  useEffect(() => {
    if (!task) return;
    if (fadeInDoneForTaskId.current === task.id) return;
    fadeInDoneForTaskId.current = task.id;

    if (reducedMotion) {
      fadeAnim.setValue(1);
      return;
    }
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [task, fadeAnim, reducedMotion]);

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

      if (!reducedMotion) {
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
      }
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
        {renderSectionTitle("Prerequisites")}
        <Text
          style={[
            typography.bodySmall,
            styles.prerequisitesSubcopy,
            { color: colors.textSecondary },
          ]}>
          Finish these before you can complete this task.
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
                    color={
                      prereqTask.completed ? colors.onPrimary : colors.warning
                    }
                  />
                </View>
                <View>
                  <Text
                    style={[
                      typography.subbodySemiBold,
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

  const renderSectionTitle = (label: string, extraRowStyle?: object) => (
    <View style={[styles.sectionTitleRow, extraRowStyle]}>
      <View
        style={[styles.sectionTitleAccent, { backgroundColor: colors.primary }]}
      />
      <Text style={[typography.titleMedium, { color: colors.text, flex: 1 }]}>
        {label}
      </Text>
    </View>
  );

  const renderStaticTaskDetails = () => {
    if (!task) return null;

    const dueDateTime = formatDateTime(task.dueDate);
    const archivedDateTime = task.archivedAt
      ? formatDateTime(new Date(task.archivedAt).getTime())
      : null;

    const rowHairline = { backgroundColor: colors.hairline };

    return (
      <Animated.View
        style={[
          styles.mainCard,
          {
            opacity: fadeAnim,
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderLeftWidth: 4,
            borderLeftColor: colors.primary,
            shadowColor: colors.shadowColor,
          },
        ]}>
        <View
          style={[
            styles.statusRow,
            {
              backgroundColor: colors.surface,
              borderColor: colors.hairline,
            },
          ]}>
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
              size={18}
              color={colors.onPrimary}
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
              <Ionicons name="archive" size={12} color={colors.onPrimary} />
              <Text style={[styles.archivedText, { color: colors.onPrimary }]}>
                Archived
              </Text>
            </View>
          )}
        </View>

        <Text style={[typography.display, styles.heroTitle, { color: colors.text }]}>
          {task.title}
        </Text>

        {task.description ? (
          <View style={styles.heroNotesBlock}>
            <Text
              style={[typography.label, styles.inlineLabel, { color: colors.textSecondary }]}>
              Notes
            </Text>
            <Text style={[typography.subbody, { color: colors.text }]}>
              {task.description}
            </Text>
          </View>
        ) : null}

        {renderSectionTitle(
          "Organize",
          !task.description ? styles.sectionTitleFirst : undefined
        )}
        <View
          style={[
            styles.fieldGroupCard,
            { borderColor: colors.border, marginBottom: SECTION_AFTER_HERO },
          ]}>
          <View
            style={[
              styles.fieldRowPadded,
              { paddingVertical: FIELD_ROW_PAD_V, paddingHorizontal: FIELD_ROW_PAD_H },
            ]}>
            <Text style={[typography.label, styles.inlineLabel, { color: colors.textSecondary }]}>
              Category
            </Text>
            <Text style={[typography.bodySmallMedium, { color: colors.text }]}>
              {task.category}
            </Text>
          </View>
          <View style={[styles.rowDivider, rowHairline]} />
          <View
            style={[
              styles.fieldRowPadded,
              { paddingVertical: FIELD_ROW_PAD_V, paddingHorizontal: FIELD_ROW_PAD_H },
            ]}>
            <Text style={[typography.label, styles.inlineLabel, { color: colors.textSecondary }]}>
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
                  shadowColor: colors.shadowColor,
                  marginTop: GROUP_LABEL_GAP,
                },
              ]}>
              <Text style={[styles.priorityText, { color: colors.onPrimary }]}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {renderSectionTitle("Schedule")}
        <View style={[styles.fieldGroupCard, { borderColor: colors.border }]}>
          <View
            style={[
              styles.fieldRowPadded,
              { paddingVertical: FIELD_ROW_PAD_V, paddingHorizontal: FIELD_ROW_PAD_H },
            ]}>
            <Text style={[typography.label, styles.inlineLabel, { color: colors.textSecondary }]}>
              Due
            </Text>
            <Text style={[typography.bodySmallMedium, { color: colors.text }]}>
              {dueDateTime.full}
            </Text>
          </View>
          {task.archived && archivedDateTime ? (
            <>
              <View style={[styles.rowDivider, rowHairline]} />
              <View
                style={[
                  styles.fieldRowPadded,
                  { paddingVertical: FIELD_ROW_PAD_V, paddingHorizontal: FIELD_ROW_PAD_H },
                ]}>
                <Text
                  style={[typography.label, styles.inlineLabel, { color: colors.textSecondary }]}>
                  Archived on
                </Text>
                <Text style={[typography.bodySmallMedium, { color: colors.text }]}>
                  {archivedDateTime.full}
                </Text>
              </View>
            </>
          ) : null}
          <View style={[styles.rowDivider, rowHairline]} />
          <View
            style={[
              styles.fieldRowPadded,
              { paddingVertical: FIELD_ROW_PAD_V, paddingHorizontal: FIELD_ROW_PAD_H },
            ]}>
            <Text style={[typography.label, styles.inlineLabel, { color: colors.textSecondary }]}>
              Reminder
            </Text>
            <Text style={[typography.bodySmallMedium, { color: colors.text }]}>
              {formatReminderText(task.remindMe)}
            </Text>
          </View>
          <View style={[styles.rowDivider, rowHairline]} />
          <View
            style={[
              styles.fieldRowPadded,
              { paddingVertical: FIELD_ROW_PAD_V, paddingHorizontal: FIELD_ROW_PAD_H },
            ]}>
            <Text style={[typography.label, styles.inlineLabel, { color: colors.textSecondary }]}>
              Repetition
            </Text>
            <Text style={[typography.bodySmallMedium, { color: colors.text }]}>
              {formatRepetitionText(task.repetition)}
            </Text>
          </View>
          {task.isRecurring ? (
            <>
              <View style={[styles.rowDivider, rowHairline]} />
              <View
                style={[
                  styles.fieldRowPadded,
                  styles.recurringRow,
                  { paddingVertical: FIELD_ROW_PAD_V, paddingHorizontal: FIELD_ROW_PAD_H },
                ]}>
                <Text
                  style={[typography.label, styles.inlineLabel, { color: colors.textSecondary }]}>
                  Recurring
                </Text>
                <View style={styles.recurringInfo}>
                  <Ionicons name="repeat" size={16} color={colors.primary} />
                  <Text
                    style={[
                      typography.bodySmallMedium,
                      { color: colors.text, marginLeft: SIZES.small },
                    ]}>
                    {task.parentTaskId
                      ? "Generated from recurring task"
                      : "Original recurring task"}
                  </Text>
                </View>
              </View>
            </>
          ) : null}
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
        <View style={{ marginTop: SIZES.medium }}>
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
        <StatusBar style={isDark ? "light" : "dark"} />
        <ScreenHeader
          title="Task details"
          titleEmphasis="hero"
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
        <StatusBar style={isDark ? "light" : "dark"} />
        <ScreenHeader
          title="Task details"
          titleEmphasis="hero"
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
      <StatusBar style={isDark ? "light" : "dark"} />
      <LinearGradient
        colors={[colors.background, colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.88, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <ScreenHeader
        title={isEditMode ? "Edit task" : task.title}
        titleEmphasis="hero"
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
          {/* Prerequisites at the top */}
          {task?.predecessorIds && task.predecessorIds.length > 0 && (
            <Animated.View style={{ opacity: fadeAnim }}>
              {renderPrerequisites()}
            </Animated.View>
          )}

          {renderStaticTaskDetails()}
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
              intensity={isDark ? 48 : 100}
              tint={isDark ? "dark" : "light"}>
              <AnimatedActionButton
                onPress={handleDelete}
                iconName="trash-outline"
                iconColor={colors.error}
                backgroundColor={colors.card}
                borderColor={colors.border}
                label="Delete Task"
                reducedMotion={reducedMotion}
              />
              <AnimatedAddStyleButton
                onPress={handleToggleComplete}
                iconName={task.completed ? "close-circle" : "checkmark-circle"}
                iconColor={colors.onPrimary}
                backgroundColor={colors.success}
                label={task.completed ? "Mark Incomplete" : "Mark Complete"}
                reducedMotion={reducedMotion}
                strongShadow
              />
              <AnimatedActionButton
                onPress={handleEdit}
                iconName="create-outline"
                iconColor={colors.onPrimary}
                backgroundColor={colors.primary}
                label="Edit Task"
                reducedMotion={reducedMotion}
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
    paddingHorizontal: SIZES.medium,
    paddingTop: SIZES.base,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...typography.body,
    marginTop: SIZES.medium,
  },

  mainCard: {
    padding: SIZES.medium,
    paddingBottom: SIZES.extraLarge,
    borderRadius: 16,
    marginBottom: SIZES.medium,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 5,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SIZES.extraLarge,
    paddingVertical: SIZES.medium + 2,
    paddingHorizontal: SIZES.medium,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusIndicator: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SIZES.medium,
  },
  statusText: {
    ...typography.headlineBold,
    flex: 1,
  },

  heroTitle: {
    marginBottom: SIZES.small,
  },
  heroNotesBlock: {
    marginBottom: SECTION_AFTER_HERO,
    gap: GROUP_LABEL_GAP,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: GROUP_LABEL_GAP,
  },
  sectionTitleAccent: {
    width: 4,
    height: 22,
    borderRadius: 2,
  },
  sectionTitleFirst: {
    marginTop: SIZES.large,
  },
  fieldGroupCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  fieldRowPadded: {},
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: SIZES.small,
  },
  inlineLabel: {
    marginBottom: 4,
    textTransform: "uppercase",
  },
  recurringRow: {
    paddingBottom: SIZES.small,
  },

  // Priority Badge
  priorityBadge: {
    paddingHorizontal: SIZES.medium,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    elevation: 3,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  priorityText: {
    ...typography.bodySmallBold,
    letterSpacing: 0.4,
  },

  // Archived Badge
  archivedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.small,
    paddingVertical: 4,
    borderRadius: RADII.md,
    marginLeft: SIZES.small,
  },
  archivedText: {
    ...typography.captionSemiBold,
    marginLeft: 4,
  },

  // Recurring Info
  recurringInfo: {
    flexDirection: "row",
    alignItems: "center",
  },

  prerequisitesSubcopy: {
    marginBottom: SIZES.medium,
    maxWidth: 320,
  },
  prerequisitesSection: {
    marginBottom: SIZES.extraLarge,
  },
  prerequisitesContainer: {
    gap: SIZES.small,
  },
  prerequisiteItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: 1.5,
    padding: SIZES.medium,
  },
  prerequisiteContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  prerequisiteStatus: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SIZES.small,
  },
  prerequisiteTitle: {
    flexShrink: 1,
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
    borderRadius: RADII.fab,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  addStyleFab: {
    width: 70,
    height: 56,
    borderRadius: RADII.fab,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  touchable: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: RADII.fab,
  },
  shadow: {
    ...Platform.select({
      ios: {
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
