import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { typography } from "../../typography";

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
  const { colors } = useTheme();

  const getButtonStyle = () => {
    if (isDestructive) {
      return {
        backgroundColor: colors.destructiveSurface,
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
      return colors.destructiveText;
    }
    return colors.primary;
  };

  const getTextColor = () => {
    if (isDestructive) {
      return colors.destructiveText;
    }
    return colors.text;
  };

  const getChevronColor = () => {
    if (isDestructive) {
      return colors.destructiveText;
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
    ...typography.body,
  },
});

export default SettingsButton;
