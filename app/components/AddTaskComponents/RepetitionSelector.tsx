import { Ionicons } from "@expo/vector-icons";
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
import { RepetitionRule } from "../../types";
import FormSection from "./FormSection";

interface RepetitionSelectorProps {
  repetition: RepetitionRule;
  onRepetitionChange: (repetition: RepetitionRule) => void;
}

const RepetitionSelector: React.FC<RepetitionSelectorProps> = ({
  repetition,
  onRepetitionChange,
}) => {
  const { colors } = useTheme();
  const [showModal, setShowModal] = useState(false);

  const daysOfWeek = [
    { key: 0, label: "Sun", short: "S" },
    { key: 1, label: "Mon", short: "M" },
    { key: 2, label: "Tue", short: "T" },
    { key: 3, label: "Wed", short: "W" },
    { key: 4, label: "Thu", short: "T" },
    { key: 5, label: "Fri", short: "F" },
    { key: 6, label: "Sat", short: "S" },
  ];

  const repetitionTypes = [
    { key: "daily", label: "Daily", icon: "calendar-outline" },
    { key: "weekly", label: "Weekly", icon: "calendar-outline" },
    { key: "monthly", label: "Monthly", icon: "calendar-outline" },
  ];

  const handleToggleRepetition = () => {
    if (repetition.enabled) {
      // If currently enabled, disable it
      onRepetitionChange({
        ...repetition,
        enabled: false,
      });
    } else {
      // If currently disabled, show modal to configure
      setShowModal(true);
    }
  };

  const handleConfirmRepetition = () => {
    onRepetitionChange({
      ...repetition,
      enabled: true,
    });
    setShowModal(false);
  };

  const handleCancelRepetition = () => {
    setShowModal(false);
  };

  const handleTypeChange = (type: "daily" | "weekly" | "monthly") => {
    onRepetitionChange({
      ...repetition,
      type,
      daysOfWeek: type === "weekly" ? [] : undefined,
    });
  };

  const handleIntervalChange = (interval: number) => {
    onRepetitionChange({
      ...repetition,
      interval,
    });
  };

  const handleDayToggle = (day: number) => {
    if (!repetition.daysOfWeek) return;

    const newDays = repetition.daysOfWeek.includes(day)
      ? repetition.daysOfWeek.filter((d) => d !== day)
      : [...repetition.daysOfWeek, day];

    onRepetitionChange({
      ...repetition,
      daysOfWeek: newDays,
    });
  };

  const getRepetitionDescription = () => {
    if (!repetition.enabled) return "No repetition";

    const { type, interval, daysOfWeek: selectedDays } = repetition;

    if (type === "daily") {
      return interval === 1 ? "Every day" : `Every ${interval} days`;
    }

    if (type === "weekly") {
      if (!selectedDays || selectedDays.length === 0) {
        return interval === 1 ? "Every week" : `Every ${interval} weeks`;
      }

      const selectedDaysText = selectedDays
        .map((day) => daysOfWeek.find((d) => d.key === day)?.short)
        .filter(Boolean)
        .join(", ");

      return interval === 1
        ? `Every week on ${selectedDaysText}`
        : `Every ${interval} weeks on ${selectedDaysText}`;
    }

    if (type === "monthly") {
      return interval === 1 ? "Every month" : `Every ${interval} months`;
    }

    return "Custom repetition";
  };

  const styles = StyleSheet.create({
    repetitionContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    repetitionInfo: {
      flex: 1,
    },
    repetitionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 2,
    },
    repetitionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    toggleButton: {
      padding: 8,
    },
    typeSelector: {
      flexDirection: "row",
      marginTop: 12,
      gap: 8,
    },
    typeButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    selectedTypeButton: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + "10",
    },
    typeButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      marginLeft: 6,
    },
    selectedTypeButtonText: {
      color: colors.primary,
    },
    intervalSelector: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 12,
      gap: 8,
    },
    intervalLabel: {
      fontSize: 14,
      color: colors.text,
      fontWeight: "500",
    },
    intervalButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    selectedIntervalButton: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    intervalButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    selectedIntervalButtonText: {
      color: colors.onPrimary,
    },
    daySelector: {
      marginTop: 12,
    },
    daySelectorLabel: {
      fontSize: 14,
      color: colors.text,
      fontWeight: "500",
      marginBottom: 8,
    },
    dayButtons: {
      flexDirection: "row",
      gap: 8,
    },
    dayButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: "center",
    },
    selectedDayButton: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + "15",
    },
    dayButtonText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text,
    },
    selectedDayButtonText: {
      color: colors.primary,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalContainer: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "80%",
      ...Platform.select({
        ios: {
          shadowColor: "rgba(0,0,0,0.3)",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 1,
          shadowRadius: 10,
        },
        android: {
          elevation: 10,
        },
      }),
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    modalContent: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    modalFooter: {
      flexDirection: "row",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: "center",
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    confirmButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignItems: "center",
    },
    confirmButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.onPrimary,
    },
  });

  return (
    <FormSection title="Repetition">
      <TouchableOpacity
        style={styles.repetitionContainer}
        onPress={handleToggleRepetition}
        activeOpacity={0.7}>
        <View style={styles.repetitionInfo}>
          <Text style={styles.repetitionTitle}>Repeat Task</Text>
          <Text style={styles.repetitionDescription}>
            {getRepetitionDescription()}
          </Text>
        </View>
        <View style={styles.toggleButton}>
          <Ionicons
            name={repetition.enabled ? "checkmark-circle" : "ellipse-outline"}
            size={24}
            color={repetition.enabled ? colors.primary : colors.border}
          />
        </View>
      </TouchableOpacity>

      {/* Repetition Configuration Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelRepetition}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Repeat Task</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCancelRepetition}
                activeOpacity={0.7}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <View style={styles.modalContent}>
              {/* Repetition Type Selector */}
              <View style={styles.typeSelector}>
                {repetitionTypes.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeButton,
                      repetition.type === type.key && styles.selectedTypeButton,
                    ]}
                    onPress={() => handleTypeChange(type.key as any)}
                    activeOpacity={0.7}>
                    <Ionicons
                      name={type.icon as any}
                      size={16}
                      color={
                        repetition.type === type.key
                          ? colors.primary
                          : colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        repetition.type === type.key &&
                          styles.selectedTypeButtonText,
                      ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Interval Selector */}
              <View style={styles.intervalSelector}>
                <Text style={styles.intervalLabel}>Every:</Text>
                {[1, 2, 3, 4].map((interval) => (
                  <TouchableOpacity
                    key={interval}
                    style={[
                      styles.intervalButton,
                      repetition.interval === interval &&
                        styles.selectedIntervalButton,
                    ]}
                    onPress={() => handleIntervalChange(interval)}
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        styles.intervalButtonText,
                        repetition.interval === interval &&
                          styles.selectedIntervalButtonText,
                      ]}>
                      {interval}
                    </Text>
                  </TouchableOpacity>
                ))}
                <Text style={styles.intervalLabel}>
                  {repetition.type === "daily"
                    ? "day(s)"
                    : repetition.type === "weekly"
                    ? "week(s)"
                    : "month(s)"}
                </Text>
              </View>

              {/* Day Selector for Weekly Repetition */}
              {repetition.type === "weekly" && (
                <View style={styles.daySelector}>
                  <Text style={styles.daySelectorLabel}>On days:</Text>
                  <View style={styles.dayButtons}>
                    {daysOfWeek.map((day) => (
                      <TouchableOpacity
                        key={day.key}
                        style={[
                          styles.dayButton,
                          repetition.daysOfWeek?.includes(day.key) &&
                            styles.selectedDayButton,
                        ]}
                        onPress={() => handleDayToggle(day.key)}
                        activeOpacity={0.7}>
                        <Text
                          style={[
                            styles.dayButtonText,
                            repetition.daysOfWeek?.includes(day.key) &&
                              styles.selectedDayButtonText,
                          ]}>
                          {day.short}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelRepetition}
                activeOpacity={0.7}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmRepetition}
                activeOpacity={0.7}>
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </FormSection>
  );
};

export default RepetitionSelector;
