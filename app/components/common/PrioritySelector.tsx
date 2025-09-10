import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { PRIORITY_COLORS, SIZES } from "../../theme";
import { TaskPriority } from "../../types";

interface PrioritySelectorProps {
  selectedPriority: TaskPriority;
  onSelectPriority: (priority: TaskPriority) => void;
  disabled?: boolean;
  showEditIcon?: boolean;
  onPress?: () => void;
  editable?: boolean;
  style?: any;
}

const PrioritySelector: React.FC<PrioritySelectorProps> = ({
  selectedPriority,
  onSelectPriority,
  disabled = false,
  showEditIcon = false,
  onPress,
  editable = true,
  style,
}) => {
  const { colors } = useTheme();

  const priorityOptions: {
    value: TaskPriority;
    label: string;
    icon: string;
  }[] = [
    {
      value: "high",
      label: "High",
      icon: "alert-circle",
    },
    {
      value: "normal",
      label: "Normal",
      icon: "bookmark",
    },
    {
      value: "low",
      label: "Low",
      icon: "flag",
    },
  ];

  const styles = StyleSheet.create({
    container: {
      ...style,
    },
    priorityContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    priorityButton: {
      flex: 1,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 12,
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.border,
      minHeight: 80,
      opacity: disabled ? 0.6 : 1,
      ...Platform.select({
        ios: {
          shadowColor: "rgba(0,0,0,0.08)",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 8,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    selectedButton: {
      borderColor: PRIORITY_COLORS[selectedPriority],
      backgroundColor: PRIORITY_COLORS[selectedPriority] + "15",
      ...Platform.select({
        ios: {
          shadowColor: PRIORITY_COLORS[selectedPriority] + "40",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 12,
        },
        android: {
          elevation: 6,
        },
      }),
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
      ...Platform.select({
        ios: {
          shadowColor: "rgba(0,0,0,0.1)",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.8,
          shadowRadius: 2,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    selectedIconContainer: {
      backgroundColor: PRIORITY_COLORS[selectedPriority] + "20",
    },
    priorityButtonText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "600",
      textAlign: "center",
      letterSpacing: 0.3,
    },
    selectedText: {
      color: PRIORITY_COLORS[selectedPriority],
      fontWeight: "700",
    },
    // For display mode (non-editable)
    displayContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: SIZES.medium,
      borderWidth: 1,
      borderColor: colors.border,
    },
    displayContent: {
      flexDirection: "row",
      alignItems: "center",
    },
    priorityBadge: {
      paddingHorizontal: SIZES.medium,
      paddingVertical: SIZES.small,
      borderRadius: 20,
      backgroundColor: PRIORITY_COLORS[selectedPriority],
      elevation: 2,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    priorityText: {
      color: "white",
      fontSize: SIZES.font,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    editIcon: {
      marginLeft: SIZES.small,
    },
  });

  // Display mode (non-editable)
  if (!editable && onPress) {
    return (
      <TouchableOpacity
        style={styles.displayContainer}
        onPress={onPress}
        activeOpacity={0.7}>
        <View style={styles.displayContent}>
          <View style={styles.priorityBadge}>
            <Text style={styles.priorityText}>
              {selectedPriority.charAt(0).toUpperCase() +
                selectedPriority.slice(1)}
            </Text>
          </View>
        </View>
        {showEditIcon && (
          <Ionicons
            name="create-outline"
            size={16}
            color={colors.textSecondary}
            style={styles.editIcon}
          />
        )}
      </TouchableOpacity>
    );
  }

  // Editable mode
  return (
    <View style={styles.container}>
      <View style={styles.priorityContainer}>
        {priorityOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.priorityButton,
              selectedPriority === option.value && styles.selectedButton,
            ]}
            onPress={() => !disabled && onSelectPriority(option.value)}
            activeOpacity={disabled ? 1 : 0.7}>
            <View
              style={[
                styles.iconContainer,
                selectedPriority === option.value &&
                  styles.selectedIconContainer,
              ]}>
              <Ionicons
                name={option.icon as any}
                size={18}
                color={
                  selectedPriority === option.value
                    ? PRIORITY_COLORS[option.value]
                    : colors.textSecondary
                }
              />
            </View>
            <Text
              style={[
                styles.priorityButtonText,
                selectedPriority === option.value && styles.selectedText,
              ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default PrioritySelector;
