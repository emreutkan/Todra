import { format, getDay, startOfMonth } from "date-fns";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { CalendarDayData } from "../../utils/habitUtils";
import { typography } from "../../typography";

const WEEK_HEADERS = ["S", "M", "T", "W", "T", "F", "S"];

type Props = {
  days: CalendarDayData[];
  month: Date;
  habitColor: string;
};

const HabitCalendarHeatmap: React.FC<Props> = ({
  days,
  month,
  habitColor,
}) => {
  const { colors } = useTheme();
  const pad = getDay(startOfMonth(month));
  const cells: (CalendarDayData | "pad")[] = [
    ...Array(pad).fill("pad" as const),
    ...days,
  ];
  while (cells.length % 7 !== 0) {
    cells.push("pad");
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.weekRow}>
        {WEEK_HEADERS.map((h, i) => (
          <Text
            key={`${h}-${i}`}
            style={[
              styles.weekLabel,
              typography.captionSemiBold,
              { color: colors.textSecondary },
            ]}>
            {h}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((cell, i) => {
          if (cell === "pad") {
            return <View key={`p-${i}`} style={styles.cell} />;
          }
          const { scheduled, completed, date } = cell;
          let bg = "transparent";
          if (!scheduled) {
            bg = colors.surface + "4D";
          } else if (completed) {
            bg = habitColor;
          } else {
            bg = colors.error + "33";
          }
          const dayNum = date.slice(-2).replace(/^0/, "");
          return (
            <View
              key={date}
              style={[
                styles.cell,
                {
                  backgroundColor: bg,
                  borderColor: colors.border,
                },
              ]}
              accessibilityLabel={`${date}, ${
                !scheduled
                  ? "not scheduled"
                  : completed
                  ? "completed"
                  : "missed"
              }`}>
              <Text
                style={[
                  typography.captionSemiBold,
                  {
                    color: completed
                      ? "#FFFFFF"
                      : scheduled
                      ? colors.text
                      : colors.textSecondary,
                  },
                ]}>
                {scheduled || completed ? dayNum : ""}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={styles.legend}>
        <LegendDot
          color={colors.surface + "4D"}
          label="Off day"
          themeColors={colors}
        />
        <LegendDot
          color={colors.error + "33"}
          label="Missed"
          themeColors={colors}
        />
        <LegendDot color={habitColor} label="Done" themeColors={colors} />
      </View>
    </View>
  );
};

function LegendDot({
  color,
  label,
  themeColors,
}: {
  color: string;
  label: string;
  themeColors: { textSecondary: string };
}) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text style={[typography.caption, { color: themeColors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  weekLabel: {
    width: `${100 / 7}%`,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    maxWidth: `${100 / 7}%`,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    marginBottom: 4,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
});

export const formatHabitMonthTitle = (d: Date) => format(d, "MMMM yyyy");

export default HabitCalendarHeatmap;
