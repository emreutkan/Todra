import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface SettingsButtonProps {
  onPress: () => void;
  label?: string;
  showShadow?: boolean;
}

const SettingsButton: React.FC<SettingsButtonProps> = ({
  onPress,
  label = "Settings",
  showShadow = true,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      style={[
        styles.fab,
        { backgroundColor: colors.surface },
        showShadow && [styles.shadow, { shadowColor: colors.primary }],
      ]}>
      <Ionicons name="settings-outline" size={24} color={colors.text} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 34 : 20,
    right: 100, // Position to the left of the wider AddButton
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});

export default SettingsButton;
