import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { SIZES } from "../../theme";
import { Task } from "../../types";

interface PrerequisitesListProps {
  task: Task;
  relatedTasks: Task[];
  onTaskPress: (taskId: string) => void;
}

const PrerequisitesList: React.FC<PrerequisitesListProps> = ({
  task,
  relatedTasks,
  onTaskPress,
}) => {
  const { colors } = useTheme();

  if (!task?.predecessorIds || task.predecessorIds.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionContainer}>
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
              },
            ]}
            onPress={() => onTaskPress(prereqTask.id)}
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

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: SIZES.medium,
  },
  sectionTitle: {
    fontSize: SIZES.medium,
    fontWeight: "600",
  },
  prerequisitesContainer: {
    marginTop: SIZES.small,
  },
  prerequisiteItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: SIZES.small,
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
});

export default PrerequisitesList;

