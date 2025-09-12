import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface ActionFooterProps {
  onCancel: () => void;
  onSave: () => void;
  saveEnabled: boolean;
}

const ActionFooter: React.FC<ActionFooterProps> = ({
  onCancel,
  onSave,
  saveEnabled,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.footer,
        {
          borderTopColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}>
      <TouchableOpacity
        style={[
          styles.cancelButton,
          {
            borderColor: colors.border,
            backgroundColor: isDark
              ? "rgba(255,255,255,0.05)"
              : "rgba(0,0,0,0.03)",
          },
        ]}
        onPress={onCancel}
        activeOpacity={0.7}
        accessibilityLabel="Cancel task creation"
        accessibilityRole="button">
        <Ionicons name="close-outline" size={22} color={colors.text} />
        <Text style={[styles.cancelButtonText, { color: colors.text }]}>
          Cancel
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.saveButton,
          { backgroundColor: colors.primary },
          !saveEnabled && { opacity: 0.6 },
        ]}
        onPress={onSave}
        disabled={!saveEnabled}
        activeOpacity={0.7}
        accessibilityLabel="Save task"
        accessibilityRole="button"
        accessibilityState={{ disabled: !saveEnabled }}>
        <Text style={[styles.saveButtonText, { color: colors.onPrimary }]}>
          Save Task
        </Text>
        <Ionicons name="checkmark-outline" size={22} color={colors.onPrimary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 12,
    flex: 1,
  },
  saveButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    // elevation: 5,
  },
  cancelButtonText: {
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 16,
  },
  saveButtonText: {
    fontWeight: "600",
    marginRight: 8,
    fontSize: 16,
  },
});

export default ActionFooter;
