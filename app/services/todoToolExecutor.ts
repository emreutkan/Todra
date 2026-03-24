import { DEFAULT_CATEGORIES } from "../constants/CategoryConstants";
import { DayPhase, Habit, Task, TaskPriority } from "../types";
import { habitStorageService } from "./habitStorageService";
import { taskStorageService } from "./taskStorageService";

function genTaskId(): string {
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeCategory(raw?: string): string {
  if (!raw || typeof raw !== "string") return DEFAULT_CATEGORIES[0].id;
  const s = raw.trim().toLowerCase();
  const byId = DEFAULT_CATEGORIES.find((c) => c.id === s);
  if (byId) return byId.id;
  const byName = DEFAULT_CATEGORIES.find(
    (c) => c.name.toLowerCase() === s
  );
  if (byName) return byName.id;
  return DEFAULT_CATEGORIES[0].id;
}

function parsePriority(v: unknown): TaskPriority {
  if (v === "low" || v === "high" || v === "normal") return v;
  return "normal";
}

/** When the model omits a due date, avoid using "now" (reads as wrong hour). */
function defaultDueMsWhenUnspecified(nowMs: number): number {
  const endToday = new Date(nowMs);
  endToday.setHours(23, 59, 59, 999);
  if (endToday.getTime() > nowMs + 5 * 60 * 1000) {
    return endToday.getTime();
  }
  const next = new Date(nowMs);
  next.setDate(next.getDate() + 1);
  next.setHours(18, 0, 0, 0);
  return next.getTime();
}

function summarizeTask(t: Task) {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    priority: t.priority,
    completed: t.completed,
    category: t.category,
    archived: t.archived,
    due_date_iso: new Date(t.dueDate).toISOString(),
  };
}

