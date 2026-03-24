import React from "react";
import { StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { DayPhase } from "../../types";
import { RADII } from "../../theme";
import { typography } from "../../typography";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type Props = {
  dayPhases: DayPhase[];
  onToggleDay: (dayOfWeek: number) => void;
  onUpdateName: (dayOfWeek: number, name: string) => void;
};

const DayPhaseEditor: React.FC<Props> = ({
  dayPhases,
  onToggleDay,
  onUpdateName,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      {DAY_LABELS.map((label, dayOfWeek) => {
        const active = dayPhases.some((d) => d.dayOfWeek === dayOfWeek);
        const entry = dayPhases.find((d) => d.dayOfWeek === dayOfWeek);
        return (
          <View
            key={label}
            style={[
              styles.row,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}>
            <View style={styles.dayCol}>
              <Text style={[typography.bodySemiBold, { color: colors.text }]}>
                {label}
              </Text>
            </View>
            <Switch
              value={active}
              onValueChange={() => onToggleDay(dayOfWeek)}
              trackColor={{ false: colors.border, true: colors.primaryMuted }}
              thumbColor={active ? colors.primary : colors.surface}
            />
            {active ? (
              <TextInput
                value={entry?.name ?? ""}
                onChangeText={(t) => onUpdateName(dayOfWeek, t)}
                placeholder="Phase name"
                placeholderTextColor={colors.textSecondary}
                style={[
                  typography.body,
                  styles.input,
                  { color: colors.text, backgroundColor: colors.surface },
                ]}
              />
            ) : (
              <View style={styles.inputPlaceholder} />
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: RADII.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dayCol: {
    width: 36,
  },
  input: {
    flex: 1,
    borderRadius: RADII.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 40,
  },
  inputPlaceholder: {
    flex: 1,
    minHeight: 40,
  },
});

export default DayPhaseEditor;
