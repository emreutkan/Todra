import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CategorySelector from "../components/AddTaskComponents/CategorySelector";
import FormSection from "../components/AddTaskComponents/FormSection";
import ActionFooter from "../components/AddTaskComponents/ActionFooter";
import DateTimeButton from "../components/common/DateTimeButton";
import TaskDescription from "../components/common/TaskDescription";
import TaskTitleInput from "../components/common/TaskTitleInput";
import ScreenHeader from "../components/common/ScreenHeader";
import DayPhaseEditor from "../components/HabitComponents/DayPhaseEditor";
import HabitColorPicker from "../components/HabitComponents/HabitColorPicker";
import PhaseListEditor from "../components/HabitComponents/PhaseListEditor";
import { useTheme } from "../context/ThemeContext";
import { useAddHabit } from "../hooks/useAddHabit";
import { HabitScheduleType } from "../types";
import { RADII, SIZES } from "../theme";
import { typography } from "../typography";

const HABIT_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  "fitness-outline",
  "nutrition-outline",
  "water-outline",
  "bed-outline",
  "leaf-outline",
  "sunny-outline",
  "book-outline",
  "musical-notes-outline",
  "medkit-outline",
  "heart-outline",
  "barbell-outline",
  "walk-outline",
];

const SCHEDULE_LABELS: { key: HabitScheduleType; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "interval", label: "Every N days" },
  { key: "weekly", label: "Weekly" },
];

const AddHabitScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const {
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
  } = useAddHabit();

  if (loading) {
    return (
      <View
        style={[styles.loading, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 16 }]}>
          Loading habit…
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}>
        <ScreenHeader
          title={isEditing ? "Edit habit" : "New habit"}
          titleEmphasis="hero"
          showBackButton
          onBackPress={handleCancel}
          rightComponent={
            <TouchableOpacity
              onPress={handleSave}
              disabled={!isFormValid}
              accessibilityLabel="Save habit"
              accessibilityRole="button"
              accessibilityState={{ disabled: !isFormValid }}>
              <Text
                style={[
                  typography.bodySemiBold,
                  { color: isFormValid ? colors.primary : colors.disabled },
                ]}>
                Save
              </Text>
            </TouchableOpacity>
          }
        />

        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + 100 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <FormSection title="Basics">
            <TaskTitleInput
              value={title}
              onChangeText={setTitle}
              placeholder="Name this habit"
              hero
            />
            <View style={{ height: 12 }} />
            <TaskDescription
              value={description}
              onChangeText={setDescription}
              placeholder="Why it matters (optional)"
            />
            <CategorySelector
              selectedCategory={category}
              onSelectCategory={setCategory}
            />
          </FormSection>

          <FormSection title="Look" subtitle="Accent on cards and calendar">
            <HabitColorPicker value={color} onChange={setColor} />
            <View style={styles.iconGrid}>
              {HABIT_ICONS.map((name) => {
                const selected = icon === name;
                return (
                  <TouchableOpacity
                    key={name}
                    onPress={() => setIcon(name)}
                    style={[
                      styles.iconCell,
                      {
                        borderColor: selected ? colors.primary : colors.border,
                        backgroundColor: selected
                          ? colors.primaryMuted
                          : colors.card,
                      },
                    ]}
                    accessibilityLabel={`Icon ${name}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}>
                    <Ionicons
                      name={name}
                      size={22}
                      color={selected ? colors.primary : colors.textSecondary}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </FormSection>

          <FormSection title="Schedule">
            <View style={styles.segmentRow}>
              {SCHEDULE_LABELS.map(({ key, label }) => {
                const on = scheduleType === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setScheduleType(key)}
                    style={[
                      styles.segment,
                      {
                        backgroundColor: on ? colors.primary : colors.surface,
                        borderColor: on ? colors.primary : colors.border,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}>
                    <Text
                      style={[
                        typography.captionSemiBold,
                        { color: on ? colors.onPrimary : colors.text },
                      ]}
                      numberOfLines={1}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {scheduleType === "interval" ? (
              <View style={styles.intervalBlock}>
                <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
                  Repeat every
                </Text>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={[styles.stepBtn, { borderColor: colors.border }]}
                    onPress={() =>
                      setIntervalDays((n) => Math.max(1, n - 1))
                    }
                    accessibilityLabel="Decrease interval">
                    <Ionicons name="remove" size={22} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[typography.headline, { color: colors.text }]}>
                    {intervalDays}
                  </Text>
                  <Text
                    style={[typography.caption, { color: colors.textSecondary }]}>
                    days
                  </Text>
                  <TouchableOpacity
                    style={[styles.stepBtn, { borderColor: colors.border }]}
                    onPress={() =>
                      setIntervalDays((n) => Math.min(90, n + 1))
                    }
                    accessibilityLabel="Increase interval">
                    <Ionicons name="add" size={22} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <PhaseListEditor
                  phases={intervalPhases}
                  onChange={updateIntervalPhase}
                  onAdd={addIntervalPhase}
                  onRemove={removeIntervalPhase}
                />
              </View>
            ) : null}

            {scheduleType === "weekly" ? (
              <DayPhaseEditor
                dayPhases={dayPhases}
                onToggleDay={toggleDay}
                onUpdateName={updateDayPhaseName}
              />
            ) : null}
          </FormSection>

          <FormSection title="Date range">
            <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 8 }]}>
              Start
            </Text>
            <DateTimeButton
              value={startDate}
              onDateChange={setStartDate}
              mode="date"
            />
            <View style={styles.endRow}>
              <Text style={[typography.bodySemiBold, { color: colors.text }]}>
                End date
              </Text>
              <Switch
                value={hasEndDate}
                onValueChange={(v) => {
                  setHasEndDate(v);
                  if (v && !endDate) {
                    setEndDate(new Date());
                  }
                }}
                trackColor={{ false: colors.border, true: colors.primaryMuted }}
                thumbColor={hasEndDate ? colors.primary : colors.surface}
              />
            </View>
            {hasEndDate && endDate ? (
              <DateTimeButton
                value={endDate}
                onDateChange={(d) => setEndDate(d)}
                mode="date"
                minimumDate={startDate}
              />
            ) : null}
          </FormSection>
        </ScrollView>

        <View
          style={[
            styles.footerDock,
            {
              paddingBottom: Math.max(insets.bottom, 12),
              backgroundColor: colors.card,
              borderTopColor: colors.border,
            },
          ]}>
          <ActionFooter
            onCancel={handleCancel}
            onSave={handleSave}
            saveEnabled={isFormValid}
            saveButtonText={isEditing ? "Update habit" : "Save habit"}
            saveAccessibilityLabel={isEditing ? "Update habit" : "Save habit"}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: SIZES.medium },
  segmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  segment: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADII.md,
    borderWidth: 1,
    flexGrow: 1,
    minWidth: "28%",
    alignItems: "center",
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  iconCell: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  intervalBlock: { gap: 12, marginTop: 8 },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  endRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 8,
  },
  footerDock: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

export default AddHabitScreen;
