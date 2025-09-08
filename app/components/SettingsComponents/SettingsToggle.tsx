import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, Switch, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface SettingsToggleProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const SettingsToggle: React.FC<SettingsToggleProps> = ({
  icon,
  label,
  value,
  onValueChange,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleInfo}>
        <Ionicons
          name={icon}
          size={22}
          color={colors.primary}
          style={styles.settingIcon}
        />
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          {label}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={
          Platform.OS === "ios"
            ? "#FFFFFF"
            : value
            ? colors.card
            : colors.textSecondary
        }
        ios_backgroundColor={colors.border}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  toggleInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
});

export default SettingsToggle;

