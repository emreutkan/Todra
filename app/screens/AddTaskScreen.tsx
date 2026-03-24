import { format } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CategorySelector from "../components/AddTaskComponents/CategorySelector";
import DateTimePicker from "../components/AddTaskComponents/DateTimePicker";
import FormSection from "../components/AddTaskComponents/FormSection";
import PredecessorTaskSelector from "../components/AddTaskComponents/PredecessorTaskSelector";
import PrioritySelector from "../components/AddTaskComponents/PrioritySelector";
import RepetitionSelector from "../components/AddTaskComponents/RepetitionSelector";
import TaskDescription from "../components/AddTaskComponents/TaskDescription";
import TaskTitleInput from "../components/AddTaskComponents/TaskTitleInput";
import RemindMeButton from "../components/common/RemindMeButton";
import ScreenHeader from "../components/common/ScreenHeader";
import { useTheme } from "../context/ThemeContext";
import { useAddTask } from "../hooks/useAddTask";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { RADII, SIZES } from "../theme";
import { typography } from "../typography";

const PRESS_SCALE = 1.04;
const PRESS_SCALE_SAVE = 1.06;
const PRESS_SCALE_REDUCED = 1.02;
const PRESS_SCALE_SAVE_REDUCED = 1.03;

const LOADING_COPY_EDIT = [
  "Opening this task…",
  "Pulling in what you saved…",
] as const;
const LOADING_COPY_NEW = [
  "Setting up something new…",
  "Almost there…",
] as const;

const runHaptic = (fn: () => Promise<void>) => {
  void fn().catch(() => {
    /* Web / unsupported Taptic Engine */
  });
};

