import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PrerequisitesList from "../components/TaskDetailsComponents/PrerequisitesList";
import TaskMetadata from "../components/TaskDetailsComponents/TaskMetadata";
import TaskStatusBanner from "../components/TaskDetailsComponents/TaskStatusBanner";
import ScreenHeader from "../components/common/ScreenHeader";
import { useTheme } from "../context/ThemeContext";
import { useTaskDetails } from "../hooks/useTaskDetails";
import { useTaskDetailsAnimations } from "../hooks/useTaskDetailsAnimations";
import { SIZES } from "../theme";
import { RootStackParamList } from "../types";
import { getPriorityColor } from "../utils/taskUtils";

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

  const [expandedDescription, setExpandedDescription] = useState(false);

  const {
    task,
    loading,
    relatedTasks,
    handleToggleComplete,
    handleEdit,
    handleDelete,
  } = useTaskDetails(taskId);

  const { statusOpacity, detailsOpacity, animateStatusToggle } =
    useTaskDetailsAnimations(task);

  const handleTaskPress = (relatedTaskId: string) => {
    navigation.push("TaskDetails", { taskId: relatedTaskId });
  };

  const handleToggleCompleteWithAnimation = async () => {
    await handleToggleComplete();
    animateStatusToggle();
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
          <TouchableOpacity
            onPress={handleEdit}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.editButton}
            activeOpacity={0.7}>
            <Ionicons name="pencil" size={22} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Status Banner */}
        <TaskStatusBanner task={task} opacity={statusOpacity} />

        {/* Title and Priority */}
        <View style={styles.titleContainer}>
          <Text style={[styles.taskTitle, { color: colors.text }]}>
            {task.title}
          </Text>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(task.priority, colors) },
            ]}>
            <Text style={styles.priorityText}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Text>
          </View>
        </View>

        {/* Task Metadata */}
        <Animated.View style={{ opacity: detailsOpacity }}>
          <TaskMetadata task={task} />
        </Animated.View>

        {/* Description */}
        {task.description ? (
          <Animated.View
            style={[
              styles.descriptionContainer,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: detailsOpacity,
              },
            ]}>
            <View style={styles.descriptionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Description
              </Text>
              {task.description.length > 100 && (
                <TouchableOpacity
                  onPress={() => setExpandedDescription(!expandedDescription)}
                  style={styles.expandButton}>
                  <Text
                    style={[
                      styles.expandButtonText,
                      { color: colors.primary },
                    ]}>
                    {expandedDescription ? "Show Less" : "Show More"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <Text
              style={[styles.descriptionText, { color: colors.text }]}
              numberOfLines={expandedDescription ? undefined : 4}>
              {task.description}
            </Text>
          </Animated.View>
        ) : null}

        {/* Prerequisites */}
        <Animated.View style={{ opacity: detailsOpacity }}>
          <PrerequisitesList
            task={task}
            relatedTasks={relatedTasks}
            onTaskPress={handleTaskPress}
          />
        </Animated.View>
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
          activeOpacity={0.7}
          accessibilityLabel="Delete task"
          accessibilityRole="button">
          <Ionicons name="trash-outline" size={22} color={colors.error} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            {
              backgroundColor: task.completed ? colors.success : colors.primary,
            },
          ]}
          onPress={handleToggleCompleteWithAnimation}
          activeOpacity={0.7}
          accessibilityLabel={
            task.completed ? "Mark as incomplete" : "Mark as complete"
          }
          accessibilityRole="button">
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
  titleContainer: {
    marginBottom: SIZES.medium,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: SIZES.small,
  },
  priorityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: SIZES.medium,
    paddingVertical: SIZES.small / 2,
    borderRadius: 16,
  },
  priorityText: {
    color: "white",
    fontSize: SIZES.font,
    fontWeight: "600",
  },
  descriptionContainer: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: SIZES.medium,
    padding: SIZES.medium,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  descriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.small,
  },
  sectionTitle: {
    fontSize: SIZES.medium,
    fontWeight: "600",
  },
  expandButton: {
    padding: SIZES.small / 2,
  },
  expandButtonText: {
    fontSize: SIZES.font - 2,
    fontWeight: "500",
  },
  descriptionText: {
    fontSize: SIZES.font,
    lineHeight: SIZES.medium * 1.3,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.medium,
    paddingVertical: SIZES.medium,
    borderTopWidth: 1,
    elevation: 8,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  deleteButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SIZES.medium,
    paddingHorizontal: SIZES.large,
    borderRadius: 25,
    marginLeft: SIZES.medium,
  },
  toggleButtonText: {
    color: "white",
    fontSize: SIZES.font,
    fontWeight: "600",
    marginRight: SIZES.small,
  },
  editButton: {
    padding: SIZES.small / 2,
  },
});

export default TaskDetailsScreen;
