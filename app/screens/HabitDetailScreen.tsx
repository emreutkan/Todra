import { Ionicons } from "@expo/vector-icons";
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HabitCalendarHeatmap, {
  formatHabitMonthTitle,
} from "../components/HabitComponents/HabitCalendarHeatmap";
import HabitCheckbox from "../components/HabitComponents/HabitCheckbox";
import HabitStatsGrid from "../components/HabitComponents/HabitStatsGrid";
import PhaseChip from "../components/HabitComponents/PhaseChip";
import StreakBadge from "../components/HabitComponents/StreakBadge";
import ScreenHeader from "../components/common/ScreenHeader";
import { useTheme } from "../context/ThemeContext";
import { useHabitAnalytics } from "../hooks/useHabitAnalytics";
import { habitStorageService } from "../services/habitStorageService";
import { SIZES } from "../theme";
import { Habit, RootStackParamList } from "../types";
import { typography } from "../typography";
import {
  getCompletionForDate,
  getCurrentPhaseForDate,
  habitDateStr,
  isHabitScheduledForDate,
} from "../utils/habitUtils";

type Nav = NativeStackNavigationProp<RootStackParamList, "HabitDetail">;
type R = RouteProp<RootStackParamList, "HabitDetail">;

const PLACEHOLDER_HABIT: Habit = {
  id: "__placeholder__",
  title: "",
  description: "",
  category: "",
  color: "#888888",
  icon: "ellipse-outline",
  scheduleType: "daily",
  intervalDays: 1,
  intervalPhases: [],
  dayPhases: [],
  startDate: "2000-01-01",
  completions: [],
  createdAt: 0,
  isArchived: false,
};

const HabitDetailScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { habitId } = route.params;
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await habitStorageService.getHabits();
      setHabit(list.find((h) => h.id === habitId) ?? null);
    } finally {
      setLoading(false);
    }
  }, [habitId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const effectiveHabit = habit ?? PLACEHOLDER_HABIT;
  const {
    currentStreak,
    bestStreak,
    totalCompletions,
    completionRateLast7,
    completionRateLast30,
    calendarData,
    calendarMonth,
    goPrevMonth,
    goNextMonth,
    phaseBreakdown,
    missedDays,
  } = useHabitAnalytics(effectiveHabit);

  const todayStr = useMemo(() => habitDateStr(new Date()), []);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!habit) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          This habit is no longer available.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginTop: 16 }}
          accessibilityRole="button">
          <Text style={[typography.bodySemiBold, { color: colors.primary }]}>
            Go back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const phaseToday = getCurrentPhaseForDate(habit, todayStr);
  const scheduledToday = isHabitScheduledForDate(habit, todayStr);
  const completedToday = Boolean(getCompletionForDate(habit, todayStr));

  const toggleToday = async () => {
    const phaseName = phaseToday ?? undefined;
    await habitStorageService.toggleCompletion(
      habit.id,
      todayStr,
      phaseName
    );
    await load();
  };

  const iconName =
    (habit.icon as keyof typeof Ionicons.glyphMap) || "ellipse-outline";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScreenHeader
        title="Habit"
        showBackButton
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("AddHabit", { habitId: habit.id })
            }
            accessibilityLabel="Edit habit"
            accessibilityRole="button">
            <Text style={[typography.bodySemiBold, { color: colors.primary }]}>
              Edit
            </Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { borderColor: habit.color }]}>
          <View style={styles.heroTop}>
            <Ionicons name={iconName} size={32} color={habit.color} />
            <View style={styles.heroText}>
              <Text style={[typography.heroTitle, { color: colors.text }]}>
                {habit.title}
              </Text>
              {habit.description ? (
                <Text
                  style={[
                    typography.bodySmall,
                    { color: colors.textSecondary, marginTop: 6 },
                  ]}>
                  {habit.description}
                </Text>
              ) : null}
            </View>
          </View>
          {phaseToday ? (
            <PhaseChip label={phaseToday} habitColor={habit.color} />
          ) : null}
          <View style={styles.bigCheckWrap}>
            <View style={{ transform: [{ scale: 1.55 }] }}>
              <HabitCheckbox
                checked={completedToday}
                onToggle={() => void toggleToday()}
                accentColor={habit.color}
                disabled={!scheduledToday}
              />
            </View>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {scheduledToday
                ? completedToday
                  ? "Done for today"
                  : "Mark today"
                : "Rest day — not on your schedule"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              typography.titleMedium,
              { color: colors.text, marginBottom: 10 },
            ]}>
            Streaks
          </Text>
          <StreakBadge count={currentStreak} />
        </View>

        <View style={styles.section}>
          <HabitStatsGrid
            bestStreak={bestStreak}
            rate7={completionRateLast7}
            rate30={completionRateLast30}
            totalDone={totalCompletions}
          />
          <Text
            style={[
              typography.caption,
              {
                color: colors.textSecondary,
                marginTop: 10,
                textAlign: "center",
              },
            ]}>
            Missed scheduled days (to date): {missedDays}
          </Text>
        </View>

        {phaseBreakdown && Object.keys(phaseBreakdown).length > 0 ? (
          <View style={styles.section}>
            <Text
              style={[
                typography.titleMedium,
                { color: colors.text, marginBottom: 10 },
              ]}>
              By phase
            </Text>
            <View
              style={[
                styles.phaseBox,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              {Object.entries(phaseBreakdown).map(([name, n]) => (
                <View key={name} style={styles.phaseRow}>
                  <Text style={[typography.body, { color: colors.text }]}>
                    {name}
                  </Text>
                  <Text
                    style={[typography.bodySemiBold, { color: colors.primary }]}>
                    {n}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.monthNav}>
            <TouchableOpacity
              onPress={goPrevMonth}
              accessibilityLabel="Previous month"
              accessibilityRole="button">
              <Ionicons name="chevron-back" size={26} color={colors.text} />
            </TouchableOpacity>
            <Text style={[typography.titleMedium, { color: colors.text }]}>
              {formatHabitMonthTitle(calendarMonth)}
            </Text>
            <TouchableOpacity
              onPress={goNextMonth}
              accessibilityLabel="Next month"
              accessibilityRole="button">
              <Ionicons name="chevron-forward" size={26} color={colors.text} />
            </TouchableOpacity>
          </View>
          <HabitCalendarHeatmap
            days={calendarData}
            month={calendarMonth}
            habitColor={habit.color}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { paddingHorizontal: SIZES.medium, paddingTop: 8 },
  hero: {
    borderWidth: 1,
    borderLeftWidth: 5,
    borderRadius: 16,
    padding: SIZES.medium,
    gap: 14,
    marginBottom: SIZES.large,
  },
  heroTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  heroText: { flex: 1, minWidth: 0 },
  bigCheckWrap: {
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  section: { marginBottom: SIZES.large },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  phaseBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  phaseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

export default HabitDetailScreen;
