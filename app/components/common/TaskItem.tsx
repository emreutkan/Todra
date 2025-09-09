import { Ionicons } from "@expo/vector-icons";
import {
  differenceInDays,
  format,
  isToday,
  isTomorrow,
  isYesterday,
} from "date-fns";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { Task, TaskPriority } from "../../types";
import { formatDate, getPriorityColor } from "../../utils/taskUtils";

const { width } = Dimensions.get("window");
const SWIPE_THRESHOLD = -100;

interface TaskItemProps {
  item: Task;
  index?: number;
  totalTasks?: number;
  allTasks?: Task[];
  onDelete?: (id: string) => void;
  onToggleComplete?: (id: string) => void;
  onPress: (id: string) => void;
  isOverdue?: boolean;
  arePrereqsMet?: boolean;
  priority?: TaskPriority;
  // Mode configuration
  mode?: "home" | "all-tasks"; // Different modes for different screens
  showSwipeActions?: boolean; // Whether to show swipe-to-delete
  showAnimations?: boolean; // Whether to show entrance animations
}

const TaskItem: React.FC<TaskItemProps> = ({
  item,
  index = 0,
  totalTasks = 1,
  allTasks = [],
  onDelete,
  onToggleComplete,
  onPress,
  isOverdue = false,
  arePrereqsMet = true,
  priority,
  mode = "home",
  showSwipeActions = false,
  showAnimations = true,
}) => {
  const { colors } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const sizeAnim = useRef(new Animated.Value(28)).current;

  // Animation for entrance
  useEffect(() => {
    if (showAnimations) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          delay: index * 50,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          delay: index * 50,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      opacity.setValue(1);
      scale.setValue(1);
    }
  }, [index, showAnimations, opacity, scale]);

  // Pan responder for swipe gestures (only in home mode with swipe actions)
  const panResponder = useMemo(
    () =>
      showSwipeActions && mode === "home"
        ? PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
              return Math.abs(gestureState.dx) > 10;
            },
            onPanResponderMove: (_, gestureState) => {
              if (gestureState.dx < 0) {
                translateX.setValue(gestureState.dx);
              }
            },
            onPanResponderRelease: (_, gestureState) => {
              if (gestureState.dx < SWIPE_THRESHOLD) {
                // Swipe left to delete
                Animated.timing(translateX, {
                  toValue: -width,
                  duration: 200,
                  useNativeDriver: true,
                }).start(() => {
                  if (onDelete) {
                    onDelete(item.id);
                  }
                });
                Vibration.vibrate(50);
              } else {
                // Return to original position
                Animated.spring(translateX, {
                  toValue: 0,
                  useNativeDriver: true,
                }).start();
              }
            },
          })
        : null,
    [showSwipeActions, mode, translateX, onDelete, item.id]
  );

  // Format due date based on mode
  const formatDueDate = (dueDate: number) => {
    if (mode === "all-tasks") {
      return formatDate(dueDate);
    }

    const date = new Date(dueDate);
    const today = new Date();
    const diffDays = differenceInDays(date, today);

    if (isToday(date)) {
      return "Today";
    } else if (isTomorrow(date)) {
      return "Tomorrow";
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else if (diffDays > 0 && diffDays <= 7) {
      return format(date, "EEEE"); // Day of week
    } else {
      return format(date, "MMM d");
    }
  };

  // Get priority color
  const priorityColor = priority
    ? getPriorityColor(priority, colors)
    : getPriorityColor(item.priority, colors);

  // Check if task is overdue
  const taskIsOverdue =
    isOverdue || (!item.completed && item.dueDate < Date.now());

  // Handle task press
  const handlePress = () => {
    if (mode === "all-tasks") {
      onPress(item.id);
    } else {
      // In home mode, check prerequisites first
      if (!arePrereqsMet) {
        Alert.alert(
          "Prerequisites Required",
          "Complete the prerequisite tasks first.",
          [{ text: "OK" }]
        );
        return;
      }
      onPress(item.id);
    }
  };

  // Handle toggle completion
  const handleToggleComplete = () => {
    if (onToggleComplete) {
      onToggleComplete(item.id);
    }
  };

  // Handle press animations for completion button
  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(pressAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(sizeAnim, {
        toValue: 34, // 28 * 1.2 = 34
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
        toValue: 28,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={[
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
      {...(panResponder?.panHandlers || {})}>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateX }],
          },
        ]}>
        <TouchableOpacity
          style={[
            styles.taskItem,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: item.completed ? 0.7 : 1,
            },
            taskIsOverdue && {
              borderColor: colors.error,
              backgroundColor: colors.error + "08",
            },
          ]}
          onPress={handlePress}
          activeOpacity={0.7}>
          <View style={styles.taskContent}>
            <View style={styles.mainRow}>
              <View style={styles.leftContent}>
                {mode === "home" && onToggleComplete && (
                  <Animated.View
                    style={[
                      styles.completeButton,
                      {
                        backgroundColor: item.completed
                          ? colors.success
                          : colors.surface,
                        borderColor: item.completed
                          ? colors.success
                          : colors.border,
                        width: sizeAnim,
                        height: sizeAnim,
                        borderRadius: Animated.divide(sizeAnim, 2),
                        transform: [{ scale: pressAnim }],
                      },
                    ]}>
                    <TouchableOpacity
                      activeOpacity={1}
                      onPress={handleToggleComplete}
                      onPressIn={handlePressIn}
                      onPressOut={handlePressOut}
                      style={styles.completeButtonTouchable}
                    />
                  </Animated.View>
                )}

                <View style={styles.taskInfo}>
                  <View style={styles.titleRow}>
                    <Text
                      style={[
                        styles.taskTitle,
                        {
                          color: colors.text,
                          textDecorationLine: item.completed
                            ? "line-through"
                            : "none",
                        },
                      ]}
                      numberOfLines={2}>
                      {item.title}
                    </Text>
                    {mode === "home" && !arePrereqsMet && (
                      <Ionicons
                        name="lock-closed"
                        size={16}
                        color={colors.warning}
                        style={styles.lockIcon}
                      />
                    )}
                  </View>

                  {item.description && (
                    <Text
                      style={[
                        styles.description,
                        { color: colors.textSecondary },
                      ]}
                      numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}

                  <Text
                    style={[
                      styles.dueDate,
                      {
                        color: taskIsOverdue
                          ? colors.error
                          : colors.textSecondary,
                      },
                    ]}>
                    {formatDueDate(item.dueDate)}
                  </Text>
                </View>
              </View>

              <View style={styles.rightContent}>
                {mode === "all-tasks" && (
                  <View style={styles.statusContainer}>
                    <Ionicons
                      name={
                        item.completed ? "checkmark-circle" : "time-outline"
                      }
                      size={16}
                      color={item.completed ? colors.success : colors.warning}
                      style={styles.statusIcon}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: colors.textSecondary },
                      ]}>
                      {item.completed ? "Completed" : "Pending"}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  taskItem: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  taskContent: {
    padding: 16,
  },
  mainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  leftContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  rightContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  taskInfo: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  lockIcon: {
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  dueDate: {
    fontSize: 12,
    fontWeight: "500",
  },
  completeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  completeButtonTouchable: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default TaskItem;
