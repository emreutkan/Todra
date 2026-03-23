import { MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Animated,
  LayoutAnimation,
  Platform,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { useSettings } from "../../context/SettingsContext";
import { useTheme } from "../../context/ThemeContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { typography } from "../../typography";
import { SIZES } from "../../theme";
import { Task, TaskPriority } from "../../types";
import EmptyTasksState from "../common/EmptyTasksState";
import TaskItem from "../common/TaskItem";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  listEntranceOpacity: Animated.Value;
  listEntranceTranslateY: Animated.Value;
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
  listEntranceOpacity,
  listEntranceTranslateY,
}) => {
  const { colors } = useTheme();
  const { settings } = useSettings();
  const reducedMotion = useReducedMotion();
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({});

  // Group filtered tasks into sections for the SectionList
  const sections = useMemo(() => {
    // Filter tasks based on showCompletedTasks setting
    const filteredTasks = settings.showCompletedTasks
      ? tasks
      : tasks.filter((task) => !task.completed);

    const priorityGroups: { [key in TaskPriority]: Task[] } = {
      high: [],
      normal: [],
      low: [],
    };

    filteredTasks.forEach((task) => {
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
  }, [tasks, currentDate, settings.showCompletedTasks]);

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
              backgroundColor: colors.surface,
              borderBottomColor: colors.hairline,
            },
          ]}
          accessibilityRole="button"
          accessibilityState={{ expanded: isExpanded }}
          accessibilityLabel={`${section.title}, ${section.count} task${
            section.count === 1 ? "" : "s"
          }, ${isExpanded ? "expanded" : "collapsed"}`}
          accessibilityHint={
            isExpanded
              ? "Double tap to collapse this section"
              : "Double tap to expand this section"
          }
          onPress={() => {
            if (!reducedMotion) {
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut
              );
            }
            setExpandedSections((prev) => ({
              ...prev,
              [section.title]: !prev[section.title],
            }));
          }}
          activeOpacity={0.75}>
          <View style={styles.sectionHeaderLeft}>
            <View
              style={[
                styles.priorityIndicator,
                {
                  backgroundColor: priorityColor,
                  borderColor: colors.card,
                },
              ]}
            />
            <Text
              style={[
                typography.headline,
                styles.sectionTitle,
                { color: colors.text },
              ]}>
              {section.title}
            </Text>
          </View>
          {isExpanded ? (
            <View
              style={[
                styles.countPill,
                { backgroundColor: priorityColor + "24" },
              ]}>
              <Text
                style={[typography.subbodySemiBold, { color: priorityColor }]}>
                {section.count}
              </Text>
            </View>
          ) : (
            <MaterialIcons
              name="keyboard-arrow-down"
              size={22}
              color={colors.textSecondary}
            />
          )}
        </TouchableOpacity>
      );
    },
    [expandedSections, colors, reducedMotion]
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
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View
              style={[styles.statAccent, { backgroundColor: colors.success }]}
            />
            <Text
              style={[
                typography.captionMedium,
                styles.statLabel,
                { color: colors.textSecondary },
              ]}>
              Completed
            </Text>
            <Text
              style={[typography.title, { color: colors.success }]}
              maxFontSizeMultiplier={1.4}>
              {completed}
            </Text>
          </View>
          <View
            style={[styles.statDivider, { backgroundColor: colors.hairline }]}
          />
          <View style={styles.statItem}>
            <View
              style={[styles.statAccent, { backgroundColor: colors.primary }]}
            />
            <Text
              style={[
                typography.captionMedium,
                styles.statLabel,
                { color: colors.textSecondary },
              ]}>
              Remaining
            </Text>
            <Text
              style={[typography.title, { color: colors.primary }]}
              maxFontSizeMultiplier={1.4}>
              {remaining}
            </Text>
          </View>
          <View
            style={[styles.statDivider, { backgroundColor: colors.hairline }]}
          />
          <View style={styles.statItem}>
            <View
              style={[styles.statAccent, { backgroundColor: colors.accent }]}
            />
            <Text
              style={[
                typography.captionMedium,
                styles.statLabel,
                { color: colors.textSecondary },
              ]}>
              Total
            </Text>
            <Text
              style={[typography.title, { color: colors.text }]}
              maxFontSizeMultiplier={1.4}>
              {total}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const listEntranceStyle = {
    flex: 1,
    opacity: listEntranceOpacity,
    transform: [{ translateY: listEntranceTranslateY }],
  };

  if (tasks.length === 0) {
    return (
      <Animated.View style={listEntranceStyle}>
        <EmptyTasksState
          title="No tasks"
          subtitle="Tap + below to add your first task for this day."
          icon="calendar-outline"
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={listEntranceStyle}>
      <SectionList
        style={{ flex: 1 }}
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
              onDelete={onDeleteTask}
              onToggleComplete={onToggleTaskCompletion}
              onPress={onTaskPress}
              isOverdue={isOverdue}
              arePrereqsMet={prereqsMet}
              priority={section.priority}
              mode="home"
              showAnimations={true}
            />
          );
        }}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  taskList: {
    marginHorizontal: SIZES.medium,
    paddingBottom: SIZES.small,
  },
  progressSection: {
    paddingVertical: SIZES.medium,
    borderWidth: 1,
    borderRadius: SIZES.base + 4,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: -SIZES.medium,
    marginBottom: SIZES.medium,
    paddingHorizontal: SIZES.small,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    flex: 1,
  },

  statItem: {
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  statAccent: {
    width: 4,
    height: 14,
    borderRadius: 2,
    marginBottom: SIZES.small,
  },
  statLabel: {
    marginBottom: 4,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    marginVertical: SIZES.small,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SIZES.medium,
    paddingHorizontal: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  priorityIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: SIZES.medium,
    borderWidth: 2,
  },
  sectionTitle: {
    flexShrink: 1,
  },
  countPill: {
    paddingHorizontal: SIZES.medium,
    paddingVertical: 6,
    borderRadius: 14,
    minWidth: 36,
    alignItems: "center",
  },
});

export default TaskList;
