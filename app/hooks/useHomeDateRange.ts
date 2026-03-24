import { useCallback, useMemo, useState } from "react";

/** ISO weekday: Monday = 0 … Sunday = 6 */
const mondayWeekdayIndex = (d: Date) => {
  const js = d.getDay(); // Sun=0 … Sat=6
  return js === 0 ? 6 : js - 1;
};

/** Calendar rows always Monday → Sunday: pad range to full weeks. */
function buildMondayStartDateRange(anchor: Date): Date[] {
  const selectedMonth = anchor.getMonth();
  const selectedYear = anchor.getFullYear();

  const monthStart = new Date(selectedYear, selectedMonth, 1);
  const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
  const monthEnd = new Date(
    selectedYear,
    selectedMonth,
    lastDay.getDate()
  );

  const start = new Date(monthStart);
  start.setDate(start.getDate() - mondayWeekdayIndex(monthStart));

  const end = new Date(monthEnd);
  const endIdx = mondayWeekdayIndex(end);
  end.setDate(end.getDate() + (6 - endIdx));

  const dates: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  // Extend into next month so user can scroll past month end (same as before).
  const tail = new Date(end);
  for (let i = 1; i <= 15; i++) {
    tail.setDate(tail.getDate() + 1);
    dates.push(new Date(tail));
  }

  return dates;
}

export const useHomeDateRange = () => {
  const today = useMemo(() => new Date(), []);
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(
    today.toLocaleString("default", { month: "long", year: "numeric" })
  );

  // Memoize the date range calculation to improve performance
  const dateRange = useMemo(
    () => buildMondayStartDateRange(currentDate),
    [currentDate]
  );

  const handleDateChange = useCallback((date: Date) => {
    setCurrentDate(date);
    setSelectedMonth(
      date.toLocaleString("default", { month: "long", year: "numeric" })
    );
  }, []);

  return {
    today,
    currentDate,
    selectedMonth,
    dateRange,
    handleDateChange,
  };
};
