import React from "react";
import { StyleSheet, TextInput } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { SIZES } from "../../theme";
import FormSection from "./FormSection";

interface TaskTitleInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

const TaskTitleInput: React.FC<TaskTitleInputProps> = ({
  value,
  onChangeText,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    input: {
      backgroundColor: colors.card,
      borderRadius: SIZES.base,
      padding: SIZES.medium,
      color: colors.text,
      fontSize: SIZES.medium,
      borderWidth: 1,
      borderColor: colors.border,
    },
  });

  return (
    <FormSection title="Task Name">
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="What do you need to do?"
        placeholderTextColor={colors.text + "80"}
        autoCapitalize="sentences"
        autoFocus
        returnKeyType="next"
      />
    </FormSection>
  );
};

export default TaskTitleInput;
