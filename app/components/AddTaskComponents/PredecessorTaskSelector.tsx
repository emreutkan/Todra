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
      return "No predecessor tasks selected";
    } else if (count === 1) {
      return "1 predecessor task selected";
    } else {
      return `${count} predecessor tasks selected`;
    }
  };

  const styles = StyleSheet.create({
    container: {
      marginTop: SIZES.medium,
    },
    button: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: SIZES.base,
      padding: SIZES.medium,
      backgroundColor: colors.card,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    buttonText: {
      flex: 1,
    },
    title: {
      fontSize: SIZES.medium,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: SIZES.small,
      color: colors.textSecondary,
    },
    arrow: {
      fontSize: 18,
      color: colors.textSecondary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
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
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    closeButtonText: {
      fontSize: 18,
      color: colors.text,
    },
    modalContent: {
      padding: 16,
    },
    modalSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    taskList: {
      maxHeight: 400,
    },
    taskItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
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
      fontSize: 16,
      color: colors.text,
      fontWeight: "500",
      marginBottom: 4,
    },
    taskDetails: {
      flexDirection: "row",
      alignItems: "center",
    },
    taskCategory: {
      fontSize: 12,
      color: colors.textSecondary,
      marginRight: 8,
    },
    taskDueDate: {
      fontSize: 12,
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
      color: colors.background,
      fontSize: 16,
      fontWeight: "bold",
    },
    emptyState: {
      padding: 32,
      alignItems: "center",
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={handleOpenModal}
        activeOpacity={0.7}>
        <View style={styles.buttonText}>
          <Text style={styles.title}>Predecessor Tasks</Text>
          <Text style={styles.subtitle}>{getSelectedTasksText()}</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

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
                Select Predecessor Tasks
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseModal}>
                <Text style={[styles.closeButtonText, { color: colors.text }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text
                style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                These tasks must be completed before this task can be marked as
                complete
              </Text>

              {nonOverdueTasks.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text
                    style={[
                      styles.emptyStateText,
                      { color: colors.textSecondary },
                    ]}>
                    No available tasks to select as predecessors
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
                      onPress={() => onSelectPredecessor(task.id)}>
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
