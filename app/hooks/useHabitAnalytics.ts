import { addMonths, subMonths } from "date-fns";
import { useCallback, useMemo, useState } from "react";
import { Habit } from "../types";
import {
  buildCalendarData,
  calcCompletionRate,
  calcStreaks,
  countMissedScheduledDays,
  habitDateStr,
  phaseCompletionCounts,
  totalCompletions,
} from "../utils/habitUtils";

export function useHabitAnalytics(habit: Habit) {
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  const goPrevMonth = useCallback(() => {
    setCalendarMonth((m) => subMonths(m, 1));
  }, []);

  const goNextMonth = useCallback(() => {
    setCalendarMonth((m) => addMonths(m, 1));
  }, []);

  const { currentStreak, bestStreak } = useMemo(
    () => calcStreaks(habit),
    [habit]
  );

  const totalDone = useMemo(
    () => totalCompletions(habit),
    [habit]
  );

  const completionRateLast7 = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    return calcCompletionRate(habit, habitDateStr(start), habitDateStr(end));
  }, [habit]);

  const completionRateLast30 = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    return calcCompletionRate(habit, habitDateStr(start), habitDateStr(end));
  }, [habit]);

  const completionRateAllTime = useMemo(() => {
    const end = habitDateStr(new Date());
    return calcCompletionRate(habit, habit.startDate, end);
  }, [habit]);

  const missedDays = useMemo(
    () => countMissedScheduledDays(habit),
    [habit]
  );

  const calendarData = useMemo(
    () => buildCalendarData(habit, calendarMonth),
    [habit, calendarMonth]
  );

  const phaseBreakdown = useMemo(() => {
    if (habit.scheduleType !== "interval") return null;
    return phaseCompletionCounts(habit);
  }, [habit]);

  return {
    currentStreak,
    bestStreak,
    totalCompletions: totalDone,
    completionRateLast7,
    completionRateLast30,
    completionRateAllTime,
    missedDays,
    calendarData,
    calendarMonth,
    goPrevMonth,
    goNextMonth,
    phaseBreakdown,
  };
}
