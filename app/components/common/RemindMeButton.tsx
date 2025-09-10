import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { ReminderPreset, ReminderSettings } from "../../types";
import CustomDatePicker from "./CustomDatePicker";

interface RemindMeButtonProps {
  value?: ReminderSettings;
  onChange: (settings: ReminderSettings) => void;
  maxOffsetMs?: number; // maximum allowed offset (dueDate - now)
}

const presetToMs = (p: ReminderPreset): number | undefined => {
  switch (p) {
    case "1h":
      return 60 * 60 * 1000;
    case "2h":
      return 2 * 60 * 60 * 1000;
    case "6h":
      return 6 * 60 * 60 * 1000;
    case "24h":
      return 24 * 60 * 60 * 1000;
    default:
      return undefined;
  }
};

const RemindMeButton: React.FC<RemindMeButtonProps> = ({
  value,
  onChange,
  maxOffsetMs,
}) => {
  const { colors } = useTheme();
  const [show, setShow] = useState(false);
  const [settings, setSettings] = useState<ReminderSettings>(
    value ?? {
      enabled: false,
      preset: "none",
      customOffsetMs: undefined,
      spamMode: false,
    }
  );

  // Calculate time remaining and determine picker mode
  const timeInfo = useMemo(() => {
    if (!maxOffsetMs || maxOffsetMs <= 0) {
      return {
        totalMinutes: 0,
        totalHours: 0,
        showHours: false,
        showMinutes: false,
        maxHours: 0,
        maxMinutes: 0,
        pickerMode: "time" as const,
        minDate: new Date(),
        maxDate: new Date(),
      };
    }

    const totalMinutes = Math.floor(maxOffsetMs / (1000 * 60));
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    // Determine what to show based on time remaining
    const showHours = totalHours > 0;
    const showMinutes = totalMinutes > 0;

    // Calculate min and max dates for the picker
    const now = new Date();
    const maxDate = new Date(now.getTime() + maxOffsetMs);
    const minDate = new Date(now.getTime() + 60000); // At least 1 minute

    return {
      totalMinutes,
      totalHours,
      remainingMinutes,
      showHours,
      showMinutes,
      maxHours: totalHours,
      maxMinutes: totalMinutes,
      pickerMode: "time" as const,
      minDate,
      maxDate,
    };
  }, [maxOffsetMs]);

  const summary = useMemo(() => {
    if (!settings.enabled || settings.preset === "none") return "Off";
    if (settings.preset === "custom" && settings.customOffsetMs) {
      const mins = Math.round(settings.customOffsetMs / 60000);
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      if (h > 0) {
        return `${h}h ${m}m before`;
      } else {
        return `${m}m before`;
      }
    }
    return `${settings.preset} before`;
  }, [settings]);

  // Initialize temp time based on current settings or default, but ensure it's within valid range
  const getInitialTime = () => {
    const currentOffset =
      settings.customOffsetMs ?? presetToMs(settings.preset) ?? 60 * 60 * 1000;
    const now = new Date();
    const reminderTime = new Date(now.getTime() + currentOffset);

    // Ensure the initial time doesn't exceed the maximum allowed
    if (maxOffsetMs && currentOffset > maxOffsetMs) {
      // If current offset exceeds max, set to max allowed time
      return new Date(now.getTime() + maxOffsetMs);
    }

    return reminderTime;
  };

  const [tempTime, setTempTime] = useState<Date>(getInitialTime());

  // Calculate current offset from temp time
  const currentOffsetMs = useMemo(() => {
    const now = new Date();
    const selectedTime = new Date(tempTime);

    // If selected time is in the past, return 0
    if (selectedTime <= now) return 0;

    return selectedTime.getTime() - now.getTime();
  }, [tempTime]);

  const isInvalid =
    currentOffsetMs > (maxOffsetMs ?? Number.POSITIVE_INFINITY) ||
    currentOffsetMs <= 0;

  const styles = StyleSheet.create({
    container: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: { color: colors.text, fontWeight: "700" },
    desc: { color: colors.textSecondary, marginTop: 2 },
    right: { flexDirection: "row", alignItems: "center", gap: 8 },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 16,
      ...Platform.select({ android: { elevation: 10 } }),
    },
    timeInfo: {
      backgroundColor: colors.card,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    timeInfoText: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: "center",
    },
    pickerContainer: {
      alignItems: "center",
      marginVertical: 16,
    },
    toggle: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 12,
    },
    actions: { flexDirection: "row", gap: 12, marginTop: 16 },
    btn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: "center",
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    btnPrimary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    btnTextPrimary: { color: colors.onPrimary, fontWeight: "700" },
    errorText: {
      color: colors.error,
      fontSize: 12,
      textAlign: "center",
      marginTop: 8,
    },
  });

  const formatTimeRemaining = () => {
    if (timeInfo.totalHours > 0) {
      return `${timeInfo.totalHours}h ${timeInfo.remainingMinutes}m remaining until deadline`;
    } else {
      return `${timeInfo.totalMinutes}m remaining until deadline`;
    }
  };

  const formatSelectedTime = () => {
    const now = new Date();
    const selectedTime = new Date(tempTime);
    const offsetMs = selectedTime.getTime() - now.getTime();
    const offsetMinutes = Math.floor(offsetMs / (1000 * 60));
    const offsetHours = Math.floor(offsetMinutes / 60);
    const remainingMins = offsetMinutes % 60;

    if (offsetHours > 0) {
      return `Reminder in ${offsetHours}h ${remainingMins}m`;
    } else {
      return `Reminder in ${offsetMinutes}m`;
    }
  };

  const handleTimeChange = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      const now = new Date();
      const selectedTime = new Date(selectedDate);

      // Ensure the selected time doesn't exceed the maximum allowed
      if (maxOffsetMs) {
        const maxTime = new Date(now.getTime() + maxOffsetMs);
        if (selectedTime > maxTime) {
          // If selected time exceeds max, clamp it to the maximum allowed time
          setTempTime(maxTime);
          return;
        }
      }

      // Ensure the selected time is in the future
      if (selectedTime <= now) {
        const minTime = new Date(now.getTime() + 60000); // At least 1 minute in the future
        setTempTime(minTime);
        return;
      }

      setTempTime(selectedTime);
    }
  };

  const handleConfirm = () => {
    if (isInvalid) return;

    const next: ReminderSettings = {
      enabled: true,
      preset: "custom",
      customOffsetMs: currentOffsetMs,
      spamMode: settings.spamMode,
    };
    setSettings(next);
    onChange(next);
    setShow(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={() => setShow(true)}
        activeOpacity={0.7}>
        <View>
          <Text style={styles.title}>Remind me</Text>
          <Text style={styles.desc}>
            {summary}
            {settings.spamMode ? " • Spam mode" : ""}
          </Text>
        </View>
        <View style={styles.right}>
          <Ionicons
            name="notifications-outline"
            size={18}
            color={colors.textSecondary}
          />
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      <Modal
        transparent
        visible={show}
        animationType="slide"
        onRequestClose={() => setShow(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <Text style={[styles.title, { marginBottom: 8 }]}>
              Remind me before
            </Text>

            {/* Time remaining info */}
            <View style={styles.timeInfo}>
              <Text style={styles.timeInfoText}>{formatTimeRemaining()}</Text>
              <Text
                style={[
                  styles.timeInfoText,
                  { marginTop: 4, fontWeight: "600" },
                ]}>
                {formatSelectedTime()}
              </Text>
            </View>

            {/* Time picker */}
            <View style={styles.pickerContainer}>
              {Platform.OS === "ios" ? (
                <DateTimePicker
                  value={tempTime}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                  minuteInterval={timeInfo.totalHours === 0 ? 1 : 15} // 1 minute intervals if less than 1 hour
                />
              ) : (
                <CustomDatePicker
                  value={tempTime}
                  mode="time"
                  onDateChange={(date) => setTempTime(date)}
                />
              )}
            </View>

            {/* Error message */}
            {isInvalid && (
              <Text style={styles.errorText}>
                {currentOffsetMs <= 0
                  ? "Please select a time in the future"
                  : "Selected time exceeds task deadline"}
              </Text>
            )}

            {/* Spam mode toggle */}
            <TouchableOpacity
              style={styles.toggle}
              onPress={() =>
                setSettings({
                  ...settings,
                  enabled: true,
                  spamMode: !settings.spamMode,
                })
              }
              activeOpacity={0.7}>
              <Ionicons
                name={settings.spamMode ? "checkbox" : "square-outline"}
                size={18}
                color={
                  settings.spamMode ? colors.primary : colors.textSecondary
                }
              />
              <Text style={{ color: colors.text }}>Spam me mode</Text>
            </TouchableOpacity>

            {/* Action buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.btn}
                onPress={() => {
                  setShow(false);
                }}
                activeOpacity={0.7}>
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.btn,
                  styles.btnPrimary,
                  isInvalid && { opacity: 0.5 },
                ]}
                onPress={handleConfirm}
                activeOpacity={0.7}>
                <Text style={styles.btnTextPrimary}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default RemindMeButton;
