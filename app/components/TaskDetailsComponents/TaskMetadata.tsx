import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { SIZES } from "../../theme";
import { Task } from "../../types";
import { formatDate, formatTime, isOverdue } from "../../utils/taskUtils";

interface TaskMetadataProps {
  task: Task;
}

const TaskMetadata: React.FC<TaskMetadataProps> = ({ task }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.metadataContainer,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}>
      <View style={styles.metadataRow}>
        <View style={styles.metadataItem}>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <View style={styles.metadataTextContainer}>
            <Text
              style={[styles.metadataLabel, { color: colors.textSecondary }]}>
              Due Date
            </Text>
            <Text
              style={[
                styles.metadataValue,
                {
                  color: isOverdue(task.dueDate, task)
                    ? colors.error
                    : colors.text,
                },
              ]}>
              {formatDate(task.dueDate)}
            </Text>
          </View>
        </View>
        <View style={styles.metadataItem}>
          <Ionicons name="time-outline" size={18} color={colors.primary} />
          <View style={styles.metadataTextContainer}>
            <Text
              style={[styles.metadataLabel, { color: colors.textSecondary }]}>
              Time
            </Text>
            <Text
              style={[
                styles.metadataValue,
                {
                  color: isOverdue(task.dueDate, task)
                    ? colors.error
                    : colors.text,
                },
              ]}>
              {formatTime(task.dueDate)}
            </Text>
          </View>
        </View>
      </View>

      <View
        style={[styles.metadataDivider, { backgroundColor: colors.border }]}
      />

      <View style={styles.metadataRow}>
        <View style={styles.metadataItem}>
          <Ionicons name="folder-outline" size={18} color={colors.primary} />
          <View style={styles.metadataTextContainer}>
            <Text
              style={[styles.metadataLabel, { color: colors.textSecondary }]}>
              Category
            </Text>
            <Text style={[styles.metadataValue, { color: colors.text }]}>
              {task.category || "Uncategorized"}
            </Text>
          </View>
        </View>
        <View style={styles.metadataItem}>
          <Ionicons name="create-outline" size={18} color={colors.primary} />
          <View style={styles.metadataTextContainer}>
            <Text
              style={[styles.metadataLabel, { color: colors.textSecondary }]}>
              Created
            </Text>
            <Text style={[styles.metadataValue, { color: colors.text }]}>
              {formatDate(task.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  metadataContainer: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: SIZES.medium,
    overflow: "hidden",
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  metadataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: SIZES.medium,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  metadataTextContainer: {
    marginLeft: SIZES.small,
  },
  metadataLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  metadataValue: {
    fontSize: SIZES.font,
    fontWeight: "500",
  },
  metadataDivider: {
    height: 1,
    width: "100%",
  },
});

export default TaskMetadata;

