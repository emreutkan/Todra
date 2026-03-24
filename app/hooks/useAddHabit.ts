import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { useToast } from "../context/ToastContext";
import { DEFAULT_CATEGORIES } from "../constants/CategoryConstants";
import {
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
} from "../constants/taskInputLimits";
import { habitStorageService } from "../services/habitStorageService";
import {
  DayPhase,
  Habit,
  HabitScheduleType,
  RootStackParamList,
} from "../types";
import { habitDateStr } from "../utils/habitUtils";

type Nav = NativeStackNavigationProp<RootStackParamList, "AddHabit">;
type Route = RouteProp<RootStackParamList, "AddHabit">;

const defaultDayPhases = (): DayPhase[] => [];

export function useAddHabit() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { showToast } = useToast();
  const habitId = route.params?.habitId;
  const isEditing = Boolean(habitId);
  const saveInFlight = useRef(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0].id);
  const [color, setColor] = useState("#D97706");
  const [icon, setIcon] = useState("fitness-outline");
  const [scheduleType, setScheduleType] =
    useState<HabitScheduleType>("daily");
  const [intervalDays, setIntervalDays] = useState(1);
  const [intervalPhases, setIntervalPhases] = useState<string[]>([
    "Push",
    "Pull",
    "Legs",
  ]);
  const [dayPhases, setDayPhases] = useState<DayPhase[]>(defaultDayPhases);
  const [startDate, setStartDate] = useState(() => new Date());
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [original, setOriginal] = useState<Habit | null>(null);

  useEffect(() => {
    if (!habitId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const habits = await habitStorageService.getHabits();
        const h = habits.find((x) => x.id === habitId);
        if (cancelled || !h) {
          if (!cancelled && !h) {
            Alert.alert(
              "Habit unavailable",
              "We couldn't find this habit. It may have been deleted."
            );
            navigation.goBack();
          }
          return;
        }
        setOriginal(h);
        setTitle((h.title ?? "").slice(0, TASK_TITLE_MAX_LENGTH));
        setDescription(
          (h.description ?? "").slice(0, TASK_DESCRIPTION_MAX_LENGTH)
        );
        setCategory(h.category || DEFAULT_CATEGORIES[0].id);
        setColor(h.color || "#D97706");
        setIcon(h.icon || "fitness-outline");
        setScheduleType(h.scheduleType);
        setIntervalDays(Math.max(1, h.intervalDays || 1));
        setIntervalPhases(
          h.intervalPhases?.length ? [...h.intervalPhases] : ["Phase A"]
        );
        setDayPhases(h.dayPhases?.length ? [...h.dayPhases] : []);
        setStartDate(new Date(h.startDate + "T12:00:00"));
        if (h.endDate) {
          setHasEndDate(true);
          setEndDate(new Date(h.endDate + "T12:00:00"));
        } else {
          setHasEndDate(false);
          setEndDate(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [habitId, navigation]);

  const addIntervalPhase = useCallback(() => {
    setIntervalPhases((p) => [...p, `Phase ${p.length + 1}`]);
  }, []);

  const updateIntervalPhase = useCallback((index: number, value: string) => {
    setIntervalPhases((p) => {
      const next = [...p];
      next[index] = value;
      return next;
    });
  }, []);

  const removeIntervalPhase = useCallback((index: number) => {
    setIntervalPhases((p) => p.filter((_, i) => i !== index));
  }, []);

  const toggleDay = useCallback((dayOfWeek: number) => {
    setDayPhases((prev) => {
      const exists = prev.some((d) => d.dayOfWeek === dayOfWeek);
      if (exists) {
        return prev.filter((d) => d.dayOfWeek !== dayOfWeek);
      }
      const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return [
        ...prev,
        { dayOfWeek, name: `${names[dayOfWeek]} focus` },
      ].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    });
  }, []);

  const updateDayPhaseName = useCallback(
    (dayOfWeek: number, name: string) => {
      setDayPhases((prev) =>
        prev.map((d) =>
          d.dayOfWeek === dayOfWeek ? { ...d, name } : d
        )
      );
    },
    []
  );

  const isFormValid =
    title.trim().length > 0 &&
    (scheduleType !== "weekly" || dayPhases.length > 0) &&
    intervalDays >= 1 &&
    intervalDays <= 90;

  const handleSave = useCallback(async () => {
    if (!isFormValid || saveInFlight.current) return;
    saveInFlight.current = true;
    try {
      const titleSafe = title.trim().slice(0, TASK_TITLE_MAX_LENGTH);
      const descriptionSafe = description
        .trim()
        .slice(0, TASK_DESCRIPTION_MAX_LENGTH);
      const startStr = habitDateStr(startDate);
      const endStr =
        hasEndDate && endDate ? habitDateStr(endDate) : undefined;

      if (hasEndDate && endDate && endDate < startDate) {
        Alert.alert(
          "Check dates",
          "End date can't be before the start date."
        );
        return;
      }

      if (isEditing && habitId && original) {
        const updated: Habit = {
          ...original,
          title: titleSafe,
          description: descriptionSafe,
          category,
          color,
          icon,
          scheduleType,
          intervalDays: Math.max(1, intervalDays),
          intervalPhases: intervalPhases.map((s) => s.trim()).filter(Boolean),
          dayPhases,
          startDate: startStr,
          endDate: endStr,
        };
        const ok = await habitStorageService.updateHabit(updated);
        if (ok) {
          showToast("Habit updated", "success");
          navigation.navigate("Habits");
        } else
          Alert.alert(
            "Couldn't save",
            "Something went wrong while saving. Try again."
          );
      } else {
        const newHabit: Habit = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          title: titleSafe,
          description: descriptionSafe,
          category,
          color,
          icon,
          scheduleType,
          intervalDays: Math.max(1, intervalDays),
          intervalPhases: intervalPhases.map((s) => s.trim()).filter(Boolean),
          dayPhases,
          startDate: startStr,
          endDate: endStr,
          completions: [],
          createdAt: Date.now(),
          isArchived: false,
        };
        const ok = await habitStorageService.addHabit(newHabit);
        if (ok) {
          showToast("Habit saved", "success");
          navigation.navigate("Habits");
        } else
          Alert.alert(
            "Couldn't save",
            "Something went wrong while saving. Try again."
          );
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Couldn't save", "Something went wrong. Try again.");
    } finally {
      saveInFlight.current = false;
    }
  }, [
    isFormValid,
    title,
    description,
    category,
    color,
    icon,
    scheduleType,
    intervalDays,
    intervalPhases,
    dayPhases,
    startDate,
    hasEndDate,
    endDate,
    isEditing,
    habitId,
    original,
    navigation,
    showToast,
  ]);

  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return {
    title,
    setTitle,
    description,
    setDescription,
    category,
    setCategory,
    color,
    setColor,
    icon,
    setIcon,
    scheduleType,
    setScheduleType,
    intervalDays,
    setIntervalDays,
    intervalPhases,
    dayPhases,
    startDate,
    setStartDate,
    hasEndDate,
    setHasEndDate,
    endDate,
    setEndDate,
    loading,
    isEditing,
    isFormValid,
    addIntervalPhase,
    updateIntervalPhase,
    removeIntervalPhase,
    toggleDay,
    updateDayPhaseName,
    handleSave,
    handleCancel,
  };
}
