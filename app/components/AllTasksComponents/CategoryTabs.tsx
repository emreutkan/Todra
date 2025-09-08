import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { TaskCategory } from "../../hooks/useAllTasks";

interface CategoryTabsProps {
  selectedCategory: TaskCategory;
  onCategoryChange: (category: TaskCategory) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  selectedCategory,
  onCategoryChange,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.tabContainer,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}>
      <TouchableOpacity
        style={[
          styles.tab,
          selectedCategory === "current" && [
            styles.activeTab,
            { borderColor: colors.primary },
          ],
        ]}
        onPress={() => onCategoryChange("current")}>
        <Text
          style={[
            styles.tabText,
            {
              color:
                selectedCategory === "current"
                  ? colors.primary
                  : colors.textSecondary,
            },
          ]}>
          Current Tasks
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          selectedCategory === "archived" && [
            styles.activeTab,
            { borderColor: colors.primary },
          ],
        ]}
        onPress={() => onCategoryChange("archived")}>
        <Text
          style={[
            styles.tabText,
            {
              color:
                selectedCategory === "archived"
                  ? colors.primary
                  : colors.textSecondary,
            },
          ]}>
          Archived
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
  },
});

export default CategoryTabs;

