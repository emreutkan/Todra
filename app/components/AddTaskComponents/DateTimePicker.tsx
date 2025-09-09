import DateTimePicker from "@react-native-community/datetimepicker";
import { format, isToday, isTomorrow } from "date-fns";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import FormSection from "./FormSection";

interface DateTimePickerProps {
  dueDate: Date;
  onDateChange: (date: Date) => void;
  initialDate?: Date;
}

const DateTimePickerComponent: React.FC<DateTimePickerProps> = ({
  dueDate,
  onDateChange,
  initialDate = new Date(),
}) => {
  const { colors } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
  const [tempDate, setTempDate] = useState<Date>(new Date(dueDate));

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      setTempDate(selectedTime);
    }
  };

  const openDatePicker = () => {
    setTempDate(new Date(dueDate));
    setPickerMode("date");
    setShowModal(true);
  };

  const openTimePicker = () => {
    setTempDate(new Date(dueDate));
    setPickerMode("time");
    setShowModal(true);
  };

  const handleConfirm = () => {
    onDateChange(tempDate);
    setShowModal(false);
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  const formatTimeDisplay = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();

    if (hours === 23 && minutes === 59) {
      return "End of today";
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

  return (
    <FormSection title="Due Date & Time">
      <View
        style={[
          styles.dateTimeDisplay,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}>
        <TouchableOpacity
          style={styles.dateSection}
          onPress={openDatePicker}
          activeOpacity={0.7}>
          <Text style={[styles.dateText, { color: colors.text }]}>
            {formatDateDisplay(dueDate)}
          </Text>
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <TouchableOpacity
          style={styles.timeSection}
          onPress={openTimePicker}
          activeOpacity={0.7}>
          <Text style={[styles.timeText, { color: colors.text }]}>
            {formatTimeDisplay(dueDate)}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}>
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: colors.border },
              ]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Select {pickerMode === "date" ? "Date" : "Time"}
              </Text>
            </View>

            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={tempDate}
                mode={pickerMode}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={
                  pickerMode === "date" ? handleDateChange : handleTimeChange
                }
                minimumDate={pickerMode === "date" ? new Date() : undefined}
                textColor={colors.text}
                themeVariant="light"
                style={
                  Platform.OS === "ios"
                    ? { backgroundColor: colors.background }
                    : undefined
                }
              />
            </View>

            <View
              style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.footerButton,
                  styles.cancelButton,
                  { borderColor: colors.border },
                ]}
                onPress={handleCancel}>
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.footerButton,
                  styles.confirmButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleConfirm}>
                <Text
                  style={[
                    styles.confirmButtonText,
                    { color: colors.onPrimary },
                  ]}>
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </FormSection>
  );
};

const styles = StyleSheet.create({
  dateTimeDisplay: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    height: 54,
    alignItems: "center",
  },
  dateSection: {
    flex: 3,
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
  },
  dateText: {
    fontSize: 15,
    fontWeight: "500",
  },
  timeText: {
    fontSize: 15,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  pickerContainer: {
    padding: 20,
    alignItems: "center",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    marginRight: 8,
    borderWidth: 1,
  },
  confirmButton: {
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default DateTimePickerComponent;
