import { useCallback, useState } from "react";
import { Task } from "../types";

interface TaskStats {
  completed: number;
  remaining: number;
  totalTasks: number;
}

export const useHomeStats = () => {
  const [completionStats, setCompletionStats] = useState<TaskStats>({
    completed: 0,
    remaining: 0,
    totalTasks: 0,
  });

  const calculateTaskStats = useCallback((taskList: Task[]) => {
    if (taskList.length === 0) {
      // If there are no tasks, set all values to 0
      setCompletionStats({
        completed: 0,
        remaining: 0,
        totalTasks: 0,
      });
      return;
    }

    const completed = taskList.filter((task) => task.completed).length;
    const remaining = taskList.filter((task) => !task.completed).length;

    setCompletionStats({
      completed,
      remaining,
      totalTasks: taskList.length,
    });
  }, []);

  return {
    completionStats,
    calculateTaskStats,
  };
};
