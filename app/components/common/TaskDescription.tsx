import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { SIZES } from "../../theme";

interface TaskDescriptionProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  editable?: boolean;
  onPress?: () => void;
  showEditIcon?: boolean;
  numberOfLines?: number;
  autoFocus?: boolean;
  returnKeyType?: "done" | "next" | "default";
  onSubmitEditing?: () => void;
  style?: any;
}

const TaskDescription: React.FC<TaskDescriptionProps> = ({
  value,
  onChangeText,
  placeholder = "Add details about your task",
  editable = true,
  onPress,
  showEditIcon = false,
  numberOfLines = 6,
  autoFocus = false,
  returnKeyType = "done",
  onSubmitEditing,
  style,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      ...style,
    },
    textArea: {
      backgroundColor: colors.card,
      borderRadius: SIZES.base,
      padding: SIZES.medium,
      color: colors.text,
      fontSize: SIZES.font,
      minHeight: 120,
      borderWidth: 1,
      borderColor: colors.border,
      textAlignVertical: "top",
    },
    clickableContainer: {
      backgroundColor: colors.card,
      borderRadius: SIZES.base,
      padding: SIZES.medium,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 120,
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },
    clickableText: {
      flex: 1,
      color: value ? colors.text : colors.textSecondary,
      fontSize: SIZES.font,
      fontStyle: value ? "normal" : "italic",
      lineHeight: 24,
    },
    editIcon: {
      marginLeft: SIZES.small,
      marginTop: 2,
    },
  });

  if (!editable && onPress) {
    return (
      <TouchableOpacity
        style={styles.clickableContainer}
        onPress={onPress}
        activeOpacity={0.7}>
        <Text style={styles.clickableText}>{value || placeholder}</Text>
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

  return (
    <TextInput
      style={[styles.textArea, style]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.text + "80"}
      multiline
      numberOfLines={numberOfLines}
      textAlignVertical="top"
      autoFocus={autoFocus}
      returnKeyType={returnKeyType}
      onSubmitEditing={onSubmitEditing}
      editable={editable}
    />
  );
};

export default TaskDescription;
