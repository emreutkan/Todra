import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import ColorSwatch from "./ColorSwatch";

export const HABIT_ACCENT_SWATCHES = [
  "#D97706",
  "#EA580C",
  "#DC2626",
  "#DB2777",
  "#9333EA",
  "#6366F1",
  "#2563EB",
  "#0891B2",
  "#059669",
  "#65A30D",
  "#CA8A04",
  "#78716C",
] as const;

type Props = {
  value: string;
  onChange: (hex: string) => void;
};

const HabitColorPicker: React.FC<Props> = ({ value, onChange }) => {
  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {HABIT_ACCENT_SWATCHES.map((c) => (
          <ColorSwatch
            key={c}
            color={c}
            selected={value === c}
            onSelect={() => onChange(c)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginVertical: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingRight: 8,
  },
});

export default HabitColorPicker;
