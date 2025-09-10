import DateTimePicker from "@react-native-community/datetimepicker";
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

interface DateTimeModalProps {
  visible: boolean;
  mode: "date" | "time";
  value: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  minimumDate?: Date;
  title?: string;
}

const DateTimeModal: React.FC<DateTimeModalProps> = ({
  visible,
  mode,
  value,
  onConfirm,
  onCancel,
  minimumDate,
  title,
}) => {
  const { colors } = useTheme();
  const [tempDate, setTempDate] = useState<Date>(value);

  const handleDateChange = (_: unknown, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const handleTimeChange = (_: unknown, selectedTime?: Date) => {
    if (selectedTime) {
      setTempDate(selectedTime);
    }
  };

  const handleConfirm = () => {
    onConfirm(tempDate);
  };

  const handleCancel = () => {
    setTempDate(value); // Reset to original value
    onCancel();
  };

  // Update tempDate when value prop changes
  React.useEffect(() => {
    setTempDate(value);
  }, [value]);

  return (
    <Modal
      visible={visible}
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
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {title || `Select ${mode === "date" ? "Date" : "Time"}`}
            </Text>
          </View>

          <View style={styles.pickerContainer}>
            <DateTimePicker
              value={tempDate}
              mode={mode}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={mode === "date" ? handleDateChange : handleTimeChange}
              minimumDate={minimumDate}
              textColor={colors.text}
              themeVariant="light"
              style={
                Platform.OS === "ios"
                  ? { backgroundColor: colors.background }
                  : undefined
              }
            />
          </View>

          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
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
                style={[styles.confirmButtonText, { color: colors.onPrimary }]}>
                Confirm
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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

export default DateTimeModal;
