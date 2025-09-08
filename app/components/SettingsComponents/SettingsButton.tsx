import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface SettingsButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  isDestructive?: boolean;
  marginTop?: number;
}

const SettingsButton: React.FC<SettingsButtonProps> = ({
  icon,
  label,
  onPress,
  isDestructive = false,
  marginTop = 0,
}) => {
  const { colors, isDark } = useTheme();

  const getButtonStyle = () => {
    if (isDestructive) {
      return {
        backgroundColor: isDark ? "#421b1b" : "#ffebeb",
        marginTop: marginTop || 8,
      };
    }
    return {
      backgroundColor: colors.surface,
      marginTop: marginTop || 8,
    };
  };

  const getIconColor = () => {
    if (isDestructive) {
      return isDark ? "#ff6b6b" : "#d63031";
    }
    return colors.primary;
  };

  const getTextColor = () => {
    if (isDestructive) {
      return isDark ? "#ff6b6b" : "#d63031";
    }
    return colors.text;
  };

  const getChevronColor = () => {
    if (isDestructive) {
      return isDark ? "#ff6b6b" : "#d63031";
    }
    return colors.text;
  };

  return (
    <TouchableOpacity
      style={[styles.settingButton, getButtonStyle()]}
      onPress={onPress}>
      <Ionicons
        name={icon}
        size={22}
        color={getIconColor()}
        style={styles.settingIcon}
      />
      <Text style={[styles.settingButtonText, { color: getTextColor() }]}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={getChevronColor()} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  settingButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingButtonText: {
    flex: 1,
    fontSize: 16,
  },
});

export default SettingsButton;

