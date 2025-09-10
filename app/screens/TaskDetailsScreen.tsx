import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { format, isToday, isTomorrow } from "date-fns";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import CategorySelector from "../components/AddTaskComponents/CategorySelector";
import PrioritySelectorAdd from "../components/AddTaskComponents/PrioritySelector";
import RepetitionSelector from "../components/AddTaskComponents/RepetitionSelector";
import DateTimeButton from "../components/common/DateTimeButton";
import PrioritySelector from "../components/common/PrioritySelector";
import ScreenHeader from "../components/common/ScreenHeader";
import TaskDescription from "../components/common/TaskDescription";
import TaskTitleInput from "../components/common/TaskTitleInput";
import { useTheme } from "../context/ThemeContext";
import {
  deleteTask,
  getActiveTasks,
  getArchivedTasks,
  updateTask,
} from "../services/taskStorageService";
import { SIZES } from "../theme";
import {
  RepetitionRule,
  RootStackParamList,
  Task,
  TaskPriority,
} from "../types";

type TaskDetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "TaskDetails"
>;
type TaskDetailsScreenRouteProp = RouteProp<RootStackParamList, "TaskDetails">;

const TaskDetailsScreen = () => {
  const navigation = useNavigation<TaskDetailsScreenNavigationProp>();
  const route = useRoute<TaskDetailsScreenRouteProp>();
  const { taskId } = route.params;
  const { colors, isDark } = useTheme();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedTasks, setRelatedTasks] = useState<Task[]>([]);

  // Editing states
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState("");
  const [tempDescription, setTempDescription] = useState("");

  // Repetition management
  const [showRepetitionModal, setShowRepetitionModal] = useState(false);
  const [tempRepetition, setTempRepetition] = useState<
    RepetitionRule | undefined
  >(undefined);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [tempPriority, setTempPriority] = useState<TaskPriority>("normal");
  const [tempCategory, setTempCategory] = useState<string>("");

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  // Refs for scrolling to sections
  const scrollViewRef = useRef<ScrollView>(null);
  const repetitionSectionY = useRef<number>(0);

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
        // Use setTimeout to avoid scheduling updates during render
        setTimeout(() => {
          setIsAnimating(false);
        }, 0);
      });
    }
  }, [task, fadeAnim, isAnimating]);

  // Ensure temp repetition mirrors the task on load
  useEffect(() => {
    if (task) {
      setTempRepetition(
        task.repetition ?? {
          enabled: false,
          type: "weekly",
          interval: 1,
          daysOfWeek: [],
        }
      );
      setTempCategory(task.category || "");
    }
  }, [task]);

  // Helper functions
  const formatTimeDisplay = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();

    if (hours === 23 && minutes === 59) {
      return "End of today";
    }

    return format(date, "h:mm a");
  };

  const formatDateDisplay = (date: Date) => {
    if (isToday(date)) {
      return `${format(date, "EEE, MMM d, yyyy")} (today)`;
    } else if (isTomorrow(date)) {
      return `${format(date, "EEE, MMM d, yyyy")} (tomorrow)`;
    } else {
      return format(date, "EEE, MMM d, yyyy");
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority.toLowerCase()) {
      case "high":
        return colors.error;
      case "normal":
        return colors.warning;
      case "low":
        return colors.success;
      default:
        return colors.info;
    }
  };

  const isOverdue = (dueDate: number) => {
    return !task?.completed && dueDate < Date.now();
  };

  const loadTask = async () => {
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
      await updateTask(updatedTask);
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

  // Editing functions
  const startEditing = useCallback(
    (field: string) => {
      console.log("Starting to edit field:", field, "Task:", !!task);

      if (!task) {
        console.log("Cannot start editing: no task loaded");
        Alert.alert("Error", "Task not loaded yet");
        return;
      }

      // Prevent editing if already editing another field
      if (editingField && editingField !== field) {
        console.log("Already editing another field:", editingField);
        return;
      }

      try {
        // Use setTimeout to batch state updates and avoid scheduling conflicts
        setTimeout(() => {
          switch (field) {
            case "title":
              console.log("Setting title edit mode");
              setTempTitle(task.title || "");
              setEditingField("title");
              break;
            case "description":
              console.log("Setting description edit mode");
              setTempDescription(task.description || "");
              setEditingField("description");
              break;
            case "date":
              console.log("Setting date edit mode");
              setTempDate(new Date(task.dueDate));
              setEditingField("date");
              break;
            case "priority":
              console.log("Setting priority edit mode");
              setTempPriority(task.priority || "normal");
              setEditingField("priority");
              break;
            case "category":
              console.log("Setting category edit mode");
              setTempCategory(task.category || "");
              setEditingField("category");
              break;
            default:
              console.log("Unknown field to edit:", field);
              return;
          }
          console.log("Edit mode set successfully for:", field);
        }, 0);
      } catch (error) {
        console.error("Error starting edit for field:", field, error);
        Alert.alert(
          "Error",
          "Failed to start editing: " + (error as Error).message
        );
      }
    },
    [task, editingField]
  );

  const saveEdit = useCallback(
    async (nextValue?: any) => {
      if (!task || !editingField) {
        console.log("No task or editing field:", {
          task: !!task,
          editingField,
        });
        return;
      }

      try {
        let updatedTask = { ...task };

        switch (editingField) {
          case "title":
            if (tempTitle.trim()) {
              updatedTask.title = tempTitle.trim();
            } else {
              console.log("Title is empty, not saving");
              setEditingField(null);
              return;
            }
            break;
          case "description":
            updatedTask.description = tempDescription.trim();
            break;
          case "date":
            if (nextValue instanceof Date) {
              updatedTask.dueDate = nextValue.getTime();
            } else {
              updatedTask.dueDate = tempDate.getTime();
            }
            break;
          case "priority":
            updatedTask.priority = (nextValue ?? tempPriority) as TaskPriority;
            break;
          case "category":
            updatedTask.category = (nextValue ?? tempCategory) as string;
            break;
          default:
            console.log("Unknown editing field:", editingField);
            setEditingField(null);
            return;
        }

        console.log("Saving task update:", { editingField, updatedTask });
        await updateTask(updatedTask);

        // Use setTimeout to batch state updates
        setTimeout(() => {
          setTask(updatedTask);
          setEditingField(null);
        }, 0);
      } catch (error) {
        console.error("Error updating task:", error);
        Alert.alert("Error", "Failed to update task");
        setEditingField(null); // Reset editing state on error
      }
    },
    [task, editingField, tempTitle, tempDescription, tempDate, tempPriority]
  );

  const cancelEdit = useCallback(() => {
    // Use setTimeout to avoid scheduling updates during render
    setTimeout(() => {
      setEditingField(null);
    }, 0);
  }, []);

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

  // Repetition management functions
  const handleRepetitionPress = () => {
    // Scroll to repetition section instead of opening a modal
    const targetY = Math.max((repetitionSectionY.current || 0) - 24, 0);
    scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
  };

  const handleRepetitionSave = async () => {
    if (!task) return;

    try {
      const updatedTask = {
        ...task,
        repetition: tempRepetition?.enabled ? tempRepetition : undefined,
        isRecurring: tempRepetition?.enabled || false,
      };

      const success = await updateTask(updatedTask);
      if (success) {
        setTask(updatedTask);
        setShowRepetitionModal(false);
      } else {
        Alert.alert("Error", "Failed to update repetition settings");
      }
    } catch (error) {
      console.error("Error updating repetition:", error);
      Alert.alert("Error", "Failed to update repetition settings");
    }
  };

  // No modal cancel needed; inline editing

  const handleRemoveRepetition = async () => {
    if (!task) return;

    Alert.alert(
      "Remove Repetition",
      "Are you sure you want to remove the repetition rule for this task?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedTask = {
                ...task,
                repetition: undefined,
                isRecurring: false,
              };

              const success = await updateTask(updatedTask);
              if (success) {
                setTask(updatedTask);
              } else {
                Alert.alert("Error", "Failed to remove repetition");
              }
            } catch (error) {
              console.error("Error removing repetition:", error);
              Alert.alert("Error", "Failed to remove repetition");
            }
          },
        },
      ]
    );
  };

  const renderPrerequisites = () => {
    if (!task?.predecessorIds || task.predecessorIds.length === 0) {
      return null;
    }

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Prerequisites</Text>
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
                <View style={styles.prerequisiteTextContainer}>
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
                  <Text
                    style={[
                      styles.prerequisiteSubtitle,
                      { color: colors.textSecondary },
                    ]}>
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

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScreenHeader
        title="Task Details"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightComponent={
          editingField ? (
            <TouchableOpacity
              onPress={cancelEdit}
              style={styles.cancelButton}
              activeOpacity={0.7}>
              <Text style={[styles.cancelButtonText, { color: colors.error }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        ref={scrollViewRef}>
        {/* Main Task Card */}
        {task && (
          <Animated.View
            style={[
              styles.mainCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: editingField ? 1 : fadeAnim,
              },
            ]}>
            {/* Status Indicator */}
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
            </View>

            {/* Title - Editable */}
            <View style={styles.titleSection}>
              {editingField === "title" && task ? (
                <View style={styles.editingContainer}>
                  <TaskTitleInput
                    value={tempTitle}
                    onChangeText={setTempTitle}
                    placeholder="Enter task title..."
                    autoFocus={true}
                    multiline={true}
                    onSubmitEditing={saveEdit}
                    returnKeyType="done"
                    style={[
                      styles.taskTitle,
                      styles.editingField,
                      {
                        color: colors.text,
                        borderColor: colors.primary,
                        backgroundColor: colors.surface,
                      },
                    ]}
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={[
                        styles.editButton,
                        { backgroundColor: colors.success },
                      ]}
                      onPress={saveEdit}
                      activeOpacity={0.7}>
                      <Ionicons name="checkmark" size={16} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.editButton,
                        { backgroundColor: colors.error },
                      ]}
                      onPress={cancelEdit}
                      activeOpacity={0.7}>
                      <Ionicons name="close" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TaskTitleInput
                  value={task?.title || "Untitled Task"}
                  onChangeText={() => {}}
                  placeholder="Untitled Task"
                  editable={false}
                  onPress={() => startEditing("title")}
                  showEditIcon={true}
                  style={styles.taskTitle}
                />
              )}
            </View>

            {/* Priority - Editable (using AddTask selector for consistency) */}
            <View style={styles.prioritySection}>
              {editingField === "priority" && task ? (
                <View style={styles.editingContainer}>
                  <View
                    style={[
                      styles.editingField,
                      {
                        borderColor: colors.primary,
                        backgroundColor: colors.surface,
                        padding: SIZES.small,
                      },
                    ]}>
                    <PrioritySelectorAdd
                      selectedPriority={tempPriority}
                      onSelectPriority={(priority) => {
                        setTempPriority(priority);
                        saveEdit(priority);
                      }}
                    />
                  </View>
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={[
                        styles.editButton,
                        { backgroundColor: colors.error },
                      ]}
                      onPress={cancelEdit}
                      activeOpacity={0.7}>
                      <Ionicons name="close" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <PrioritySelector
                  selectedPriority={task?.priority || "normal"}
                  onSelectPriority={() => {}}
                  editable={false}
                  onPress={() => startEditing("priority")}
                  showEditIcon={true}
                />
              )}
            </View>

            {/* Due Date & Time - Editable */}
            <View style={styles.dateTimeSection}>
              {editingField === "date" && task ? (
                <View style={styles.editingContainer}>
                  <View
                    style={[
                      styles.editingField,
                      {
                        borderColor: colors.primary,
                        backgroundColor: colors.surface,
                        padding: SIZES.small,
                      },
                    ]}>
                    <DateTimeButton
                      value={tempDate}
                      onDateChange={(date) => {
                        setTempDate(date);
                        saveEdit(date);
                      }}
                      mode="both"
                      minimumDate={new Date()}
                    />
                  </View>
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={[
                        styles.editButton,
                        { backgroundColor: colors.error },
                      ]}
                      onPress={cancelEdit}
                      activeOpacity={0.7}>
                      <Ionicons name="close" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => startEditing("date")}
                  style={styles.clickableField}>
                  <View style={styles.dateTimeContainer}>
                    <View style={styles.dateTimeInfo}>
                      <Text style={[styles.dateText, { color: colors.text }]}>
                        {task?.dueDate
                          ? formatDateDisplay(new Date(task.dueDate))
                          : "No date set"}
                      </Text>
                      <Text
                        style={[
                          styles.timeText,
                          { color: colors.textSecondary },
                        ]}>
                        {task?.dueDate
                          ? formatTimeDisplay(new Date(task.dueDate))
                          : "No time set"}
                      </Text>
                    </View>
                    <Ionicons
                      name="create-outline"
                      size={16}
                      color={colors.textSecondary}
                      style={styles.editIcon}
                    />
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Repetition */}
            <View style={styles.sectionContainer}>
              {tempRepetition && (
                <View style={{ marginBottom: SIZES.small }}>
                  <RepetitionSelector
                    repetition={tempRepetition}
                    onRepetitionChange={setTempRepetition}
                  />
                </View>
              )}
            </View>

            {/* Description - Editable */}
            <View style={styles.descriptionSection}>
              {editingField === "description" && task ? (
                <View style={styles.editingContainer}>
                  <TaskDescription
                    value={tempDescription}
                    onChangeText={setTempDescription}
                    placeholder="Add a description..."
                    autoFocus={true}
                    onSubmitEditing={saveEdit}
                    returnKeyType="done"
                    style={[
                      styles.descriptionText,
                      styles.editingField,
                      {
                        color: colors.text,
                        borderColor: colors.primary,
                        backgroundColor: colors.surface,
                      },
                    ]}
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={[
                        styles.editButton,
                        { backgroundColor: colors.success },
                      ]}
                      onPress={saveEdit}
                      activeOpacity={0.7}>
                      <Ionicons name="checkmark" size={16} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.editButton,
                        { backgroundColor: colors.error },
                      ]}
                      onPress={cancelEdit}
                      activeOpacity={0.7}>
                      <Ionicons name="close" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TaskDescription
                  value={task?.description || ""}
                  onChangeText={() => {}}
                  placeholder="Add a description..."
                  editable={false}
                  onPress={() => startEditing("description")}
                  showEditIcon={true}
                  style={styles.descriptionText}
                />
              )}
            </View>

            {/* Category - Editable (using AddTask selector for consistency) */}
            <View style={styles.categorySection}>
              {editingField === "category" && task ? (
                <View style={styles.editingContainer}>
                  <View
                    style={[
                      styles.editingField,
                      {
                        borderColor: colors.primary,
                        backgroundColor: colors.surface,
                        padding: SIZES.small,
                      },
                    ]}>
                    <CategorySelector
                      selectedCategory={tempCategory}
                      onSelectCategory={(categoryId) => {
                        setTempCategory(categoryId);
                        saveEdit(categoryId);
                      }}
                    />
                  </View>
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={[
                        styles.editButton,
                        { backgroundColor: colors.error },
                      ]}
                      onPress={cancelEdit}
                      activeOpacity={0.7}>
                      <Ionicons name="close" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => startEditing("category")}
                  activeOpacity={0.7}
                  style={styles.clickableField}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.categoryLabel,
                        { color: colors.textSecondary },
                      ]}>
                      Category
                    </Text>
                    <Text style={[styles.categoryText, { color: colors.text }]}>
                      {task?.category || "Uncategorized"}
                    </Text>
                  </View>
                  <Ionicons
                    name="create-outline"
                    size={16}
                    color={colors.textSecondary}
                    style={styles.editIcon}
                  />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}

        {/* Prerequisites */}
        {task?.predecessorIds && task.predecessorIds.length > 0 && (
          <Animated.View style={{ opacity: fadeAnim }}>
            {renderPrerequisites()}
          </Animated.View>
        )}
      </ScrollView>

      {/* Action Footer */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
        ]}>
        <TouchableOpacity
          style={[styles.deleteButton, { borderColor: colors.error }]}
          onPress={handleDelete}
          activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={22} color={colors.error} />
        </TouchableOpacity>

        {/* Repetition quick button removed */}

        <TouchableOpacity
          style={[
            styles.toggleButton,
            {
              backgroundColor: task.completed ? colors.success : colors.primary,
            },
          ]}
          onPress={handleToggleComplete}
          activeOpacity={0.7}>
          <Text style={styles.toggleButtonText}>
            {task.completed ? "Mark Incomplete" : "Mark Complete"}
          </Text>
          <Ionicons
            name={task.completed ? "close-circle" : "checkmark-circle"}
            size={22}
            color="white"
          />
        </TouchableOpacity>
      </View>

      {/* Repetition modal removed in favor of inline section */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.medium,
    paddingBottom: 100,
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
    borderRadius: 20,
    borderWidth: 1,
    padding: SIZES.large,
    marginBottom: SIZES.medium,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },

  // Status
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SIZES.large,
    paddingVertical: SIZES.small,
    paddingHorizontal: SIZES.medium,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.02)",
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

  // Title Section
  titleSection: {
    marginBottom: SIZES.large,
  },
  taskTitle: {
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 34,
    letterSpacing: 0.3,
  },

  // Priority Section
  prioritySection: {
    marginBottom: SIZES.medium,
  },
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

  // Date & Time Section
  dateTimeSection: {
    marginBottom: SIZES.medium,
  },
  dateTimeInfo: {
    flex: 1,
  },
  dateText: {
    fontSize: SIZES.font,
    fontWeight: "500",
    marginBottom: 2,
  },
  timeText: {
    fontSize: SIZES.font - 2,
  },

  // Description Section
  descriptionSection: {
    marginBottom: SIZES.large,
  },
  descriptionText: {
    fontSize: SIZES.font + 1,
    lineHeight: 26,
    letterSpacing: 0.2,
  },

  // Category Section
  categorySection: {
    paddingTop: SIZES.medium,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
    backgroundColor: "rgba(0,0,0,0.02)",
    marginHorizontal: -SIZES.large,
    paddingHorizontal: SIZES.large,
    paddingBottom: SIZES.small,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  categoryLabel: {
    fontSize: SIZES.font - 1,
    marginBottom: 6,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  categoryText: {
    fontSize: SIZES.font + 1,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  // Editable Fields
  clickableField: {
    paddingVertical: SIZES.small / 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  editingContainer: {
    gap: SIZES.small,
  },
  editingField: {
    borderWidth: 2,
    borderRadius: 8,
    padding: SIZES.small,
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: SIZES.small,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  editIcon: {
    marginLeft: SIZES.small,
  },
  priorityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cancelButton: {
    paddingHorizontal: SIZES.small,
    paddingVertical: SIZES.small / 2,
  },
  cancelButtonText: {
    fontSize: SIZES.font,
    fontWeight: "600",
  },

  // Prerequisites
  sectionContainer: {
    marginBottom: SIZES.medium,
  },
  sectionTitle: {
    fontSize: SIZES.medium,
    fontWeight: "600",
    marginBottom: SIZES.small,
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
  prerequisiteTextContainer: {
    flex: 1,
  },
  prerequisiteTitle: {
    fontSize: SIZES.font,
    fontWeight: "500",
  },
  prerequisiteSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: SIZES.medium,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === "ios" ? 34 : SIZES.medium,
  },
  deleteButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginRight: SIZES.small,
  },
  repetitionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginRight: SIZES.small,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 24,
    paddingHorizontal: SIZES.medium,
  },
  toggleButtonText: {
    color: "white",
    fontWeight: "600",
    marginRight: SIZES.small,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0,0,0,0.3)",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 1,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  removeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  cancelModalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default TaskDetailsScreen;
