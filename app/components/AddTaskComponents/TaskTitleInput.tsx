import React from "react";
import { View } from "react-native";
import { ReminderSettings } from "../../types";
import RemindMeButton from "../common/RemindMeButton";
import TaskTitleInput from "../common/TaskTitleInput";
import FormSection from "./FormSection";

interface TaskTitleInputProps {
  value: string;
  onChangeText: (text: string) => void;
  remindMe?: ReminderSettings;
  onChangeRemindMe?: (r: ReminderSettings) => void;
}

const TaskTitleInputComponent: React.FC<TaskTitleInputProps> = ({
  value,
  onChangeText,
  remindMe,
  onChangeRemindMe,
}) => {
  return (
    <FormSection title="Task Name">
      <TaskTitleInput
        value={value}
        onChangeText={onChangeText}
        placeholder="What do you need to do?"
        autoFocus
        returnKeyType="next"
      />
      {onChangeRemindMe && (
        <View style={{ marginTop: 12 }}>
          <RemindMeButton value={remindMe} onChange={onChangeRemindMe} />
        </View>
      )}
    </FormSection>
  );
};

export default TaskTitleInputComponent;
