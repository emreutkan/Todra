import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export type NotificationId = string;

export interface ScheduleReminderOptions {
  dueDateMs: number;
  title: string;
  body?: string;
}

// Spam mode schedule plan
// - Every 4h before 24h: at 24h, 20h, 16h, 12h, 8h remaining
// - Every 1h in last 6h: at 6h,5h,4h,3h,2h,1h remaining
// - 30m remaining
// - Every minute in last 10 minutes (10..1)
export const notificationService = {
  async init() {
    // Android channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.HIGH,
        sound: null,
        vibrationPattern: [250, 250],
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }
  },

  async requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  },

  async scheduleOne({
    dueDateMs,
    title,
    body,
  }: ScheduleReminderOptions): Promise<NotificationId | null> {
    const triggerMs = Math.max(dueDateMs - Date.now(), 0);
    // If already past due, fire shortly
    const seconds = Math.ceil(triggerMs / 1000);
    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body: body ?? "Task reminder" },
      trigger: {
        seconds,
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      },
    });
    return id;
  },

  // Schedule a single at offset before due
  async scheduleOffset({
    dueDateMs,
    offsetMs,
    title,
    body,
  }: ScheduleReminderOptions & { offsetMs: number }) {
    const when = dueDateMs - offsetMs;
    if (when <= Date.now()) return null;
    const seconds = Math.ceil((when - Date.now()) / 1000);
    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body: body ?? "Task reminder" },
      trigger: {
        seconds,
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      },
    });
    return id;
  },

  async schedulePresets({
    dueDateMs,
    title,
    body,
    offsetsMs,
  }: ScheduleReminderOptions & { offsetsMs: number[] }) {
    const ids: string[] = [];
    for (const offsetMs of offsetsMs) {
      const id = await notificationService.scheduleOffset({
        dueDateMs,
        title,
        body,
        offsetMs,
      });
      if (id) ids.push(id);
    }
    return ids;
  },

  async scheduleSpamPlan({ dueDateMs, title, body }: ScheduleReminderOptions) {
    const ms = (h: number) => h * 60 * 60 * 1000;
    const min = (m: number) => m * 60 * 1000;

    const offsets: number[] = [];
    // Every 4h before 24h: 24,20,16,12,8
    [24, 20, 16, 12, 8].forEach((h) => offsets.push(ms(h)));
    // Every hour last 6h: 6..1
    [6, 5, 4, 3, 2, 1].forEach((h) => offsets.push(ms(h)));
    // 30 minutes
    offsets.push(min(0.5));
    // Every minute last 10 minutes: 10..1
    for (let m = 10; m >= 1; m--) offsets.push(min(m));

    return notificationService.schedulePresets({
      dueDateMs,
      title,
      body,
      offsetsMs: offsets,
    });
  },

  async cancel(id: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {}
  },

  async cancelMany(ids: string[]) {
    await Promise.all(ids.map((id) => notificationService.cancel(id)));
  },

  // Test function to send an immediate notification
  async sendTestNotification() {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Notification",
          body: "This is a test notification to verify the system is working",
        },
        trigger: {
          seconds: 1,
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        },
      });
      console.log("Test notification scheduled with ID:", id);
      return id;
    } catch (error) {
      console.error("Failed to send test notification:", error);
      return null;
    }
  },
};
