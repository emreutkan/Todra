import { Task } from "../types";

export const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year:
      date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
};

export const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export const getPriorityColor = (priority: string, colors: any) => {
  switch (priority.toLowerCase()) {
    case "high":
      return colors.error;
    case "normal":
      return colors.warning;
    case "low":
      return colors.success;
    default:
      return colors.info;
  }
};

export const isOverdue = (dueDate: number, task: Task | null) => {
  return !task?.completed && dueDate < Date.now();
};

