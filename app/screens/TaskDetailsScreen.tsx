import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { format, isToday, isTomorrow } from "date-fns";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ScreenHeader from "../components/common/ScreenHeader";
import { useTheme } from "../context/ThemeContext";
import {
  deleteTask,
  getActiveTasks,
  getArchivedTasks,
  updateTask,
} from "../services/taskStorageService";
import { SIZES } from "../theme";
import { RootStackParamList, Task, TaskPriority } from "../types";

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
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [tempPriority, setTempPriority] = useState<TaskPriority>("normal");

  // Animation values
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    loadTask();
  }, [taskId]);

  // Animate elements when task loads
  useEffect(() => {
    if (task) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
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

      // Provide visual feedback
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
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
  const startEditing = (field: string) => {
    if (!task) {
      console.log("Cannot start editing: no task loaded");
      return;
    }

    try {
      switch (field) {
        case "title":
          setTempTitle(task.title || "");
          setEditingField("title");
          break;
        case "description":
          setTempDescription(task.description || "");
          setEditingField("description");
          break;
        case "date":
          setTempDate(new Date(task.dueDate));
          setEditingField("date");
          break;
        case "priority":
          setTempPriority(task.priority || "normal");
          setEditingField("priority");
          break;
        default:
          console.log("Unknown field to edit:", field);
          return;
      }
    } catch (error) {
      console.error("Error starting edit for field:", field, error);
      Alert.alert("Error", "Failed to start editing");
    }
  };

  const saveEdit = async () => {
    if (!task || !editingField) {
      console.log("No task or editing field:", { task: !!task, editingField });
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
            return;
          }
          break;
        case "description":
          updatedTask.description = tempDescription.trim();
          break;
        case "date":
          updatedTask.dueDate = tempDate.getTime();
          break;
        case "priority":
          updatedTask.priority = tempPriority;
          break;
        default:
          console.log("Unknown editing field:", editingField);
          return;
      }

      console.log("Saving task update:", { editingField, updatedTask });
      await updateTask(updatedTask);
      setTask(updatedTask);
      setEditingField(null);
    } catch (error) {
      console.error("Error updating task:", error);
      Alert.alert("Error", "Failed to update task");
      setEditingField(null); // Reset editing state on error
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
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
        contentContainerStyle={styles.scrollContent}>
        {/* Main Task Card */}
        {task && (
          <Animated.View
            style={[
              styles.mainCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: fadeAnim,
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
                <TextInput
                  style={[
                    styles.taskTitle,
                    styles.editingField,
                    {
                      color: colors.text,
                      borderColor: colors.primary,
                    },
                  ]}
                  value={tempTitle}
                  onChangeText={setTempTitle}
                  autoFocus
                  multiline
                  onSubmitEditing={saveEdit}
                  blurOnSubmit={false}
                />
              ) : (
                <TouchableOpacity
                  onPress={() => startEditing("title")}
                  style={styles.clickableField}>
                  <Text style={[styles.taskTitle, { color: colors.text }]}>
                    {task?.title || "Untitled Task"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Priority - Editable */}
            <View style={styles.prioritySection}>
              {editingField === "priority" && task ? (
                <View
                  style={[
                    styles.priorityEditContainer,
                    styles.editingField,
                    { borderColor: colors.primary },
                  ]}>
                  {(["low", "normal", "high"] as TaskPriority[]).map(
                    (priority) => (
                      <TouchableOpacity
                        key={priority}
                        style={[
                          styles.priorityOption,
                          {
                            backgroundColor:
                              tempPriority === priority
                                ? getPriorityColor(priority)
                                : colors.surface,
                            borderColor: getPriorityColor(priority),
                          },
                        ]}
                        onPress={() => {
                          setTempPriority(priority);
                          saveEdit();
                        }}>
                        <Text
                          style={[
                            styles.priorityOptionText,
                            {
                              color:
                                tempPriority === priority
                                  ? "white"
                                  : colors.text,
                            },
                          ]}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => startEditing("priority")}
                  style={styles.clickableField}>
                  <View
                    style={[
                      styles.priorityBadge,
                      {
                        backgroundColor: getPriorityColor(
                          task?.priority || "normal"
                        ),
                      },
                    ]}>
                    <Text style={styles.priorityText}>
                      {(task?.priority || "normal").charAt(0).toUpperCase() +
                        (task?.priority || "normal").slice(1)}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Due Date & Time - Editable */}
            <View style={styles.dateTimeSection}>
              {editingField === "date" && task ? (
                <View
                  style={[
                    styles.dateEditContainer,
                    styles.editingField,
                    { borderColor: colors.primary },
                  ]}>
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setTempDate(selectedDate);
                        saveEdit();
                      }
                    }}
                    minimumDate={new Date()}
                  />
                  <DateTimePicker
                    value={tempDate}
                    mode="time"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, selectedTime) => {
                      if (selectedTime) {
                        setTempDate(selectedTime);
                        saveEdit();
                      }
                    }}
                  />
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => startEditing("date")}
                  style={styles.clickableField}>
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
                </TouchableOpacity>
              )}
            </View>

            {/* Description - Editable */}
            <View style={styles.descriptionSection}>
              {editingField === "description" && task ? (
                <TextInput
                  style={[
                    styles.descriptionText,
                    styles.editingField,
                    {
                      color: colors.text,
                      borderColor: colors.primary,
                    },
                  ]}
                  value={tempDescription}
                  onChangeText={setTempDescription}
                  placeholder="Add a description..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  autoFocus
                  onSubmitEditing={saveEdit}
                  blurOnSubmit={false}
                />
              ) : (
                <TouchableOpacity
                  onPress={() => startEditing("description")}
                  style={styles.clickableField}>
                  <Text
                    style={[styles.descriptionText, { color: colors.text }]}>
                    {task?.description || "Add a description..."}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Category */}
            <View style={styles.categorySection}>
              <Text
                style={[styles.categoryLabel, { color: colors.textSecondary }]}>
                Category
              </Text>
              <Text style={[styles.categoryText, { color: colors.text }]}>
                {task?.category || "Uncategorized"}
              </Text>
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
    borderRadius: 16,
    borderWidth: 1,
    padding: SIZES.medium,
    marginBottom: SIZES.medium,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },

  // Status
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SIZES.medium,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SIZES.small,
  },
  statusText: {
    fontSize: SIZES.font,
    fontWeight: "600",
  },

  // Title Section
  titleSection: {
    marginBottom: SIZES.medium,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: "bold",
    lineHeight: 32,
  },

  // Priority Section
  prioritySection: {
    marginBottom: SIZES.medium,
  },
  priorityBadge: {
    paddingHorizontal: SIZES.medium,
    paddingVertical: SIZES.small / 2,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  priorityText: {
    color: "white",
    fontSize: SIZES.font,
    fontWeight: "600",
  },
  priorityEditContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SIZES.small,
    marginBottom: SIZES.small,
  },
  priorityOption: {
    paddingHorizontal: SIZES.medium,
    paddingVertical: SIZES.small,
    borderRadius: 16,
    borderWidth: 1,
  },
  priorityOptionText: {
    fontSize: SIZES.font,
    fontWeight: "600",
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
  dateEditContainer: {
    gap: SIZES.small,
  },

  // Description Section
  descriptionSection: {
    marginBottom: SIZES.medium,
  },
  descriptionText: {
    fontSize: SIZES.font,
    lineHeight: 24,
  },

  // Category Section
  categorySection: {
    paddingTop: SIZES.small,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  categoryLabel: {
    fontSize: SIZES.font - 2,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: SIZES.font,
    fontWeight: "500",
  },

  // Editable Fields
  clickableField: {
    paddingVertical: SIZES.small / 2,
  },
  editingField: {
    borderWidth: 2,
    borderRadius: 8,
    padding: SIZES.small,
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
    marginRight: SIZES.medium,
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
});

export default TaskDetailsScreen;
