import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { DEFAULT_CATEGORIES } from "../../constants/CategoryConstants";
import { useTheme } from "../../context/ThemeContext";
import { SIZES } from "../../theme";
import { Task, TaskPriority } from "../../types";
import ActionButton from "../common/ActionButton";

interface TasksHeaderProps {
  tasks: Task[];
  showFilters: boolean;
  selectedCategory: string;
  selectedPriority: TaskPriority | "all";
  onToggleFilter: () => void;
  onCategoryChange: (category: string) => void;
  onPriorityChange: (priority: TaskPriority | "all") => void;
}

const TasksHeader: React.FC<TasksHeaderProps> = ({
  tasks,
  showFilters,
  selectedCategory,
  selectedPriority,
  onToggleFilter,
  onCategoryChange,
  onPriorityChange,
}) => {
  const { colors } = useTheme();

  // Build list of unique categories from tasks
  const categories = React.useMemo(() => {
    const defaultCategory = DEFAULT_CATEGORIES[0].name;
    const uniqueCategories = new Set(
      tasks.map((task) => task.category || defaultCategory)
    );
    return ["all", ...Array.from(uniqueCategories)];
  }, [tasks]);

  // Filter tasks for progress calculation
  const filteredTasks = React.useMemo(() => {
    return tasks.filter((task) => {
      const matchesCategory =
        selectedCategory === "all" ||
        (task.category || DEFAULT_CATEGORIES[0].name) === selectedCategory;
      const matchesPriority =
        selectedPriority === "all" || task.priority === selectedPriority;
      return matchesCategory && matchesPriority;
    });
  }, [tasks, selectedCategory, selectedPriority]);

  // Calculate progress stats
  const total = filteredTasks.length;
  const completed = filteredTasks.filter((t) => t.completed).length;
  const remaining = total - completed;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <ActionButton onPress={onToggleFilter} text="Filter" icon={false} />
      </View>

      {showFilters && (
        <View style={styles.filterPanel}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>
            Category
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor:
                      selectedCategory === category
                        ? colors.primary
                        : "transparent",
                    borderColor:
                      selectedCategory === category
                        ? colors.primary
                        : colors.border,
                  },
                ]}
                onPress={() => onCategoryChange(category)}>
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color:
                        selectedCategory === category
                          ? colors.onPrimary
                          : colors.text,
                    },
                  ]}>
                  {category === "all" ? "All Categories" : category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Priority selector */}
          <Text
            style={[styles.filterLabel, { color: colors.text, marginTop: 10 }]}>
            Priority
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}>
            {(["all", "high", "normal", "low"] as const).map((prio) => (
              <TouchableOpacity
                key={prio}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor:
                      selectedPriority === prio
                        ? colors.primary
                        : "transparent",
                    borderColor:
                      selectedPriority === prio
                        ? colors.primary
                        : colors.border,
                    marginRight: 8,
                  },
                ]}
                onPress={() => onPriorityChange(prio)}>
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color:
                        selectedPriority === prio
                          ? colors.onPrimary
                          : colors.text,
                    },
                  ]}>
                  {prio === "all"
                    ? "All"
                    : prio.charAt(0).toUpperCase() + prio.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Progress section */}
      <View
        style={[
          styles.progressSection,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: SIZES.small,
  },
  title: {
    fontSize: SIZES.large,
    fontWeight: "bold",
  },

  filterPanel: {
    marginTop: SIZES.small,
    paddingTop: SIZES.small,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
    alignItems: "flex-end",
  },
  filterLabel: {
    fontSize: SIZES.medium,
    fontWeight: "600",
    marginBottom: SIZES.small,
  },
  filterScrollContent: {
    paddingRight: SIZES.small,
  },
  filterChip: {
    paddingHorizontal: SIZES.small,
    paddingVertical: SIZES.small,
    borderRadius: 20,
    marginRight: SIZES.small,
    borderWidth: 1,
    minWidth: 62,
    alignItems: "center",
  },
  filterChipText: {
    fontSize: SIZES.small,
    fontWeight: "500",
  },
  progressSection: {
    paddingVertical: SIZES.small,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.small,
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
    height: 20,
    opacity: 0.2,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
});

export default TasksHeader;
