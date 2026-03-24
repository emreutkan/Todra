import { DEFAULT_CATEGORIES } from "../constants/CategoryConstants";
import { Task, TaskPriority } from "../types";
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
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Tool execution failed";
    return JSON.stringify({ error: message });
  }
}