const createButtonStyles = (shadowColor: string) =>
  StyleSheet.create({
    fab: {
      width: 56,
      height: 56,
      borderRadius: RADII.fab,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    },
    largeFab: {
      minWidth: 152,
      height: 56,
      borderRadius: RADII.fab,
      paddingHorizontal: 18,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    },
    touchable: {
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: RADII.fab,
    },
    largeTouchable: {
      width: "100%",
      height: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: RADII.fab,
      paddingHorizontal: 4,
    },
    shadow: {
      ...Platform.select({
        ios: {
          shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        android: {},
      }),
    },
    largeShadow: {
      ...Platform.select({
        ios: {
          shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
        },
        android: {},
      }),
    },
  });

const AnimatedActionButton = ({
  onPress,
  iconName,
  iconColor,
  backgroundColor,
  borderColor,
  label,
  reducedMotion,
}: {
  onPress: () => void;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  backgroundColor: string;
  borderColor?: string;
  label: string;
  reducedMotion: boolean;
}) => {
  const { colors } = useTheme();
  const pressScale = useRef(new Animated.Value(1)).current;
  const styles = createButtonStyles(colors.shadowColor);
  const toScale = reducedMotion ? PRESS_SCALE_REDUCED : PRESS_SCALE;

  const handlePressIn = () => {
    if (reducedMotion) {
      pressScale.setValue(toScale);
      return;
    }
    Animated.timing(pressScale, {
      toValue: PRESS_SCALE,
      duration: 140,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (reducedMotion) {
      pressScale.setValue(1);
      return;
    }
    Animated.timing(pressScale, {
      toValue: 1,
      duration: 140,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.fab,
        {
          backgroundColor,
          borderColor,
          borderWidth: borderColor ? 1 : 0,
          transform: [{ scale: pressScale }],
        },
        styles.shadow,
      ]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={label}
        accessibilityRole="button"
        style={styles.touchable}>
        <Ionicons name={iconName} size={22} color={iconColor} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const AnimatedLargeSaveButton = ({
  onPress,
  iconName,
  iconColor,
  backgroundColor,
  label,
  saveLabel,
  enabled,
  reducedMotion,
  disabledHint = "Add a title above to enable saving.",
}: {
  onPress: () => void;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  backgroundColor: string;
  label: string;
  saveLabel: string;
  enabled: boolean;
  reducedMotion: boolean;
  disabledHint?: string;
}) => {
  const { colors } = useTheme();
  const pressScale = useRef(new Animated.Value(1)).current;
  const styles = createButtonStyles(colors.shadowColor);
  const targetScale = reducedMotion ? PRESS_SCALE_SAVE_REDUCED : PRESS_SCALE_SAVE;

  const handlePressIn = () => {
    if (reducedMotion) {
      pressScale.setValue(targetScale);
      return;
    }
    Animated.timing(pressScale, {
      toValue: PRESS_SCALE_SAVE,
      duration: 160,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (reducedMotion) {
      pressScale.setValue(1);
      return;
    }
    Animated.timing(pressScale, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    }).start();
  };

  const primaryShadow =
    Platform.OS === "ios"
      ? {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: enabled ? 0.28 : 0.1,
          shadowRadius: 14,
        }
      : { elevation: enabled ? 5 : 1 };

  return (
    <Animated.View
      style={[
        styles.largeFab,
        {
          backgroundColor: enabled ? backgroundColor : backgroundColor + "40",
          transform: [{ scale: pressScale }],
        },
        primaryShadow,
      ]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!enabled}
        accessibilityLabel={label}
        accessibilityHint={enabled ? undefined : disabledHint}
        accessibilityRole="button"
        accessibilityState={{ disabled: !enabled }}
        style={styles.largeTouchable}>
        <Ionicons
          name={iconName}
          size={22}
          color={enabled ? iconColor : iconColor + "80"}
        />
        <Text
          style={[
            typography.bodySemiBold,
            {
              color: enabled ? iconColor : iconColor + "80",
              flexShrink: 1,
            },
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
          maxFontSizeMultiplier={1.35}>
          {saveLabel}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const AddTaskScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const bottomInsets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const {
    title,
    setTitle,
    description,
    setDescription,
    priority,
    setPriority,
    dueDate,
    setDueDate,
    category,
    setCategory,
    isFormValid,
    saveAttempted,
    loading,
    predecessorIds,
    availableTasks,
    repetition,
    setRepetition,
    remindMe,
    setRemindMe,
    handleSave,
    handleCancel,
    handlePredecessorSelect,
    isEditing,
  } = useAddTask();

  const [step, setStep] = useState<1 | 2>(() => (isEditing ? 2 : 1));
  const [step1ContinueAttempted, setStep1ContinueAttempted] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const showTitleErrorStep1 = step1ContinueAttempted && !title.trim() && step === 1;
  const showTitleErrorStep2 = saveAttempted && !title.trim() && step === 2;
  const showTitleError = showTitleErrorStep1 || showTitleErrorStep2;

  const [loadingLine, setLoadingLine] = useState(0);
  const loadingLines = isEditing ? LOADING_COPY_EDIT : LOADING_COPY_NEW;
  useEffect(() => {
    if (!loading) return;
    setLoadingLine(0);
    const id = setInterval(() => {
      setLoadingLine((i) => (i + 1) % loadingLines.length);
    }, 2600);
    return () => clearInterval(id);
  }, [loading, isEditing, loadingLines.length]);

  const titleReadyPulse = useRef(false);
  useEffect(() => {
    if (loading || reducedMotion) return;
    if (isFormValid && !titleReadyPulse.current) {
      runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
      titleReadyPulse.current = true;
    }
    if (!isFormValid) {
      titleReadyPulse.current = false;
    }
  }, [isFormValid, loading, reducedMotion]);

  const handleSaveWithFeedback = useCallback(() => {
    if (loading) return;
    runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    handleSave();
  }, [handleSave, loading]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: !reducedMotion });
  }, [step, reducedMotion]);

  const trimmedTitle = title.trim();
  const step2SummaryA11yLabel =
    trimmedTitle.length > 180
      ? `${trimmedTitle.slice(0, 180)}…`
      : trimmedTitle;

  const goToStep2 = useCallback(() => {
    if (!title.trim()) {
      setStep1ContinueAttempted(true);
      return;
    }
    setStep1ContinueAttempted(false);
    setStep(2);
    runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  }, [title]);

  const goToStep1 = useCallback(() => {
    setStep(1);
    runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    body: {
      flex: 1,
    },
    scrollContent: {
      padding: SIZES.medium,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    footer: {
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    footerInner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 12,
      paddingHorizontal: SIZES.medium,
      paddingTop: SIZES.small,
      paddingBottom: SIZES.small,
    },
    footerInnerSpread: {
      justifyContent: "space-between",
      width: "100%",
    },
    stepper: {
      paddingHorizontal: SIZES.medium,
      paddingBottom: SIZES.small,
    },
    stepperRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 6,
    },
    stepSegment: {
      flex: 1,
      height: 3,
      borderRadius: 2,
    },
    stepperCaption: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    stepSummaryWrap: {
      width: "100%",
      maxWidth: "100%",
      marginBottom: SIZES.medium,
    },
  });

  if (loading) {
    return (
      <View
        style={styles.loadingContainer}
        accessibilityLabel="Loading task"
        accessibilityLiveRegion="polite">
        <LinearGradient
          colors={[colors.background, colors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={[
            typography.bodySmall,
            {
              color: colors.textSecondary,
              marginTop: SIZES.large,
              textAlign: "center",
              paddingHorizontal: SIZES.extraLarge,
            },
          ]}>
          {loadingLines[loadingLine]}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
        style={{ flex: 1 }}>
        <StatusBar style={isDark ? "light" : "dark"} />

        <ScreenHeader
          title={isEditing ? "Edit task" : "New task"}
          titleEmphasis="hero"
          showBackButton
          onBackPress={handleCancel}
        />

        <View style={styles.stepper} accessibilityRole="none">
          <View style={styles.stepperRow}>
            <View
              style={[
                styles.stepSegment,
                {
                  backgroundColor:
                    step >= 1 ? colors.primary : colors.border,
                  opacity: step === 1 ? 1 : 0.45,
                },
              ]}
            />
            <View
              style={[
                styles.stepSegment,
                {
                  backgroundColor:
                    step >= 2 ? colors.primary : colors.border,
                  opacity: step === 2 ? 1 : 0.45,
                },
              ]}
            />
          </View>
          <Text style={styles.stepperCaption}>
            {step === 1
              ? "Step 1 of 2 — Title & due date"
              : "Step 2 of 2 — Notes, category, and more (all optional)"}
          </Text>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.body}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: SIZES.small },
            { paddingBottom: bottomInsets.bottom + SIZES.extraLarge * 4 },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          showsVerticalScrollIndicator={false}>
          {step === 1 ? (
            <>
              <TaskTitleInput
                value={title}
                onChangeText={setTitle}
                showTitleError={showTitleError}
              />
              <DateTimePicker dueDate={dueDate} onDateChange={setDueDate} />
            </>
          ) : (
            <>
              <View style={styles.stepSummaryWrap}>
                <Text
                  style={[
                    typography.caption,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                  maxFontSizeMultiplier={1.35}
                  accessibilityLabel={`Task summary: ${step2SummaryA11yLabel}, due ${format(
                    dueDate,
                    "MMMM d, h:mm a"
                  )}`}>
                  {trimmedTitle}
                  {" · Due "}
                  {format(dueDate, "MMM d, h:mm a")}
                </Text>
              </View>
              <TaskDescription
                value={description}
                onChangeText={setDescription}
              />
              <CategorySelector
                selectedCategory={category}
                onSelectCategory={setCategory}
              />
              <PrioritySelector
                selectedPriority={priority}
                onSelectPriority={setPriority}
              />
              <FormSection title="Reminders" optional>
                <RemindMeButton
                  value={remindMe}
                  onChange={setRemindMe}
                  maxOffsetMs={Math.max(dueDate.getTime() - Date.now(), 0)}
                />
              </FormSection>
              <RepetitionSelector
                repetition={repetition}
                onRepetitionChange={(newRepetition) =>
                  setRepetition(newRepetition)
                }
              />
              {!repetition.enabled && (
                <PredecessorTaskSelector
                  availableTasks={availableTasks}
                  selectedPredecessors={predecessorIds}
                  onSelectPredecessor={handlePredecessorSelect}
                />
              )}
            </>
          )}
        </ScrollView>

      <View
        style={[
          styles.footer,
          {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: bottomInsets.bottom,
          },
        ]}>
        <View
          style={[
            styles.footerInner,
            step === 2 ? styles.footerInnerSpread : null,
          ]}>
          {step === 1 ? (
            <>
              <AnimatedActionButton
                onPress={handleCancel}
                iconName="close"
                iconColor={colors.textSecondary}
                backgroundColor={colors.surface}
                borderColor={colors.border}
                label="Close without saving"
                reducedMotion={reducedMotion}
              />
              <AnimatedLargeSaveButton
                onPress={goToStep2}
                iconName="arrow-forward"
                iconColor={colors.onPrimary}
                backgroundColor={colors.primary}
                label="Continue to optional details"
                saveLabel="Continue"
                enabled={isFormValid}
                reducedMotion={reducedMotion}
                disabledHint="Add a title above to continue."
              />
            </>
          ) : (
            <>
              <AnimatedActionButton
                onPress={goToStep1}
                iconName="chevron-back"
                iconColor={colors.textSecondary}
                backgroundColor={colors.surface}
                borderColor={colors.border}
                label="Back to title and due date"
                reducedMotion={reducedMotion}
              />
              <AnimatedLargeSaveButton
                onPress={handleSaveWithFeedback}
                iconName="checkmark"
                iconColor={colors.onPrimary}
                backgroundColor={colors.primary}
                label="Save"
                saveLabel="Save"
                enabled={isFormValid}
                reducedMotion={reducedMotion}
              />
            </>
          )}
        </View>
      </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default AddTaskScreen;
