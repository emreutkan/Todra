/**
 * OpenAI-style tool definitions; also converted for Anthropic / Gemini in the LLM layer.
 */
export const TODO_TOOLS_OPENAI = [
  {
    type: "function" as const,
    function: {
      name: "list_tasks",
      description:
        "List tasks. By default returns active (non-archived) tasks. Set include_archived to true to include archived tasks.",
      parameters: {
        type: "object",
        properties: {
          include_archived: {
            type: "boolean",
            description: "If true, include archived tasks in the result.",
          },
        },
        required: [] as string[],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_task",
      description:
        "Create a new active task. If the user did not say when it is due and you cannot infer a reasonable deadline, ask them first instead of calling this tool.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Task title (required)." },
          description: { type: "string", description: "Optional details." },
          priority: {
            type: "string",
            enum: ["low", "normal", "high"],
            description: "Task priority.",
          },
          category: {
            type: "string",
            description:
              "Category id or name, e.g. personal, work, shopping, health, education.",
          },
          due_date_iso: {
            type: "string",
            description:
              "Due datetime as ISO 8601. Do not use the current clock instant unless the user asked for that moment. For same-day due dates use end-of-workday (e.g. 17:00–18:00) or end of day, not 'now'. Infer from task size when the user gave a rough timeframe. Omit only if the user clearly wants no deadline (then the app applies a generic default).",
          },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "update_task",
      description:
        "Update an existing task by id. Only include fields to change.",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string", description: "Task id." },
          title: { type: "string" },
          description: { type: "string" },
          completed: { type: "boolean" },
          priority: { type: "string", enum: ["low", "normal", "high"] },
          category: { type: "string" },
          due_date_iso: {
            type: "string",
            description:
              "New due datetime as ISO 8601; same rules as create_task (no arbitrary 'now' unless user asked).",
          },
        },
        required: ["task_id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "delete_task",
      description: "Permanently delete a task by id (active or archived).",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string" },
        },
        required: ["task_id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "archive_task",
      description: "Move an active task to archived.",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string" },
        },
        required: ["task_id"],
      },
    },
  },
];
