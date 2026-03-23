import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { ReminderSettings } from "../../types";
import { SIZES } from "../../theme";
import { typography } from "../../typography";
import RemindMeButton from "../common/RemindMeButton";
import TaskTitleInput from "../common/TaskTitleInput";
import FormSection from "./FormSection";

interface TaskTitleInputProps {
  value: string;
  onChangeText: (text: string) => void;
  showTitleError?: boolean;
  remindMe?: ReminderSettings;
  onChangeRemindMe?: (r: ReminderSettings) => void;
}

const TaskTitleInputComponent: React.FC<TaskTitleInputProps> = ({
  value,
  onChangeText,
  showTitleError = false,
  remindMe,
  onChangeRemindMe,
}) => {
  const { colors } = useTheme();

  return (
    <FormSection title="Title">
      <TaskTitleInput
        value={value}
        onChangeText={onChangeText}
        placeholder="What needs doing?"
        autoFocus
        returnKeyType="next"
        hero
      />
      {showTitleError ? (
        <Text style={[styles.error, { color: colors.error }]}>
          Add a title to save.
        </Text>
      ) : null}
      {onChangeRemindMe && (
        <View style={{ marginTop: 12 }}>
          <RemindMeButton value={remindMe} onChange={onChangeRemindMe} />
        </View>
      )}
    </FormSection>
  );
};

const styles = StyleSheet.create({
  error: {
    marginTop: SIZES.small,
    ...typography.bodySmall,
  },
});

export default TaskTitleInputComponent;
