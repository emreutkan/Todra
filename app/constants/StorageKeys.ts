export const STORAGE_KEYS = {
  ACTIVE_TASKS: "@taskplanner:active_tasks",
  ARCHIVED_TASKS: "@taskplanner:archived_tasks",
  SETTINGS: "@taskplanner:settings",
  CATEGORIES: "@taskplanner:categories",
  /** Non-secret AI provider prefs (model, URLs). Key is in SecureStore. */
  AI_CONFIG: "@taskplanner:ai_config",
  HABITS: "@taskplanner:habits",
} as const;
