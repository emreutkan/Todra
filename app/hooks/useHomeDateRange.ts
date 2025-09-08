import { useCallback, useMemo, useState } from "react";

export const useHomeDateRange = () => {
  const today = useMemo(() => new Date(), []);
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(
    today.toLocaleString("default", { month: "long", year: "numeric" })
  );

  // Memoize the date range calculation to improve performance
  const dateRange = useMemo(() => {
    // Get the current date
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Create array of dates for the full month plus next 15 days
    const dates: Date[] = [];

    // Add dates from the current month
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    for (let i = 1; i <= lastDay.getDate(); i++) {
      dates.push(new Date(currentYear, currentMonth, i));
    }

    // Add first 15 days of next month
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    for (let i = 1; i <= 15; i++) {
      dates.push(new Date(nextMonthYear, nextMonth, i));
    }

    return dates;
  }, []);

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

