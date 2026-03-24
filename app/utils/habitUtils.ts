import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isAfter,
  isBefore,
  max as maxDate,
  min as minDate,
  parseISO,
  startOfMonth,
} from "date-fns";
import { Habit, HabitCompletion } from "../types";

export const habitDateStr = (d: Date): string => format(d, "yyyy-MM-dd");

export function isWithinHabitDateBounds(
  habit: Habit,
  dateStr: string
): boolean {
  const d = parseISO(dateStr);
  const start = parseISO(habit.startDate);
  if (isBefore(d, start)) return false;
  if (habit.endDate) {
    const end = parseISO(habit.endDate);
    if (isAfter(d, end)) return false;
  }
  return true;
}

export function isHabitScheduledForDate(
  habit: Habit,
  dateStr: string
): boolean {
  if (!isWithinHabitDateBounds(habit, dateStr)) return false;

  if (habit.scheduleType === "daily") return true;

  if (habit.scheduleType === "interval") {
    const intervalDays = Math.max(1, habit.intervalDays || 1);
    const diff = differenceInCalendarDays(
      parseISO(dateStr),
      parseISO(habit.startDate)
    );
    return diff >= 0 && diff % intervalDays === 0;
  }

  if (habit.scheduleType === "weekly") {
    const dow = getDay(parseISO(dateStr));
    return habit.dayPhases.some((dp) => dp.dayOfWeek === dow);
  }

  return false;
}

export function getCurrentPhaseForDate(
  habit: Habit,
  dateStr: string
): string | null {
  if (!isHabitScheduledForDate(habit, dateStr)) return null;

  if (habit.scheduleType === "weekly") {
    const dow = getDay(parseISO(dateStr));
    const dp = habit.dayPhases.find((x) => x.dayOfWeek === dow);
    return dp?.name ?? null;
  }

  if (habit.scheduleType === "interval") {
    const phases = habit.intervalPhases ?? [];
    if (phases.length === 0) return null;
    const intervalDays = Math.max(1, habit.intervalDays || 1);
    const diff = differenceInCalendarDays(
      parseISO(dateStr),
      parseISO(habit.startDate)
    );
    const occurrenceIndex = Math.floor(diff / intervalDays);
    return phases[occurrenceIndex % phases.length] ?? null;
  }

  return null;
}

export function getCompletionForDate(
  habit: Habit,
  dateStr: string
): HabitCompletion | undefined {
  return habit.completions.find((c) => c.date === dateStr);
}

/** Scheduled calendar days from start through end (inclusive), as YYYY-MM-DD. */
export function listScheduledDaysInRange(
  habit: Habit,
  rangeStartStr: string,
  rangeEndStr: string
): string[] {
  const rangeStart = parseISO(rangeStartStr);
  const rangeEnd = parseISO(rangeEndStr);
  const habitStart = parseISO(habit.startDate);
  const start = maxDate([rangeStart, habitStart]);
  let end = rangeEnd;
  if (habit.endDate) {
    const habitEnd = parseISO(habit.endDate);
    end = minDate([end, habitEnd]);
  }
  if (isAfter(start, end)) return [];

  const out: string[] = [];
  let cursor = start;
  while (!isAfter(cursor, end)) {
    const s = habitDateStr(cursor);
    if (isHabitScheduledForDate(habit, s)) out.push(s);
    cursor = addDays(cursor, 1);
  }
  return out;
}

export function calcStreaks(habit: Habit): {
  currentStreak: number;
  bestStreak: number;
} {
  const todayStr = habitDateStr(new Date());
  const scheduledAsc = listScheduledDaysInRange(
    habit,
    habit.startDate,
    todayStr
  );

  let bestStreak = 0;
  let run = 0;
  for (const d of scheduledAsc) {
    if (getCompletionForDate(habit, d)) {
      run += 1;
      bestStreak = Math.max(bestStreak, run);
    } else {
      run = 0;
    }
  }

  let currentStreak = 0;
  for (let i = scheduledAsc.length - 1; i >= 0; i--) {
    const d = scheduledAsc[i];
    if (getCompletionForDate(habit, d)) {
      currentStreak += 1;
    } else {
      break;
    }
  }

  return { currentStreak, bestStreak };
}

export function calcCompletionRate(
  habit: Habit,
  startRangeStr: string,
  endRangeStr: string
): number {
  const scheduled = listScheduledDaysInRange(
    habit,
    startRangeStr,
    endRangeStr
  );
  if (scheduled.length === 0) return 0;
  const done = scheduled.filter((d) => getCompletionForDate(habit, d)).length;
  return done / scheduled.length;
}

export interface CalendarDayData {
  date: string;
  scheduled: boolean;
  completed: boolean;
  phaseName?: string | null;
}

export function buildCalendarData(habit: Habit, month: Date): CalendarDayData[] {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  return eachDayOfInterval({ start, end }).map((d) => {
    const date = habitDateStr(d);
    return {
      date,
      scheduled: isHabitScheduledForDate(habit, date),
      completed: Boolean(getCompletionForDate(habit, date)),
      phaseName: getCurrentPhaseForDate(habit, date),
    };
  });
}

export function countMissedScheduledDays(habit: Habit): number {
  const todayStr = habitDateStr(new Date());
  const scheduled = listScheduledDaysInRange(
    habit,
    habit.startDate,
    todayStr
  );
  return scheduled.filter((d) => !getCompletionForDate(habit, d)).length;
}

export function totalCompletions(habit: Habit): number {
  return habit.completions.length;
}

/** Completions grouped by stored phase snapshot (interval habits). */
export function phaseCompletionCounts(
  habit: Habit
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const c of habit.completions) {
    const key = c.phaseName?.trim() || "—";
    map[key] = (map[key] ?? 0) + 1;
  }
  return map;
}

/** Header strip on Habits list: today progress, best current streak, avg all-time rate. */
export function aggregateHabitsSummary(
  habits: Habit[],
  todayStr: string
): {
  todayDone: number;
  todayTotal: number;
  streakDays: number;
  allTimePct: number;
} {
  const active = habits.filter((h) => !h.isArchived);
  const scheduled = active.filter((h) => isHabitScheduledForDate(h, todayStr));
  const done = scheduled.filter((h) => getCompletionForDate(h, todayStr));
  let maxCurrent = 0;
  let sumRate = 0;
  const n = active.length;
  for (const h of active) {
    maxCurrent = Math.max(maxCurrent, calcStreaks(h).currentStreak);
    sumRate += calcCompletionRate(h, h.startDate, todayStr);
  }
  const allTimePct = n ? Math.round((sumRate / n) * 100) : 0;
  return {
    todayDone: done.length,
    todayTotal: scheduled.length,
    streakDays: maxCurrent,
    allTimePct,
  };
}
