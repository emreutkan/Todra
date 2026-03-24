import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { RADII, SIZES } from "../../theme";
import { typography } from "../../typography";

interface SettingsListRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  isDestructive?: boolean;
  marginTop?: number;
}

const SettingsListRow: React.FC<SettingsListRowProps> = ({
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
        marginTop: marginTop || SIZES.base,
      };
    }
    return {
      backgroundColor: colors.surface,
      marginTop: marginTop || SIZES.base,
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
    paddingVertical: SIZES.small,
    paddingHorizontal: SIZES.medium,
    borderRadius: RADII.sm,
  },
  settingIcon: {
    marginRight: SIZES.small,
  },
  settingButtonText: {
    flex: 1,
    ...typography.body,
  },
});

export default SettingsListRow;
