import { format, isToday, isTomorrow } from "date-fns";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import DateTimeModal from "./DateTimeModal";

interface DateTimeButtonProps {
  value: Date;
  onDateChange: (date: Date) => void;
  mode?: "date" | "time" | "both";
  minimumDate?: Date;
  disabled?: boolean;
  style?: any;
}

const DateTimeButton: React.FC<DateTimeButtonProps> = ({
  value,
  onDateChange,
  mode = "both",
  minimumDate,
  disabled = false,
  style,
}) => {
  const { colors } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");

  const formatTimeDisplay = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();

    if (hours === 23 && minutes === 59) {
      return "By end of day";
    }

    return format(date, "h:mm a");
  };

  const formatDateDisplay = (date: Date) => {
    if (isToday(date)) {
      return `${format(date, "EEE, MMM d, yyyy")} (today)`;
    } else if (isTomorrow(date)) {
      return `${format(date, "EEE, MMM d, yyyy")} (tomorrow)`;
    } else {
      return format(date, "EEE, MMM d, yyyy");
    }
  };

  const openDatePicker = () => {
    if (disabled) return;
    setPickerMode("date");
    setShowModal(true);
  };

  const openTimePicker = () => {
    if (disabled) return;
    setPickerMode("time");
    setShowModal(true);
  };

  const handleConfirm = (date: Date) => {
    onDateChange(date);
    setShowModal(false);
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 12,
      overflow: "hidden",
      height: 54,
      alignItems: "center",
      opacity: disabled ? 0.6 : 1,
      ...style,
    },
    dateTimeDisplay: {
      flexDirection: "row",
      flex: 1,
      alignItems: "center",
    },
    dateSection: {
      flex: mode === "both" ? 3 : 1,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
    },
    timeSection: {
      flex: 2,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
    },
    divider: {
      width: 1,
      height: "70%",
      backgroundColor: colors.border,
    },
    dateText: {
      fontSize: 15,
      fontWeight: "500",
      color: colors.text,
    },
    timeText: {
      fontSize: 15,
      fontWeight: "500",
      color: colors.text,
    },
    singleModeContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 12,
    },
    singleModeText: {
      fontSize: 15,
      fontWeight: "500",
      color: colors.text,
    },
  });

  if (mode === "date") {
    return (
      <>
        <TouchableOpacity
          style={styles.container}
          onPress={openDatePicker}
          activeOpacity={disabled ? 1 : 0.7}>
          <View style={styles.singleModeContainer}>
            <Text style={styles.singleModeText}>
              {formatDateDisplay(value)}
            </Text>
          </View>
        </TouchableOpacity>

        <DateTimeModal
          visible={showModal}
          mode="date"
          value={value}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          minimumDate={minimumDate}
          title="Select Date"
        />
      </>
    );
  }

  if (mode === "time") {
    return (
      <>
        <TouchableOpacity
          style={styles.container}
          onPress={openTimePicker}
          activeOpacity={disabled ? 1 : 0.7}>
          <View style={styles.singleModeContainer}>
            <Text style={styles.singleModeText}>
              {formatTimeDisplay(value)}
            </Text>
          </View>
        </TouchableOpacity>

        <DateTimeModal
          visible={showModal}
          mode="time"
          value={value}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          title="Select Time"
        />
      </>
    );
  }

  // Both date and time mode
  return (
    <>
      <View style={styles.container}>
        <View style={styles.dateTimeDisplay}>
          <TouchableOpacity
            style={styles.dateSection}
            onPress={openDatePicker}
            activeOpacity={disabled ? 1 : 0.7}>
            <Text style={styles.dateText}>{formatDateDisplay(value)}</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.timeSection}
            onPress={openTimePicker}
            activeOpacity={disabled ? 1 : 0.7}>
            <Text style={styles.timeText}>{formatTimeDisplay(value)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <DateTimeModal
        visible={showModal}
        mode={pickerMode}
        value={value}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        minimumDate={minimumDate}
        title={`Select ${pickerMode === "date" ? "Date" : "Time"}`}
      />
    </>
  );
};

export default DateTimeButton;

