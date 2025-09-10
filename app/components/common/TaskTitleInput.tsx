import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { SIZES } from "../../theme";

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
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      ...style,
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: SIZES.base,
      padding: SIZES.medium,
      color: colors.text,
      fontSize: SIZES.medium,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: multiline ? 60 : 48,
    },
    clickableContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.card,
      borderRadius: SIZES.base,
      padding: SIZES.medium,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 48,
    },
    clickableText: {
      flex: 1,
      color: colors.text,
      fontSize: SIZES.medium,
      fontWeight: "500",
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
      style={[styles.input, style]}
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
    />
  );
};

export default TaskTitleInput;

