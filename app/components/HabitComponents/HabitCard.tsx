import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useTheme } from "../../context/ThemeContext";
import { Habit } from "../../types";
import { SIZES } from "../../theme";
import { typography } from "../../typography";
import {
  getCompletionForDate,
  getCurrentPhaseForDate,
  isHabitScheduledForDate,
} from "../../utils/habitUtils";
import HabitCheckbox from "./HabitCheckbox";
import PhaseChip from "./PhaseChip";

type Props = {
  habit: Habit;
  todayStr: string;
  index: number;
  onToggle: (habitId: string, phaseName?: string) => void;
  onPress: (habitId: string) => void;
};

const HabitCard: React.FC<Props> = ({
  habit,
  todayStr,
  index,
  onToggle,
  onPress,
}) => {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(reducedMotion ? 0 : 10)).current;

  const scheduledToday =
    !habit.isArchived && isHabitScheduledForDate(habit, todayStr);

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }
    const delay = Math.min(index, 10) * 88;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, reducedMotion, opacity, translateY]);

  const phaseName = getCurrentPhaseForDate(habit, todayStr);
  const completed = Boolean(getCompletionForDate(habit, todayStr));

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
      }}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderLeftColor: habit.color,
          },
        ]}>
        <HabitCheckbox
          checked={completed}
          onToggle={() =>
            onToggle(
              habit.id,
              phaseName ?? undefined
            )
          }
          accentColor={habit.color}
          disabled={!scheduledToday}
        />
        <TouchableOpacity
          style={styles.main}
          onPress={() => onPress(habit.id)}
          activeOpacity={0.92}
          accessibilityRole="button"
          accessibilityLabel={`${habit.title}. Open habit details`}>
          <View style={styles.titleRow}>
            <Ionicons
              name={(habit.icon as keyof typeof Ionicons.glyphMap) || "ellipse-outline"}
              size={18}
              color={habit.color}
              style={styles.icon}
            />
            <Text
              style={[
                typography.bodySemiBold,
                styles.title,
                {
                  color: colors.text,
                  textDecorationLine: completed ? "line-through" : "none",
                },
              ]}
              numberOfLines={2}>
              {habit.title}
            </Text>
          </View>
          {phaseName ? (
            <PhaseChip label={phaseName} habitColor={habit.color} />
          ) : null}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: SIZES.medium,
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: 10,
  },
  main: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  icon: {
    marginTop: 1,
  },
  title: {
    flex: 1,
  },
});

export default HabitCard;
