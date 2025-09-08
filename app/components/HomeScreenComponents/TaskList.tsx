import { MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { SIZES } from "../../theme";
import { Task, TaskPriority } from "../../types";
import EmptyTasksState from "../common/EmptyTasksState";
import TaskItem from "../common/TaskItem";
import TasksHeader from "./TasksHeader";

type TaskSection = {
  title: string;
  data: Task[];
  count: number;
  priority: TaskPriority;
};

interface TaskListProps {
  tasks: Task[];
  currentDate: Date;
  onDeleteTask: (id: string) => void;
  onToggleTaskCompletion: (id: string) => void;
  onTaskPress: (id: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  currentDate,
  onDeleteTask,
  onToggleTaskCompletion,
  onTaskPress,
}) => {
  const { colors } = useTheme();

  // New state for filter panel toggle
  const [showFilters, setShowFilters] = useState(false);
  // New state for category and priority filtering
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<
    TaskPriority | "all"
  >("all");
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({});

  // Toggle filter panel display
  const toggleFilter = () => {
    setShowFilters((prev) => !prev);
  };

  // Group filtered (active) tasks into sections for the SectionList
  const sections = useMemo(() => {
    // Filter tasks based on selected category and priority
    const filteredTasks = tasks.filter((task) => {
      const matchesCategory =
        selectedCategory === "all" ||
        (task.category || "Uncategorized") === selectedCategory;
      const matchesPriority =
        selectedPriority === "all" || task.priority === selectedPriority;
      return matchesCategory && matchesPriority;
    });

    const activeTasks = filteredTasks.filter((task) => !task.completed);
    const priorityGroups: { [key in TaskPriority]: Task[] } = {
      high: [],
      normal: [],
      low: [],
    };

    activeTasks.forEach((task) => {
      const prio: TaskPriority = priorityGroups.hasOwnProperty(task.priority)
        ? task.priority
        : "normal";
      priorityGroups[prio].push(task);
    });

    const now = currentDate.getTime();
    const sortedSections = Object.entries(priorityGroups)
      .filter(([_, tasks]) => tasks.length > 0)
      .map(([priority, priorityTasks]) => {
        const sortedTasks = [...priorityTasks].sort((a, b) => {
          const aIsOverdue = a.dueDate && a.dueDate < now;
          const bIsOverdue = b.dueDate && b.dueDate < now;
          if (aIsOverdue && !bIsOverdue) return -1;
          if (!aIsOverdue && bIsOverdue) return 1;
          if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
          if (a.dueDate && !b.dueDate) return -1;
          if (!a.dueDate && b.dueDate) return 1;
          return 0;
        });

        let title;
        switch (priority) {
          case "high":
            title = "Do First";
            break;
          case "normal":
            title = "Do Next";
            break;
          case "low":
            title = "Do Later";
            break;
          default:
            title = "Tasks";
        }

        return {
          title,
          data: sortedTasks,
          count: sortedTasks.length,
          priority: priority as TaskPriority,
        };
      });

    return sortedSections;
  }, [tasks, selectedCategory, selectedPriority, currentDate]);

  // Initially expand all sections
  useEffect(() => {
    if (sections.length > 0 && Object.keys(expandedSections).length === 0) {
      const newExpandedSections: { [key: string]: boolean } = {};
      sections.forEach((section) => {
        newExpandedSections[section.title] = true;
      });
      setExpandedSections(newExpandedSections);
    }
  }, [sections]);

  // Helper: Return a color based on task priority
  const getPrioritySectionColor = (priority: TaskPriority) => {
    switch (priority) {
      case "high":
        return colors.error;
      case "normal":
        return colors.warning;
      case "low":
        return colors.success;
      default:
        return colors.primary;
    }
  };

  // Render header for each section in SectionList
  const renderSectionHeader = useCallback(
    ({ section }: { section: TaskSection }) => {
      const isExpanded = expandedSections[section.title] || false;
      const priorityColor = getPrioritySectionColor(section.priority);

      return (
        <TouchableOpacity
          style={[
            styles.sectionHeader,
            {
              backgroundColor: colors.background + "F8",
              borderBottomColor: colors.border,
            },
          ]}
          onPress={() =>
            setExpandedSections((prev) => ({
              ...prev,
              [section.title]: !prev[section.title],
            }))
          }
          activeOpacity={0.7}>
          <View style={styles.sectionHeaderLeft}>
            <View
              style={[
                styles.priorityIndicator,
                { backgroundColor: priorityColor },
              ]}
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {section.title}
            </Text>
            <View
              style={[
                styles.sectionBadge,
                { backgroundColor: priorityColor + "20" },
              ]}>
              <Text style={[styles.sectionCount, { color: colors.primary }]}>
                {section.count}
              </Text>
            </View>
          </View>
          <MaterialIcons
            name={isExpanded ? "keyboard-arrow-down" : "keyboard-arrow-up"}
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      );
    },
    [expandedSections, colors]
  );

  // Render the main header for TaskList
  const renderTasksHeader = () => (
    <TasksHeader
      tasks={tasks}
      showFilters={showFilters}
      selectedCategory={selectedCategory}
      selectedPriority={selectedPriority}
      onToggleFilter={toggleFilter}
      onCategoryChange={setSelectedCategory}
      onPriorityChange={setSelectedPriority}
    />
  );

  if (tasks.length === 0) {
    return (
      <EmptyTasksState
        title="No tasks"
        subtitle="Tap the + button to add a new task"
        icon="calendar-outline"
      />
    );
  }

  return (
    <SectionList
      contentContainerStyle={styles.taskList}
      sections={sections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={renderSectionHeader}
      stickySectionHeadersEnabled
      ListHeaderComponent={renderTasksHeader}
      renderItem={({ item, index, section }) => {
        if (!expandedSections[section.title]) return null;
        const isOverdue = Boolean(
          item.dueDate && item.dueDate < currentDate.getTime()
        );
        const prereqsMet =
          !item.predecessorIds ||
          item.predecessorIds.length === 0 ||
          item.predecessorIds.every(
            (predId) => tasks.find((t) => t.id === predId)?.completed
          );
        return (
          <TaskItem
            item={item}
            index={index}
            totalTasks={section.data.length}
            allTasks={tasks}
            onDelete={onDeleteTask}
            onToggleComplete={onToggleTaskCompletion}
            onPress={onTaskPress}
            isOverdue={isOverdue}
            arePrereqsMet={prereqsMet}
            priority={section.priority}
            mode="home"
            showSwipeActions={true}
            showAnimations={true}
          />
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SIZES.small,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SIZES.small,
  },
  sectionTitle: {
    fontSize: SIZES.medium,
    fontWeight: "600",
  },
  sectionBadge: {
    paddingHorizontal: SIZES.small,
    paddingVertical: SIZES.small,
    borderRadius: 10,
    marginLeft: SIZES.small,
  },
  sectionCount: {
    fontSize: SIZES.small,
    fontWeight: "600",
  },
  taskList: {
    paddingHorizontal: SIZES.medium,
  },
});

export default TaskList;
