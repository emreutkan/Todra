import { useCallback, useEffect, useState } from "react";
import { useSettings } from "../context/SettingsContext";
import { Task, TaskPriority } from "../types";

export const useHomeFilters = (tasks: Task[]) => {
  const { settings } = useSettings();

  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [selectedFilterType, setSelectedFilterType] = useState<
    "createdAt" | "dueDate"
  >("dueDate");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<
    TaskPriority | "all"
  >("all");

  // Filter tasks based on selected date, category, priority, and completed status
  useEffect(() => {
    if (tasks.length === 0) {
      setFilteredTasks([]);
      return;
    }

    // Apply date filtering
    let result = [...tasks];

    // Apply category filter if one is selected
    if (activeCategory) {
      result = result.filter((task) => task.category === activeCategory);
    }

    // Apply priority filter
    if (selectedPriority !== "all") {
      result = result.filter((task) => task.priority === selectedPriority);
    }

    // Apply completed tasks filter based on settings
    if (!settings.showCompletedTasks) {
      result = result.filter((task) => !task.completed);
    }

    // Sort tasks by priority (high first, low last)
    result.sort((a, b) => {
      const priorityOrder = {
        high: 0,
        normal: 1,
        low: 2,
      };
      return (
        (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1)
      );
    });

    setFilteredTasks(result);
  }, [
    tasks,
    selectedFilterType,
    activeCategory,
    selectedPriority,
    settings.showCompletedTasks,
  ]);

  const clearFilters = useCallback(() => {
    setActiveCategory(null);
    setSelectedPriority("all");
  }, []);

  const setCategoryFilter = useCallback((category: string | null) => {
    setActiveCategory(category);
  }, []);

  const setPriorityFilter = useCallback((priority: TaskPriority | "all") => {
    setSelectedPriority(priority);
  }, []);

  const setFilterType = useCallback((type: "createdAt" | "dueDate") => {
    setSelectedFilterType(type);
  }, []);

  return {
    filteredTasks,
    selectedFilterType,
    activeCategory,
    selectedPriority,
    clearFilters,
    setCategoryFilter,
    setPriorityFilter,
    setFilterType,
  };
};

