import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { TASK_TITLE_MAX_LENGTH } from "../../constants/taskInputLimits";
import { SIZES } from "../../theme";
import { typography } from "../../typography";

interface TaskTitleInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  editable?: boolean;
  onPress?: () => void;
  showEditIcon?: boolean;
  multiline?: boolean;
  autoFocus?: boolean;
  returnKeyType?: "done" | "next" | "default";
  onSubmitEditing?: () => void;
  style?: any;
  /** Primary field treatment: accent bar + larger type (Add Task title) */
  hero?: boolean;
}

const TaskTitleInput: React.FC<TaskTitleInputProps> = ({
  value,
  onChangeText,
  placeholder = "What do you need to do?",
  editable = true,
  onPress,
  showEditIcon = false,
  multiline = false,
  autoFocus = false,
  returnKeyType = "next",
  onSubmitEditing,
  style,
  hero = false,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      ...style,
    },
    input: {
      ...typography.body,
      backgroundColor: colors.card,
      borderRadius: SIZES.base,
      padding: SIZES.medium,
      color: colors.text,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      minHeight: multiline ? 60 : 48,
    },
    inputHero: {
      ...typography.headline,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      borderTopRightRadius: SIZES.base,
      borderBottomRightRadius: SIZES.base,
      paddingVertical: 14,
      minHeight: multiline ? 60 : 56,
    },
    clickableContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.card,
      borderRadius: SIZES.base,
      padding: SIZES.medium,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      minHeight: 48,
    },
    clickableText: {
      ...typography.bodyMedium,
      flex: 1,
      color: colors.text,
    },
    editIcon: {
      marginLeft: SIZES.small,
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
      style={[styles.input, hero && styles.inputHero, style]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.text + "80"}
      autoCapitalize="sentences"
      autoFocus={autoFocus}
      returnKeyType={returnKeyType}
      onSubmitEditing={onSubmitEditing}
      multiline={multiline}
      editable={editable}
      maxLength={TASK_TITLE_MAX_LENGTH}
      maxFontSizeMultiplier={1.45}
      accessibilityLabel="Task title"
      accessibilityHint={`Required. Up to ${TASK_TITLE_MAX_LENGTH} characters.`}
    />
  );
};

export default TaskTitleInput;

