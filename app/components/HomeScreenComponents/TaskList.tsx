import { MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutAnimation,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeScrollEvent,
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
import { HOME_LIST, SIZES } from "../../theme";
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
  /**
   * Done / To do strip: row height + `stackGap` (measured).
   * Default avoids height-0 first pass so `onLayout` can run.
   */
  const [statsBlockHeight, setStatsBlockHeight] = useState(56);
  const statsProgress = useRef(new Animated.Value(0)).current;
  const statsShownRef = useRef(false);
  const lastScrollY = useRef(0);

  const setStatsVisible = useCallback(
    (visible: boolean) => {
      if (statsShownRef.current === visible) return;
      statsShownRef.current = visible;
      if (reducedMotion) {
        statsProgress.setValue(visible ? 1 : 0);
        return;
      }
      Animated.timing(statsProgress, {
        toValue: visible ? 1 : 0,
        duration: visible ? 300 : 220,
        easing: visible
          ? Easing.out(Easing.cubic)
          : Easing.in(Easing.cubic),
        useNativeDriver: false,
      }).start();
    },
    [reducedMotion, statsProgress]
  );

  const handleStatsLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h <= 0) return;
    const total = h + HOME_LIST.stackGap;
    setStatsBlockHeight((prev) =>
      Math.abs(prev - total) < 1 ? prev : total
    );
  }, []);

  const handleScroll = useMemo(() => {
    const scrollHandler = scrollY
      ? Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )
      : undefined;

    return (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollHandler?.(e);
      const y = Math.max(0, e.nativeEvent.contentOffset.y);
      const dy = y - lastScrollY.current;
      lastScrollY.current = y;
      const threshold = 10;
      if (y < threshold) {
        setStatsVisible(false);
        return;
      }
      if (dy > threshold) {
        setStatsVisible(true);
      } else if (dy < -threshold) {
        setStatsVisible(false);
      }
    };
  }, [scrollY, setStatsVisible]);

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

  const dayKey = useMemo(
    () =>
      `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`,
    [currentDate]
  );
  useEffect(() => {
    lastScrollY.current = 0;
    statsShownRef.current = false;
    statsProgress.setValue(0);
  }, [dayKey, statsProgress]);

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
              backgroundColor: colors.card,
              borderColor: colors.border,
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
                  borderColor: colors.background,
                },
              ]}
            />
            <Text
              style={[
                typography.bodySemiBold,
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

  const renderTasksHeader = () => {
    const completed = tasks.filter((t) => t.completed).length;
    const remaining = tasks.length - completed;
    const h = statsBlockHeight;
    const animatedShell = {
      height: statsProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, h],
      }),
      overflow: "hidden" as const,
    };
    const animatedInner = {
      transform: [
        {
          translateY: statsProgress.interpolate({
            inputRange: [0, 1],
            outputRange: reducedMotion ? [0, 0] : [-14, 0],
          }),
        },
      ],
      opacity: statsProgress.interpolate({
        inputRange: [0, 0.35, 1],
        outputRange: [0, 0.85, 1],
      }),
    };

    return (
      <Animated.View style={animatedShell}>
        <Animated.View style={animatedInner}>
          <View onLayout={handleStatsLayout}>
            <View
              style={[
                styles.progressSection,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}>
              <View style={styles.progressInline}>
                <View
                  style={[
                    styles.progressDot,
                    { backgroundColor: colors.success },
                  ]}
                />
                <Text
                  style={[
                    typography.captionMedium,
                    styles.progressCaption,
                    { color: colors.textSecondary },
                  ]}>
                  Done
                </Text>
                <Text
                  style={[typography.headline, { color: colors.success }]}
                  maxFontSizeMultiplier={1.4}>
                  {completed}
                </Text>
              </View>
              <View
                style={[
                  styles.progressDivider,
                  { backgroundColor: colors.hairline },
                ]}
              />
              <View style={styles.progressInline}>
                <View
                  style={[
                    styles.progressDot,
                    { backgroundColor: colors.primary },
                  ]}
                />
                <Text
                  style={[
                    typography.captionMedium,
                    styles.progressCaption,
                    { color: colors.textSecondary },
                  ]}>
                  To do
                </Text>
                <Text
                  style={[typography.headline, { color: colors.primary }]}
                  maxFontSizeMultiplier={1.4}>
                  {remaining}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    );
  };

  const listEntranceStyle = {
    flex: 1,
    opacity: listEntranceOpacity,
    transform: [{ translateY: listEntranceTranslateY }],
  };

  if (tasks.length === 0) {
    return (
      <Animated.View style={[listEntranceStyle, styles.emptyWrap]}>
        <EmptyTasksState
          title="No tasks"
          subtitle="Tap + to add one for this day."
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
        onScroll={handleScroll}
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
  emptyWrap: {
    flex: 1,
    paddingBottom: 108,
  },
  taskList: {
    paddingBottom: 108,
  },
  progressSection: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: HOME_LIST.cardRadius,
    paddingVertical: HOME_LIST.sectionPaddingV,
    paddingHorizontal: HOME_LIST.sectionPaddingH,
  },
  progressInline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
  },
  progressCaption: {
    marginRight: SIZES.base,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: SIZES.base,
  },
  progressDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    marginVertical: 2,
    marginHorizontal: SIZES.base,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: HOME_LIST.sectionPaddingV,
    paddingHorizontal: HOME_LIST.sectionPaddingH,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: HOME_LIST.cardRadius,
    marginBottom: HOME_LIST.stackGap,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  priorityIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SIZES.medium,
    borderWidth: 2,
  },
  sectionTitle: {
    flexShrink: 1,
  },
  countPill: {
    paddingHorizontal: SIZES.small,
    paddingVertical: 4,
    borderRadius: HOME_LIST.cardRadius,
    minWidth: 32,
    alignItems: "center",
  },
});

export default TaskList;
