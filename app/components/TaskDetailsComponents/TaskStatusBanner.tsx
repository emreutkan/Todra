import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { SIZES } from "../../theme";
import { Task } from "../../types";
import { isOverdue } from "../../utils/taskUtils";

interface TaskStatusBannerProps {
  task: Task;
  opacity: Animated.Value;
}

const TaskStatusBanner: React.FC<TaskStatusBannerProps> = ({
  task,
  opacity,
}) => {
  const { colors } = useTheme();

  const getStatusInfo = () => {
    if (task.completed) {
      return {
        icon: "checkmark-circle",
        text: "Completed",
        backgroundColor: colors.success + "20",
        borderColor: colors.success,
        textColor: colors.success,
      };
    } else if (isOverdue(task.dueDate, task)) {
      return {
        icon: "alert-circle",
        text: "Overdue",
        backgroundColor: colors.error + "20",
        borderColor: colors.error,
        textColor: colors.error,
      };
    } else {
      return {
        icon: "time-outline",
        text: "In Progress",
        backgroundColor: colors.warning + "20",
        borderColor: colors.warning,
        textColor: colors.warning,
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Animated.View
      style={[
        styles.statusBanner,
        {
          backgroundColor: statusInfo.backgroundColor,
          borderColor: statusInfo.borderColor,
          opacity: opacity,
        },
      ]}>
      <Ionicons
        name={statusInfo.icon as any}
        size={18}
        color={statusInfo.textColor}
      />
      <Text style={[styles.statusText, { color: statusInfo.textColor }]}>
        {statusInfo.text}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SIZES.small,
    paddingHorizontal: SIZES.medium,
    borderRadius: 12,
    marginBottom: SIZES.medium,
    borderWidth: 1,
  },
  statusText: {
    fontSize: SIZES.font,
    fontWeight: "600",
    marginLeft: SIZES.small / 2,
  },
});

export default TaskStatusBanner;

