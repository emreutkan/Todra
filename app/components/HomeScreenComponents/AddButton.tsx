import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface AddButtonProps {
  onPress: () => void;
  label?: string;
  showShadow?: boolean;
}

const AddButton: React.FC<AddButtonProps> = ({
  onPress,
  label = "Add New Task",
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
        { backgroundColor: colors.primary },
        showShadow && [styles.shadow, { shadowColor: colors.primary }],
      ]}>
      <Ionicons name="add" size={24} color={colors.onPrimary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 34 : 20,
    right: 20,
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

export default AddButton;
