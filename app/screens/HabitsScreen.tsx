import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import EmptyHabitsState from "../components/HabitComponents/EmptyHabitsState";
import HabitCard from "../components/HabitComponents/HabitCard";
import HabitsBottomBar from "../components/HabitComponents/HabitsBottomBar";
import ScreenHeader from "../components/common/ScreenHeader";
import { useTheme } from "../context/ThemeContext";
import { useHabits } from "../hooks/useHabits";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { HOME_GUTTER } from "../theme";
import { RootStackParamList, Habit } from "../types";
import { typography } from "../typography";
import {
  aggregateHabitsSummary,
  getCompletionForDate,
  isHabitScheduledForDate,
} from "../utils/habitUtils";

type Nav = NativeStackNavigationProp<RootStackParamList, "Habits">;

const HabitsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { habits, loading, todayStr, toggleCompletion } = useHabits();

  const headerOpacity = React.useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const headerY = React.useRef(new Animated.Value(reducedMotion ? 0 : 12)).current;
  const listOpacity = React.useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const listY = React.useRef(new Animated.Value(reducedMotion ? 0 : 10)).current;
  const footerOpacity = React.useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const footerY = React.useRef(new Animated.Value(reducedMotion ? 0 : 16)).current;

  React.useEffect(() => {
    if (reducedMotion) {
      headerOpacity.setValue(1);
      headerY.setValue(0);
      listOpacity.setValue(1);
      listY.setValue(0);
      footerOpacity.setValue(1);
      footerY.setValue(0);
      return;
    }
    const easing = Easing.out(Easing.cubic);
    const duration = 400;
    const slide = (o: Animated.Value, y: Animated.Value) =>
      Animated.parallel([
        Animated.timing(o, {
          toValue: 1,
          duration,
          easing,
          useNativeDriver: true,
        }),
        Animated.timing(y, {
          toValue: 0,
          duration,
          easing,
          useNativeDriver: true,
        }),
      ]);
    const seq = Animated.stagger(88, [
      slide(headerOpacity, headerY),
      slide(listOpacity, listY),
      slide(footerOpacity, footerY),
    ]);
    seq.start();
    return () => seq.stop();
  }, [
    reducedMotion,
    headerOpacity,
    headerY,
    listOpacity,
    listY,
    footerOpacity,
    footerY,
  ]);

  const sortedActive = useMemo(() => {
    const active = habits.filter((h) => !h.isArchived);
    const t = todayStr;
    return [...active].sort((a, b) => {
      const aS = isHabitScheduledForDate(a, t);
      const bS = isHabitScheduledForDate(b, t);
      if (aS !== bS) return aS ? -1 : 1;
      if (aS && bS) {
        const aC = !!getCompletionForDate(a, t);
        const bC = !!getCompletionForDate(b, t);
        if (aC !== bC) return aC ? 1 : -1;
      }
      return a.title.localeCompare(b.title);
    });
  }, [habits, todayStr]);

  const summary = useMemo(
    () => aggregateHabitsSummary(habits, todayStr),
    [habits, todayStr]
  );

  const handleToggle = useCallback(
    async (habitId: string, phaseName?: string) => {
      await toggleCompletion(habitId, todayStr, phaseName);
    },
    [toggleCompletion, todayStr]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Habit; index: number }) => (
      <HabitCard
        habit={item}
        todayStr={todayStr}
        index={index}
        onToggle={handleToggle}
        onPress={(id) => navigation.navigate("HabitDetail", { habitId: id })}
      />
    ),
    [handleToggle, navigation, todayStr]
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScreenHeader
        title="Habits"
        rightComponent={
          <TouchableOpacity
            onPress={() => navigation.navigate("AddHabit", undefined)}
            hitSlop={12}
            accessibilityLabel="Add habit"
            accessibilityRole="button">
            <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      <View style={[styles.body, { paddingHorizontal: HOME_GUTTER }]}>
        <Animated.View
          style={{
            opacity: headerOpacity,
            transform: [{ translateY: headerY }],
          }}>
          <View
            style={[
              styles.statsStrip,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
              Today:{" "}
              <Text style={[typography.bodySemiBold, { color: colors.text }]}>
                {summary.todayDone} / {summary.todayTotal}
              </Text>
              {" · "}
              Streak:{" "}
              <Text style={[typography.bodySemiBold, { color: colors.text }]}>
                {summary.streakDays} days
              </Text>
              {" · "}
              All-time:{" "}
              <Text style={[typography.bodySemiBold, { color: colors.text }]}>
                {summary.allTimePct}%
              </Text>
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.listWrap,
            {
              opacity: listOpacity,
              transform: [{ translateY: listY }],
            },
          ]}>
          {loading ? (
            <ActivityIndicator
              style={styles.loader}
              color={colors.primary}
              size="large"
            />
          ) : sortedActive.length === 0 ? (
            <EmptyHabitsState />
          ) : (
            <FlatList
              data={sortedActive}
              keyExtractor={(h) => h.id}
              renderItem={renderItem}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: insets.bottom + 100 },
              ]}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.footerDock,
          {
            opacity: footerOpacity,
            transform: [{ translateY: footerY }],
          },
        ]}>
        <HabitsBottomBar
          onSettingsPress={() => navigation.navigate("Settings")}
          onAddHabitPress={() => navigation.navigate("AddHabit", undefined)}
          onAssistantPress={() => navigation.navigate("AiAssistant")}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1 },
  statsStrip: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  listWrap: { flex: 1 },
  listContent: { paddingTop: 4 },
  loader: { marginTop: 48 },
  footerDock: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default HabitsScreen;
