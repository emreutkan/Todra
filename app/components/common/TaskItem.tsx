import { Ionicons } from "@expo/vector-icons";
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  format,
} from "date-fns";
import React, { useEffect, useMemo, useRef, useCallback } from "react";
import * as Haptics from "expo-haptics";
import {
  Alert,
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useTheme } from "../../context/ThemeContext";
import { Task, TaskPriority } from "../../types";
import { typography } from "../../typography";
import { formatDate } from "../../utils/taskUtils";

interface TaskItemProps {
  item: Task;
  index?: number;
  onDelete?: (id: string) => void;
  onToggleComplete?: (id: string) => void;
  onPress: (id: string) => void;
  isOverdue?: boolean;
  arePrereqsMet?: boolean;
  priority?: TaskPriority;
  /** Different layouts/labels for home vs all-tasks. */
  mode?: "home" | "all-tasks";
  /** Entrance opacity/scale animation (still skipped when reduce motion is on). */
  showAnimations?: boolean;
}

/** Checkbox “depresses” on press; row scales slightly for tactile card press. */
const PRESS_SCALE_CHECKBOX = 0.88;
const PRESS_SCALE_ROW = 0.985;

const TaskItem: React.FC<TaskItemProps> = ({
  item,
  index = 0,
  onDelete: _onDelete,
  onToggleComplete,
  onPress,
  isOverdue = false,
  arePrereqsMet = true,
  priority: _priority,
  mode = "home",
  showAnimations = true,
}) => {
  const { colors } = useTheme();
  const reduceMotionEnabled = useReducedMotion();

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const rowCardPressAnim = useRef(new Animated.Value(1)).current;
  const checkPopScale = useRef(
    new Animated.Value(item.completed ? 1 : 0)
  ).current;
  const prevCompletedRef = useRef(item.completed);

  const shouldAnimateEntrance =
    showAnimations && !reduceMotionEnabled;

  // Entrance animation (skipped when showAnimations is false or reduce motion is on)
  useEffect(() => {
    if (shouldAnimateEntrance) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          delay: index * 50,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 420,
          delay: index * 45,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      opacity.setValue(1);
      scale.setValue(1);
    }
  }, [index, shouldAnimateEntrance, opacity, scale]);

  // One-shot checkmark pop when task flips to completed (skipped with reduce motion)
  useEffect(() => {
    const becameComplete =
      item.completed && !prevCompletedRef.current;
    prevCompletedRef.current = item.completed;

    if (!item.completed) {
      checkPopScale.setValue(0);
      return;
    }

    if (reduceMotionEnabled) {
      checkPopScale.setValue(1);
      return;
    }

    if (becameComplete) {
      checkPopScale.setValue(0);
      Animated.spring(checkPopScale, {
        toValue: 1,
        friction: 7,
        tension: 140,
        useNativeDriver: true,
      }).start();
    } else {
      checkPopScale.setValue(1);
    }
  }, [item.completed, reduceMotionEnabled, checkPopScale]);

  // Format due date based on mode
  const formatDueDate = (dueDate: number) => {
    if (mode === "all-tasks") {
      return formatDate(dueDate);
    }

    const date = new Date(dueDate);
    const now = new Date();
    const timeString = format(date, "h:mm a");

    const diffMinutes = differenceInMinutes(date, now);
    const diffHours = differenceInHours(date, now);
    const diffDays = differenceInDays(date, now);

    let relativeTime = "";

    if (diffMinutes < 0) {
      // Past due
      const pastMinutes = Math.abs(diffMinutes);
      const pastHours = Math.abs(diffHours);
      const pastDays = Math.abs(diffDays);

      if (pastDays > 0) {
        relativeTime = `(overdue by ${pastDays} day${pastDays > 1 ? "s" : ""})`;
      } else if (pastHours > 0) {
        relativeTime = `(overdue by ${pastHours} hour${
          pastHours > 1 ? "s" : ""
        })`;
      } else {
        relativeTime = `(overdue by ${pastMinutes} min${
          pastMinutes > 1 ? "s" : ""
        })`;
      }
    } else {
      // Future
      if (diffDays > 0) {
        relativeTime = `(due in ${diffDays} day${diffDays > 1 ? "s" : ""})`;
      } else if (diffHours > 0) {
        relativeTime = `(due in ${diffHours} hour${diffHours > 1 ? "s" : ""})`;
      } else if (diffMinutes > 0) {
        relativeTime = `(due in ${diffMinutes} min${
          diffMinutes > 1 ? "s" : ""
        })`;
      } else {
        relativeTime = "(due now)";
      }
    }

    return `${timeString} ${relativeTime}`;
  };

  // Priority color is not currently used in the UI

  // Check if task is overdue
  const taskIsOverdue =
    isOverdue || (!item.completed && item.dueDate < Date.now());

  const mainAccessibilityLabel = useMemo(() => {
    const completion = item.completed ? "Completed" : "Not completed";
    const overdue = taskIsOverdue ? "Overdue. " : "";
    const due = formatDueDate(item.dueDate);
    return `${item.title}. ${completion}. ${overdue}${due}`;
  }, [
    item.title,
    item.completed,
    taskIsOverdue,
    item.dueDate,
    mode,
  ]);

  // Handle task press
  const handlePress = () => {
    // Always allow navigation to task details - users should be able to see what prerequisites are needed
    onPress(item.id);
  };

  // Handle toggle completion
  const handleToggleComplete = () => {
    // In home mode, check prerequisites before allowing completion
    if (mode === "home" && !arePrereqsMet && !item.completed) {
      Alert.alert(
        "Prerequisites Required",
        "Complete the prerequisite tasks first.",
        [{ text: "OK" }]
      );
      return;
    }

    if (onToggleComplete) {
      if (!item.completed) {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      } else {
        void Haptics.selectionAsync();
      }
      onToggleComplete(item.id);
    }
  };

  const handleCheckboxPressIn = () => {
    if (reduceMotionEnabled) {
      pressAnim.setValue(PRESS_SCALE_CHECKBOX);
    } else {
      Animated.timing(pressAnim, {
        toValue: PRESS_SCALE_CHECKBOX,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  };

  const handleCheckboxPressOut = () => {
    if (reduceMotionEnabled) {
      pressAnim.setValue(1);
    } else {
      Animated.spring(pressAnim, {
        toValue: 1,
        friction: 8,
        tension: 220,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleRowPressIn = useCallback(() => {
    if (reduceMotionEnabled) {
      return;
    }
    Animated.timing(rowCardPressAnim, {
      toValue: PRESS_SCALE_ROW,
      duration: 100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [reduceMotionEnabled, rowCardPressAnim]);

  const handleRowPressOut = useCallback(() => {
    if (reduceMotionEnabled) {
      return;
    }
    Animated.spring(rowCardPressAnim, {
      toValue: 1,
      friction: 9,
      tension: 420,
      useNativeDriver: true,
    }).start();
  }, [reduceMotionEnabled, rowCardPressAnim]);

  return (
    <Animated.View
      style={[
        {
          opacity,
          transform: [{ scale }],
        },
      ]}>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.taskItem,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: item.completed ? 0.7 : 1,
              transform: [{ scale: rowCardPressAnim }],
            },
            taskIsOverdue && {
              borderColor: colors.error,
              backgroundColor: colors.error + "08",
            },
          ]}>
          <View style={styles.taskContent}>
            <View style={styles.mainRow}>
              {mode === "home" && onToggleComplete && (
                <Animated.View
                  style={[
                    styles.completeButton,
                    styles.completeButtonAlign,
                    {
                      backgroundColor: item.completed
                        ? colors.success
                        : !arePrereqsMet && !item.completed
                        ? colors.disabled
                        : colors.surface,
                      borderColor: item.completed
                        ? colors.success
                        : !arePrereqsMet && !item.completed
                        ? colors.disabled
                        : colors.border,
                      transform: [{ scale: pressAnim }],
                      opacity: !arePrereqsMet && !item.completed ? 0.5 : 1,
                    },
                  ]}>
                  {item.completed && (
                    <Animated.View
                      style={[
                        styles.checkmarkIcon,
                        { transform: [{ scale: checkPopScale }] },
                      ]}
                      pointerEvents="none">
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={colors.onPrimary}
                      />
                    </Animated.View>
                  )}
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={handleToggleComplete}
                    onPressIn={handleCheckboxPressIn}
                    onPressOut={handleCheckboxPressOut}
                    style={styles.completeButtonTouchable}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="checkbox"
                    accessibilityLabel={
                      item.completed ? "Mark incomplete" : "Mark complete"
                    }
                    accessibilityState={{
                      checked: item.completed,
                      disabled: !arePrereqsMet && !item.completed,
                    }}
                  />
                </Animated.View>
              )}

              <TouchableOpacity
                style={styles.mainTaskPressable}
                onPress={handlePress}
                onPressIn={handleRowPressIn}
                onPressOut={handleRowPressOut}
                activeOpacity={0.92}
                accessibilityRole="button"
                accessibilityLabel={mainAccessibilityLabel}>
                <View style={styles.taskInfo}>
                  <View style={styles.titleRow}>
                    <Text
                      style={[
                        typography.bodySemiBold,
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
                    <View style={styles.titleIcons}>
                      {item.isRecurring && (
                        <Ionicons
                          name="repeat"
                          size={16}
                          color={colors.primary}
                          style={styles.repeatIcon}
                        />
                      )}
                      {mode === "home" && !arePrereqsMet && (
                        <Ionicons
                          name="lock-closed"
                          size={16}
                          color={colors.warning}
                          style={styles.lockIcon}
                        />
                      )}
                    </View>
                  </View>

                  {item.description && (
                    <Text
                      style={[
                        typography.bodySmall,
                        styles.description,
                        { color: colors.textSecondary },
                      ]}
                      numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}

                  <Text
                    style={[
                      typography.captionMedium,
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
                          typography.captionMedium,
                          styles.statusText,
                          { color: colors.textSecondary },
                        ]}>
                        {item.completed ? "Completed" : "Pending"}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
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
  mainTaskPressable: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
    justifyContent: "space-between",
    marginBottom: 8,
  },
  taskTitle: {
    flex: 1,
    marginRight: 8,
  },
  titleIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  repeatIcon: {
    marginLeft: 4,
  },
  lockIcon: {
    marginLeft: 4,
  },
  description: {
    marginBottom: 8,
  },
  dueDate: {},
  completeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  completeButtonAlign: {
    alignSelf: "center",
  },
  completeButtonTouchable: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
  },
  checkmarkIcon: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {},
});

export default TaskItem;
