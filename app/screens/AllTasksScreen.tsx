import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import CategoryTabs from "../components/AllTasksComponents/CategoryTabs";
import EmptyTasksState from "../components/common/EmptyTasksState";
import ScreenHeader from "../components/common/ScreenHeader";
import TaskItem from "../components/common/TaskItem";
import { useTheme } from "../context/ThemeContext";
import { useAllTasks } from "../hooks/useAllTasks";
import { RootStackParamList, Task } from "../types";

type AllTasksScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AllTasks"
>;

const AllTasksScreen: React.FC = () => {
  const navigation = useNavigation<AllTasksScreenNavigationProp>();
  const { colors, isDark } = useTheme();
  const {
    currentTasks,
    archivedTasks,
    selectedCategory,
    setSelectedCategory,
    handleArchiveAllCompleted,
    handleTaskPress,
    handleBackPress,
  } = useAllTasks();

  const renderTaskItem = ({ item }: { item: Task }) => (
    <TaskItem
      item={item}
      onPress={(taskId: string) => {
        const task = { id: taskId } as Task;
        handleTaskPress(task);
      }}
      mode="all-tasks"
      showSwipeActions={false}
      showAnimations={false}
    />
  );

  const renderEmptyComponent = () => (
    <EmptyTasksState
      title={
        selectedCategory === "current" ? "No active tasks" : "No archived tasks"
      }
      subtitle={
        selectedCategory === "current"
          ? "Add a new task to get started"
          : "Completed tasks will appear here"
      }
      icon={
        selectedCategory === "current" ? "document-outline" : "archive-outline"
      }
    />
  );

  const currentTasksData =
    selectedCategory === "current" ? currentTasks : archivedTasks;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <ScreenHeader
        title="All Tasks"
        showBackButton={true}
        onBackPress={handleBackPress}
        rightComponent={
          selectedCategory === "current" ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleArchiveAllCompleted}
              accessibilityLabel="Archive completed tasks">
              <Ionicons
                name="archive-outline"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          ) : null
        }
      />

      {/* Category Tabs */}
      <CategoryTabs
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Tasks List */}
      <FlatList
        data={currentTasksData}
        keyExtractor={(item) => item.id}
        renderItem={renderTaskItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyComponent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...Platform.select({
      ios: {
        paddingTop: 50,
      },
      android: {
        paddingTop: 25,
      },
    }),
  },
  actionButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
});

export default AllTasksScreen;
