import React from "react";
import { View } from "react-native";
import TaskDescription from "../common/TaskDescription";
import FormSection from "./FormSection";

interface TaskDescriptionProps {
  value: string;
  onChangeText: (text: string) => void;
}

const TaskDescriptionComponent: React.FC<TaskDescriptionProps> = ({
  value,
  onChangeText,
}) => {
  return (
    <View>
      <FormSection title="Description ">
        <TaskDescription
          value={value}
          onChangeText={onChangeText}
          placeholder="Add details about your task"
          numberOfLines={6}
        />
      </FormSection>
    </View>
  );
};

export default TaskDescriptionComponent;
