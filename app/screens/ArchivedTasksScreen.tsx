import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToast } from "../context/ToastContext";
import { useTheme } from "../context/ThemeContext";
import { PRIORITY_COLORS } from "../theme";
import { typography } from "../typography";
import {
  getArchivedTasks,
  unarchiveTask,
} from "../services/taskStorageService";
import { RootStackParamList, Task } from "../types";

type ArchivedTasksScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ArchivedTasks"
>;

const ArchivedTasksScreen: React.FC = () => {
  const navigation = useNavigation<ArchivedTasksScreenNavigationProp>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const loadArchivedTasks = useCallback(async () => {
    setLoading(true);
    try {
      const archivedTasks = await getArchivedTasks();
      // Sort tasks by createdAt date (newest first)
      archivedTasks.sort((a, b) => b.createdAt - a.createdAt);
      setTasks(archivedTasks);
    } catch (error) {
      console.error("Error loading archived tasks:", error);
      Alert.alert("Error", "Failed to load archived tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArchivedTasks();
  }, [loadArchivedTasks]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleTaskPress = (taskId: string) => {
    navigation.navigate("TaskDetails", { taskId });
  };

  const handleUnarchiveTask = async (taskId: string) => {
    try {
      await unarchiveTask(taskId);
      loadArchivedTasks();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Task restored to active tasks", "success");
    } catch (error) {
      console.error("Error unarchiving task:", error);
      Alert.alert("Error", "Failed to restore task");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderItem = ({ item }: { item: Task }) => {
    const categoryColor = item.category ? colors.info : "transparent";

    return (
      <View
        style={[
          styles.taskItem,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}>
        <View style={styles.taskHeader}>
          <View style={styles.taskTitleContainer}>
            <View
              style={[
                styles.priorityIndicator,
                { backgroundColor: getPriorityColor(item.priority) },
              ]}
            />
            <Text
              style={[
                typography.bodySemiBold,
                styles.taskTitle,
                { color: colors.text },
                item.completed && styles.completedText,
              ]}
              numberOfLines={1}>
              {item.title}
            </Text>
          </View>
          {item.completed && (
            <View
              style={[styles.statusBadge, { backgroundColor: colors.success }]}>
              <Text
                style={[
                  typography.captionMedium,
                  styles.statusText,
                  { color: colors.onPrimary },
                ]}>
                Completed
              </Text>
            </View>
          )}
        </View>

        <View style={styles.taskDetails}>
          <View style={styles.taskDetailRow}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text
              style={[
                typography.bodySmall,
                styles.taskDetailText,
                { color: colors.textSecondary },
              ]}>
              Created: {formatDate(item.createdAt)}
            </Text>
          </View>

          {item.dueDate > 0 && (
            <View style={styles.taskDetailRow}>
              <Ionicons
                name="time-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text
                style={[
                  typography.bodySmall,
                  styles.taskDetailText,
                  { color: colors.textSecondary },
                ]}>
                Due: {formatDate(item.dueDate)}
              </Text>
            </View>
          )}

          {item.category && (
            <View style={styles.taskDetailRow}>
              <Ionicons
                name="bookmark-outline"
                size={16}
                color={colors.textSecondary}
              />
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: categoryColor },
                ]}>
                <Text
                  style={[
                    typography.captionMedium,
                    styles.categoryText,
                    { color: colors.onPrimary },
                  ]}>
                  {item.category}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View
          style={[
            styles.actionContainer,
            { borderTopColor: colors.border },
          ]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => handleUnarchiveTask(item.id)}>
            <Ionicons
              name="return-up-back-outline"
              size={18}
              color={colors.onPrimary}
            />
            <Text
              style={[
                typography.bodySmall,
                styles.actionButtonText,
                { color: colors.onPrimary },
              ]}>
              Restore
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
            onPress={() => handleTaskPress(item.id)}>
            <Ionicons name="eye-outline" size={18} color={colors.text} />
            <Text
              style={[
                typography.bodySmall,
                styles.actionButtonText,
                { color: colors.text },
              ]}>
              View
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return PRIORITY_COLORS.high;
      case "normal":
        return PRIORITY_COLORS.normal;
      case "low":
        return PRIORITY_COLORS.low;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
        },
      ]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={[
            typography.title,
            styles.headerTitle,
            { color: colors.text },
          ]}>
          Archived Tasks
        </Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={tasks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="archive-outline"
              size={64}
              color={colors.textSecondary}
            />
            <Text
              style={[
                typography.body,
                styles.emptyText,
                { color: colors.textSecondary },
              ]}>
              {loading
                ? "Loading archived tasks..."
                : "No archived tasks found"}
            </Text>
            <Text
              style={[
                typography.bodySmall,
                styles.emptySubtext,
                { color: colors.textSecondary },
              ]}>
              {!loading && "Complete tasks and archive them to see them here"}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  taskItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  taskTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  taskTitle: {
    flex: 1,
  },
  completedText: {
    textDecorationLine: "line-through",
    opacity: 0.7,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  statusText: {},
  taskDetails: {
    marginTop: 8,
  },
  taskDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  taskDetailText: {
    marginLeft: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  categoryText: {},
  actionContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  actionButtonText: {
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    opacity: 0.7,
  },
});

export default ArchivedTasksScreen;
