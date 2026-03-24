import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { habitStorageService } from "../services/habitStorageService";
import { Habit } from "../types";
import { habitDateStr, isHabitScheduledForDate } from "../utils/habitUtils";

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHabits = useCallback(async () => {
    setLoading(true);
    try {
      const list = await habitStorageService.getHabits();
      setHabits(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHabits();
    }, [loadHabits])
  );

  const todayStr = habitDateStr(new Date());

  const todayHabits = useMemo(
    () =>
      habits.filter(
        (h) =>
          !h.isArchived && isHabitScheduledForDate(h, todayStr)
      ),
    [habits, todayStr]
  );

  const toggleCompletion = useCallback(
    async (habitId: string, date: string, phaseName?: string) => {
      const ok = await habitStorageService.toggleCompletion(
        habitId,
        date,
        phaseName
      );
      if (ok) await loadHabits();
      return ok;
    },
    [loadHabits]
  );

  const deleteHabit = useCallback(
    async (habitId: string) => {
      const ok = await habitStorageService.deleteHabit(habitId);
      if (ok) await loadHabits();
      return ok;
    },
    [loadHabits]
  );

  const archiveHabit = useCallback(
    async (habitId: string) => {
      const ok = await habitStorageService.archiveHabit(habitId);
      if (ok) await loadHabits();
      return ok;
    },
    [loadHabits]
  );

  return {
    habits,
    todayHabits,
    loading,
    loadHabits,
    todayStr,
    toggleCompletion,
    deleteHabit,
    archiveHabit,
  };
}
