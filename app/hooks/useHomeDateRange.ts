import { useCallback, useMemo, useState } from "react";

export const useHomeDateRange = () => {
  const today = useMemo(() => new Date(), []);
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(
    today.toLocaleString("default", { month: "long", year: "numeric" })
  );

  // Memoize the date range calculation to improve performance
  const dateRange = useMemo(() => {
    // Use the current selected date instead of today
    const selectedMonth = currentDate.getMonth();
    const selectedYear = currentDate.getFullYear();

    // Create array of dates for the full month plus next 15 days
    const dates: Date[] = [];

    // Add dates from the selected month
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    for (let i = 1; i <= lastDay.getDate(); i++) {
      dates.push(new Date(selectedYear, selectedMonth, i));
    }

    // Add first 15 days of next month
    const nextMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
    const nextMonthYear =
      selectedMonth === 11 ? selectedYear + 1 : selectedYear;
    for (let i = 1; i <= 15; i++) {
      dates.push(new Date(nextMonthYear, nextMonth, i));
    }

    return dates;
  }, [currentDate]);

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
