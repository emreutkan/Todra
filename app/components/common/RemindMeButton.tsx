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

  const summary = useMemo(() => {
    if (!settings.enabled || settings.preset === "none") return "Off";
    if (settings.preset === "custom" && settings.customOffsetMs) {
      const mins = Math.round(settings.customOffsetMs / 60000);
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h}h ${m}m before`;
    }
    return `${settings.preset} before`;
  }, [settings]);

  // Backed by a Date just to reuse the spinner UI; treat H:M as offset
  const initialMs =
    settings.customOffsetMs ?? presetToMs(settings.preset) ?? 60 * 60 * 1000;
  const init = new Date();
  init.setHours(
    Math.floor((initialMs / 3600000) % 24),
    Math.floor((initialMs % 3600000) / 60000),
    0,
    0
  );
  const [tempTime, setTempTime] = useState<Date>(init);

  const currentOffsetMs = (() => {
    const h = tempTime.getHours();
    const m = tempTime.getMinutes();
    return h * 3600000 + m * 60000;
  })();
  const maxAllowed = maxOffsetMs ?? Number.POSITIVE_INFINITY;
  const isInvalid = currentOffsetMs > maxAllowed;

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
    row: { flexDirection: "row", gap: 8, marginTop: 8 },
    chip: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: "center",
    },
    chipSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + "10",
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
  });

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
            <DateTimePicker
              value={tempTime}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, d) => d && setTempTime(d)}
            />
            {maxOffsetMs !== undefined && (
              <Text
                style={{
                  color: isInvalid ? "red" : colors.textSecondary,
                  marginTop: 8,
                }}>
                {isInvalid
                  ? "Selected offset exceeds time remaining"
                  : "Pick hours and minutes to notify before deadline"}
              </Text>
            )}

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
                onPress={() => {
                  if (isInvalid) return;
                  const hours = tempTime.getHours();
                  const minutes = tempTime.getMinutes();
                  const customOffsetMs = hours * 3600000 + minutes * 60000;
                  const next: ReminderSettings = {
                    enabled: true,
                    preset: "custom",
                    customOffsetMs,
                    spamMode: settings.spamMode,
                  };
                  setSettings(next);
                  onChange(next);
                  setShow(false);
                }}
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
