import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { RADII } from "../../theme";
import { typography } from "../../typography";

type Props = {
  bestStreak: number;
  rate7: number;
  rate30: number;
  totalDone: number;
};

const pct = (r: number) => `${Math.round(r * 100)}%`;

const HabitStatsGrid: React.FC<Props> = ({
  bestStreak,
  rate7,
  rate30,
  totalDone,
}) => {
  const { colors } = useTheme();

  const cells = [
    { label: "Best streak", value: String(bestStreak), sub: "days" },
    { label: "Last 7 days", value: pct(rate7), sub: "on schedule" },
    { label: "Last 30 days", value: pct(rate30), sub: "on schedule" },
    { label: "Total done", value: String(totalDone), sub: "check-ins" },
  ];

  return (
    <View style={styles.grid}>
      {cells.map((c) => (
        <View
          key={c.label}
          style={[
            styles.cell,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}>
          <Text
            style={[typography.caption, { color: colors.textSecondary }]}>
            {c.label}
          </Text>
          <Text style={[typography.titleMedium, { color: colors.text }]}>
            {c.value}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {c.sub}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  cell: {
    width: "48%",
    flexGrow: 1,
    minWidth: "45%",
    borderRadius: RADII.md,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
});

export default HabitStatsGrid;
