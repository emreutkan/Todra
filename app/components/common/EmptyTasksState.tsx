import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { SIZES } from "../../theme";
import { typography } from "../../typography";

interface EmptyTasksStateProps {
  title?: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

const EmptyTasksState: React.FC<EmptyTasksStateProps> = ({
  title = "No tasks",
  subtitle = "Tap + below to add your first task for this day.",
  icon = "calendar-outline",
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.content,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}>
        <Ionicons
          name={icon}
          size={64}
          color={colors.primary}
          style={{ opacity: 0.38 }}
        />
        <Text
          style={[typography.headline, styles.title, { color: colors.text }]}>
          {title}
        </Text>
        <Text
          style={[
            typography.bodySmall,
            styles.subtitle,
            { color: colors.textSecondary },
          ]}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SIZES.medium,
    paddingVertical: SIZES.large,
  },
  content: {
    width: "100%",
    maxWidth: 340,
    paddingVertical: SIZES.extraLarge,
    paddingHorizontal: SIZES.medium,
    borderRadius: SIZES.base + 6,
    alignItems: "center",
    borderWidth: 1,
  },
  title: {
    marginTop: SIZES.medium,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginTop: SIZES.small,
    paddingHorizontal: SIZES.small,
  },
});

export default EmptyTasksState;