function genHabitId(): string {
  return `h_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeScheduleType(v: unknown): Habit["scheduleType"] {
  if (v === "interval" || v === "weekly" || v === "daily") return v;
  return "daily";
}

function parseJsonStringArray(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).trim()).filter(Boolean);
  }
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((x) => String(x).trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function parseDayPhases(raw: unknown): DayPhase[] {
  const toArr = (value: unknown): unknown[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string" && value.trim()) {
      try {
        const parsed = JSON.parse(value) as unknown;
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };
  return toArr(raw)
    .map((x) => x as Partial<DayPhase>)
    .filter((x) => typeof x?.dayOfWeek === "number" && typeof x?.name === "string")
    .map((x) => ({
      dayOfWeek: Math.max(0, Math.min(6, Math.floor(x.dayOfWeek as number))),
      name: String(x.name || "").trim(),
      description:
        typeof x.description === "string" ? x.description.trim() : undefined,
    }))
    .filter((x) => x.name);
}

function isYmd(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.trim());
}

function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function summarizeHabit(h: Habit) {
  return {
    id: h.id,
    title: h.title,
    description: h.description,
    category: h.category,
    color: h.color,
    icon: h.icon,
    schedule_type: h.scheduleType,
    interval_days: h.intervalDays,
    interval_phases: h.intervalPhases,
    day_phases: h.dayPhases,
    start_date: h.startDate,
    end_date: h.endDate,
    is_archived: h.isArchived,
    completions_count: h.completions.length,
  };
}

export async function executeTodoTool(
  name: string,
  argsJson: string
): Promise<string> {
  let args: Record<string, unknown>;
  try {
    args = JSON.parse(argsJson || "{}") as Record<string, unknown>;
  } catch {
    return JSON.stringify({ error: "Invalid JSON arguments for tool." });
  }

  try {
    switch (name) {
      case "list_tasks": {
        const includeArchived = Boolean(args.include_archived);
        const active = await taskStorageService.getActiveTasks();
        const archived = includeArchived
          ? await taskStorageService.getArchivedTasks()
          : [];
        return JSON.stringify({
          active: active.map(summarizeTask),
          archived: includeArchived ? archived.map(summarizeTask) : undefined,
        });
      }
      case "create_task": {
        const title = String(args.title || "").trim();
        if (!title) {
          return JSON.stringify({ error: "title is required" });
        }
        const now = Date.now();
        const parsedDue =
          typeof args.due_date_iso === "string" && args.due_date_iso.trim()
            ? new Date(args.due_date_iso.trim()).getTime()
            : NaN;
        const dueMs = Number.isNaN(parsedDue)
          ? defaultDueMsWhenUnspecified(now)
          : parsedDue;
        const task: Task = {
          id: genTaskId(),
          title,
          description:
            typeof args.description === "string" ? args.description : "",
          priority: parsePriority(args.priority),
          completed: false,
          createdAt: now,
          dueDate: dueMs,
          category: normalizeCategory(
            typeof args.category === "string" ? args.category : undefined
          ),
          predecessorIds: [],
          archived: false,
        };
        const ok = await taskStorageService.addTask(task);
        if (!ok) return JSON.stringify({ error: "Failed to save task" });
        return JSON.stringify({ success: true, task: summarizeTask(task) });
      }
      case "update_task": {
        const taskId = String(args.task_id || "");
        if (!taskId) {
          return JSON.stringify({ error: "task_id is required" });
        }
        const active = await taskStorageService.getActiveTasks();
        const archived = await taskStorageService.getArchivedTasks();
        let task =
          active.find((t) => t.id === taskId) ||
          archived.find((t) => t.id === taskId);
        if (!task) {
          return JSON.stringify({ error: "Task not found", task_id: taskId });
        }
        const next: Task = { ...task };
        if (typeof args.title === "string") next.title = args.title;
        if (typeof args.description === "string")
          next.description = args.description;
        if (typeof args.completed === "boolean") next.completed = args.completed;
        if (args.priority !== undefined)
          next.priority = parsePriority(args.priority);
        if (typeof args.category === "string")
          next.category = normalizeCategory(args.category);
        if (typeof args.due_date_iso === "string" && args.due_date_iso) {
          const ms = new Date(args.due_date_iso).getTime();
          if (!Number.isNaN(ms)) next.dueDate = ms;
        }
        const ok = await taskStorageService.updateTask(next);
        if (!ok) return JSON.stringify({ error: "Failed to update task" });
        return JSON.stringify({ success: true, task: summarizeTask(next) });
      }
      case "delete_task": {
        const taskId = String(args.task_id || "");
        if (!taskId) {
          return JSON.stringify({ error: "task_id is required" });
        }
        const ok = await taskStorageService.deleteTask(taskId);
        if (!ok) return JSON.stringify({ error: "Task not found or delete failed" });
        return JSON.stringify({ success: true, task_id: taskId });
      }
      case "archive_task": {
        const taskId = String(args.task_id || "");
        if (!taskId) {
          return JSON.stringify({ error: "task_id is required" });
        }
        const ok = await taskStorageService.archiveTask(taskId);
        if (!ok) {
          return JSON.stringify({
            error: "Could not archive (task missing or not active)",
          });
        }
        return JSON.stringify({ success: true, task_id: taskId });
      }
      case "list_habits": {
        const includeArchived = Boolean(args.include_archived);
        const all = await habitStorageService.getHabits();
        const active = all.filter((h) => !h.isArchived);
        const archived = includeArchived ? all.filter((h) => h.isArchived) : [];
        return JSON.stringify({
          active: active.map(summarizeHabit),
          archived: includeArchived ? archived.map(summarizeHabit) : undefined,
        });
      }
      case "create_habit": {
        const title = String(args.title || "").trim();
        if (!title) return JSON.stringify({ error: "title is required" });
        const scheduleType = normalizeScheduleType(args.schedule_type);
        const startDate = isYmd(args.start_date) ? args.start_date : todayYmd();
        const endDate = isYmd(args.end_date) ? args.end_date : undefined;
        const intervalDays = Math.max(
          1,
          Math.min(
            90,
            Number.isFinite(Number(args.interval_days))
              ? Math.floor(Number(args.interval_days))
              : 1
          )
        );
        const intervalPhases = parseJsonStringArray(args.interval_phases);
        const dayPhases = parseDayPhases(args.day_phases);

        const habit: Habit = {
          id: genHabitId(),
          title,
          description:
            typeof args.description === "string" ? args.description : "",
          category: normalizeCategory(
            typeof args.category === "string" ? args.category : undefined
          ),
          color:
            typeof args.color === "string" && args.color.trim()
              ? args.color.trim()
              : "#D97706",
          icon:
            typeof args.icon === "string" && args.icon.trim()
              ? args.icon.trim()
              : "fitness-outline",
          scheduleType,
          intervalDays,
          intervalPhases,
          dayPhases,
          startDate,
          endDate,
          completions: [],
          createdAt: Date.now(),
          isArchived: false,
        };
        const ok = await habitStorageService.addHabit(habit);
        if (!ok) return JSON.stringify({ error: "Failed to save habit" });
        return JSON.stringify({ success: true, habit: summarizeHabit(habit) });
      }
      case "update_habit": {
        const habitId = String(args.habit_id || "");
        if (!habitId) return JSON.stringify({ error: "habit_id is required" });
        const habits = await habitStorageService.getHabits();
        const habit = habits.find((h) => h.id === habitId);
        if (!habit) {
          return JSON.stringify({ error: "Habit not found", habit_id: habitId });
        }
        const next: Habit = { ...habit };
        if (typeof args.title === "string") next.title = args.title.trim();
        if (typeof args.description === "string")
          next.description = args.description;
        if (typeof args.category === "string")
          next.category = normalizeCategory(args.category);
        if (typeof args.color === "string" && args.color.trim())
          next.color = args.color.trim();
        if (typeof args.icon === "string" && args.icon.trim())
          next.icon = args.icon.trim();
        if (args.schedule_type !== undefined)
          next.scheduleType = normalizeScheduleType(args.schedule_type);
        if (args.interval_days !== undefined) {
          const n = Number(args.interval_days);
          if (Number.isFinite(n)) next.intervalDays = Math.max(1, Math.min(90, Math.floor(n)));
        }
        if (args.interval_phases !== undefined) {
          next.intervalPhases = parseJsonStringArray(args.interval_phases);
        }
        if (args.day_phases !== undefined) {
          next.dayPhases = parseDayPhases(args.day_phases);
        }
        if (isYmd(args.start_date)) next.startDate = args.start_date;
        if (typeof args.end_date === "string") {
          const trimmed = args.end_date.trim();
          next.endDate = trimmed ? (isYmd(trimmed) ? trimmed : next.endDate) : undefined;
        }
        const ok = await habitStorageService.updateHabit(next);
        if (!ok) return JSON.stringify({ error: "Failed to update habit" });
        return JSON.stringify({ success: true, habit: summarizeHabit(next) });
      }
      case "toggle_habit_completion": {
        const habitId = String(args.habit_id || "");
        const date = String(args.date || "");
        if (!habitId) return JSON.stringify({ error: "habit_id is required" });
        if (!isYmd(date)) {
          return JSON.stringify({ error: "date must be YYYY-MM-DD" });
        }
        const phaseName =
          typeof args.phase_name === "string" ? args.phase_name : undefined;
        const ok = await habitStorageService.toggleCompletion(habitId, date, phaseName);
        if (!ok) {
          return JSON.stringify({ error: "Habit not found or toggle failed" });
        }
        return JSON.stringify({ success: true, habit_id: habitId, date });
      }
      case "delete_habit": {
        const habitId = String(args.habit_id || "");
        if (!habitId) return JSON.stringify({ error: "habit_id is required" });
        const ok = await habitStorageService.deleteHabit(habitId);
        if (!ok) return JSON.stringify({ error: "Habit not found or delete failed" });
        return JSON.stringify({ success: true, habit_id: habitId });
      }
      case "archive_habit": {
        const habitId = String(args.habit_id || "");
        if (!habitId) return JSON.stringify({ error: "habit_id is required" });
        const ok = await habitStorageService.archiveHabit(habitId);
        if (!ok) {
          return JSON.stringify({
            error: "Could not archive (habit missing or not active)",
          });
        }
        return JSON.stringify({ success: true, habit_id: habitId });
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Tool execution failed";
    return JSON.stringify({ error: message });
  }
}
