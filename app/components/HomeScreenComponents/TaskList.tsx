import { MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Animated,
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
  scrollY?: Animated.Value;
  taskOpacity?: Animated.Value;
  loading?: boolean;
  onRefresh?: () => void;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  currentDate,
  onDeleteTask,
  onToggleTaskCompletion,
  onTaskPress,
  scrollY,
}) => {
  const { colors } = useTheme();
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({});

  // Group filtered (active) tasks into sections for the SectionList
  const sections = useMemo(() => {
    const activeTasks = tasks.filter((task) => !task.completed);
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
  }, [tasks, currentDate]);

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
          </View>
          {isExpanded ? (
            <Text style={[styles.sectionCount, { color: colors.text }]}>
              {section.count}
            </Text>
          ) : (
            <MaterialIcons
              name={"keyboard-arrow-up"}
              size={24}
              color={colors.text}
            />
          )}
        </TouchableOpacity>
      );
    },
    [expandedSections, colors]
  );

  // Render a simple progress header
  const renderTasksHeader = () => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const remaining = total - completed;
    return (
      <View
        style={[
          styles.progressSection,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Completed
            </Text>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {completed}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Remaining
            </Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {remaining}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {total}
            </Text>
          </View>
        </View>
      </View>
    );
  };

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
      scrollEventThrottle={16}
      onScroll={
        scrollY
          ? Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )
          : undefined
      }
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
            showSwipeActions={false}
            showAnimations={true}
          />
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  taskList: {
    marginHorizontal: SIZES.medium,
  },
  progressSection: {
    paddingVertical: SIZES.small,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    flex: 1,
  },

  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: SIZES.small,
    marginBottom: SIZES.small,
  },
  statValue: {
    fontSize: SIZES.medium,
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    opacity: 0.2,
    backgroundColor: "rgba(0,0,0,0.2)",
  },

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
});

export default TaskList;
