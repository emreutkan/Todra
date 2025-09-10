import React from "react";
import TaskTitleInput from "../common/TaskTitleInput";
import FormSection from "./FormSection";

interface TaskTitleInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

const TaskTitleInputComponent: React.FC<TaskTitleInputProps> = ({
  value,
  onChangeText,
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
    </FormSection>
  );
};

export default TaskTitleInputComponent;
