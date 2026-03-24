import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GlassBar from "../common/GlassBar";
import AddButton from "../HomeScreenComponents/AddButton";
import AssistantNavFab from "../HomeScreenComponents/AssistantNavFab";
import SettingsFab from "../HomeScreenComponents/SettingsFab";
import { useTheme } from "../../context/ThemeContext";
import { typography } from "../../typography";

type Props = {
  onSettingsPress: () => void;
  onAddHabitPress: () => void;
  onAssistantPress: () => void;
};

const HabitsBottomBar: React.FC<Props> = ({
  onSettingsPress,
  onAddHabitPress,
  onAssistantPress,
}) => {
  const { colors } = useTheme();
  const bottomInsets = useSafeAreaInsets();

  return (
    <GlassBar
      wrapperStyle={{ marginBottom: Math.max(bottomInsets.bottom, 10) }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <SettingsFab onPress={onSettingsPress} showShadow={false} />
        <View
          style={[
            styles.pill,
            {
              backgroundColor: colors.primaryMuted,
              borderColor: colors.accent,
            },
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          <View style={[styles.dot, { backgroundColor: colors.accent }]} />
          <Text style={[typography.captionSemiBold, { color: colors.text }]}>
            Habits
          </Text>
        </View>
        <AddButton onPress={onAddHabitPress} showShadow={false} label="Add new habit" />
        <AssistantNavFab onPress={onAssistantPress} showShadow={false} />
      </View>
    </GlassBar>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    height: 56,
    borderRadius: 100,
    borderWidth: 1.5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default HabitsBottomBar;
