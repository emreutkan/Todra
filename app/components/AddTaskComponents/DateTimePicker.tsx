import React from "react";
import DateTimeButton from "../common/DateTimeButton";
import FormSection from "./FormSection";

interface DateTimePickerProps {
  dueDate: Date;
  onDateChange: (date: Date) => void;
}

const DateTimePickerComponent: React.FC<DateTimePickerProps> = ({
  dueDate,
  onDateChange,
}) => {
  return (
    <FormSection title="Due Date & Time">
      <DateTimeButton
        value={dueDate}
        onDateChange={onDateChange}
        mode="both"
        minimumDate={new Date()}
      />
    </FormSection>
  );
};

export default DateTimePickerComponent;
