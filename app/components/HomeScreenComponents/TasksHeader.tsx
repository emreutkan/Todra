import { MaterialIcons } from "@expo/vector-icons";
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
import ProgressChart from "./ProgressChart";

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
        <Text style={[styles.title, { color: colors.text }]}>
          My Tasks
        </Text>
        <TouchableOpacity onPress={onToggleFilter} style={styles.filterButton}>
          <Text style={styles.filterChip}>Filter</Text>
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filterPanel}>
          {/* Category selector */}
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
            style={[
              styles.filterLabel,
              { color: colors.text, marginTop: 10 },
            ]}>
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
        <ProgressChart
          completed={completed}
          remaining={remaining}
          colors={colors}
        />
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
  container: {
    paddingHorizontal: 16,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: SIZES.large,
    fontWeight: "bold",
  },
  filterButton: {
    padding: 8,
  },
  filterPanel: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  filterLabel: {
    fontSize: SIZES.medium,
    fontWeight: "600",
    marginBottom: 6,
  },
  filterScrollContent: {
    paddingRight: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: SIZES.small,
    fontWeight: "500",
  },
  progressSection: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    flex: 1,
    marginLeft: 10,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    height: 30,
    opacity: 0.2,
    backgroundColor: "#000",
  },
});

export default TasksHeader;

