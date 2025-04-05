// Storage Keys for AsyncStorage
export const STORAGE_KEYS = {
    // Tasks
    ACTIVE_TASKS: '@taskplanner:active_tasks',
    ARCHIVED_TASKS: '@taskplanner:archived_tasks',

    // Settings
    SETTINGS: '@taskplanner:settings',

    // Categories
    CATEGORIES: '@taskplanner:categories'

} as const;

export const THEME_STORAGE_KEY = '@task_planner_theme';
