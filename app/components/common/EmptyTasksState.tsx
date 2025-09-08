import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { SIZES } from "../../theme";

interface EmptyTasksStateProps {
  title?: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

const EmptyTasksState: React.FC<EmptyTasksStateProps> = ({
  title = "No tasks",
  subtitle = "Tap the + button to add a new task",
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
        <Ionicons name={icon} size={70} color={colors.text + "40"} />
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
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
    padding: 20,
  },
  content: {
    width: "100%",
    padding: 30,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  title: {
    fontSize: SIZES.large,
    fontWeight: "bold",
    marginTop: 20,
  },
  subtitle: {
    fontSize: SIZES.medium,
    textAlign: "center",
    marginTop: 10,
  },
});

export default EmptyTasksState;
