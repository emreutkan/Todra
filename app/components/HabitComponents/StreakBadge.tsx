import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { typography } from "../../typography";

type Props = {
  count: number;
};

const StreakBadge: React.FC<Props> = ({ count }) => {
  const { colors } = useTheme();
  const hot = count > 7;

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        hot && styles.hotGlow,
        hot && { shadowColor: colors.warning },
      ]}>
      <Ionicons
        name="flame"
        size={22}
        color={hot ? colors.warning : colors.accent}
      />
      <Text style={[typography.headline, { color: colors.text }]}>
        {count}
      </Text>
      <Text style={[typography.caption, { color: colors.textSecondary }]}>
        day streak
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  hotGlow: {
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});

export default StreakBadge;
