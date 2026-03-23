import { format } from "date-fns";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { SIZES } from "../../theme";
import { Task } from "../../types";
import { typography } from "../../typography";
import FormSection from "./FormSection";

interface PredecessorTaskSelectorProps {
  availableTasks: Task[];
  selectedPredecessors: string[];
  onSelectPredecessor: (taskId: string) => void;
}

const PredecessorTaskSelector: React.FC<PredecessorTaskSelectorProps> = ({
  availableTasks,
  selectedPredecessors,
  onSelectPredecessor,
}) => {
  const { colors } = useTheme();
  const [showModal, setShowModal] = useState(false);

  // Filter tasks to only show non-overdue tasks (have time to complete)
  const nonOverdueTasks = availableTasks.filter((task) => {
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    return dueDate > now && !task.completed;
  });

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const getSelectedCount = () => {
    return selectedPredecessors.length;
  };

  const getSelectedTasksText = () => {
    const count = getSelectedCount();
    if (count === 0) {
      return "None selected — tap to choose";
    }
    if (count === 1) {
      return "1 task must be done first";
    }
    return `${count} tasks must be done first`;
  };

  const styles = StyleSheet.create({
    container: {},
    button: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: SIZES.base,
      paddingVertical: SIZES.medium,
      paddingHorizontal: SIZES.medium,
      minHeight: 48,
      backgroundColor: colors.card,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    buttonText: {
      flex: 1,
    },
    title: {
      ...typography.bodySemiBold,
      color: colors.text,
      marginBottom: 4,
    },
    subtitle: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    arrow: {
      ...typography.headline,
      color: colors.textSecondary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlayScrim,
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
    },
    modalContainer: {
      width: "100%",
      maxWidth: 500,
      maxHeight: "80%",
      backgroundColor: colors.background,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    modalHeader: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    modalTitle: {
      ...typography.headline,
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    closeButtonText: {
      ...typography.headline,
      color: colors.text,
    },
    modalContent: {
      padding: 16,
    },
    modalSubtitle: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    taskList: {
      maxHeight: 400,
    },
    taskItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 12,
      minHeight: 52,
      borderRadius: 8,
      backgroundColor: colors.card,
      marginBottom: 8,
      justifyContent: "space-between",
    },
    taskItemSelected: {
      backgroundColor: colors.primary + "20",
      borderWidth: 1,
      borderColor: colors.primary,
    },
    taskInfo: {
      flex: 1,
      marginRight: 12,
    },
    taskTitle: {
      ...typography.bodyMedium,
      color: colors.text,
      marginBottom: 4,
    },
    taskDetails: {
      flexDirection: "row",
      alignItems: "center",
    },
    taskCategory: {
      ...typography.caption,
      color: colors.textSecondary,
      marginRight: 8,
    },
    taskDueDate: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxSelected: {
      backgroundColor: colors.primary,
    },
    checkmark: {
      ...typography.bodySmallBold,
      color: colors.background,
    },
    emptyState: {
      padding: 32,
      alignItems: "center",
    },
    emptyStateText: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: "center",
    },
  });

  return (
    <View style={styles.container}>
      <FormSection title="Must complete first">
        <TouchableOpacity
          style={styles.button}
          onPress={handleOpenModal}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Choose prerequisite tasks"
          accessibilityHint="Opens a list of tasks that must be finished before this one">
          <View style={styles.buttonText}>
            <Text style={styles.title}>Choose tasks</Text>
            <Text style={styles.subtitle}>{getSelectedTasksText()}</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </FormSection>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}>
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: colors.border },
              ]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Tasks to finish first
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseModal}
                accessibilityLabel="Close"
                accessibilityRole="button"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={[styles.closeButtonText, { color: colors.text }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text
                style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Finish these before you can complete this task.
              </Text>

              {nonOverdueTasks.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text
                    style={[
                      styles.emptyStateText,
                      { color: colors.textSecondary },
                    ]}>
                    No other open tasks with a future due date.
                  </Text>
                </View>
              ) : (
                <ScrollView style={styles.taskList}>
                  {nonOverdueTasks.map((task) => (
                    <TouchableOpacity
                      key={task.id}
                      style={[
                        styles.taskItem,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                        selectedPredecessors.includes(task.id) &&
                          styles.taskItemSelected,
                      ]}
                      onPress={() => onSelectPredecessor(task.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{
                        checked: selectedPredecessors.includes(task.id),
                      }}
                      accessibilityLabel={`${task.title}, due ${format(
                        new Date(task.dueDate),
                        "MMM d"
                      )}`}>
                      <View style={styles.taskInfo}>
                        <Text
                          style={[styles.taskTitle, { color: colors.text }]}
                          numberOfLines={2}>
                          {task.title}
                        </Text>
                        <View style={styles.taskDetails}>
                          <Text
                            style={[
                              styles.taskCategory,
                              { color: colors.textSecondary },
                            ]}
                            numberOfLines={1}>
                            {task.category}
                          </Text>
                          <Text
                            style={[
                              styles.taskDueDate,
                              { color: colors.textSecondary },
                            ]}>
                            Due:{" "}
                            {format(new Date(task.dueDate), "MMM d, h:mm a")}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.checkbox,
                          { borderColor: colors.border },
                          selectedPredecessors.includes(task.id) && [
                            styles.checkboxSelected,
                            {
                              backgroundColor: colors.primary,
                              borderColor: colors.primary,
                            },
                          ],
                        ]}>
                        {selectedPredecessors.includes(task.id) && (
                          <Text
                            style={[
                              styles.checkmark,
                              { color: colors.onPrimary },
                            ]}>
                            ✓
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PredecessorTaskSelector;
