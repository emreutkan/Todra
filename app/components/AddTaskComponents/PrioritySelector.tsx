import React from "react";
import { TaskPriority } from "../../types";
import PrioritySelector from "../common/PrioritySelector";
import FormSection from "./FormSection";

interface PrioritySelectorProps {
  selectedPriority: TaskPriority;
  onSelectPriority: (priority: TaskPriority) => void;
}

const PrioritySelectorComponent: React.FC<PrioritySelectorProps> = ({
  selectedPriority,
  onSelectPriority,
}) => {
  return (
    <FormSection title="Priority">
      <PrioritySelector
        selectedPriority={selectedPriority}
        onSelectPriority={onSelectPriority}
      />
    </FormSection>
  );
};

export default PrioritySelectorComponent;
