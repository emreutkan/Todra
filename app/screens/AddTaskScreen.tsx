import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useRef } from "react";
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

import AddTaskMoreOptions from "../components/AddTaskComponents/AddTaskMoreOptions";
import CategorySelector from "../components/AddTaskComponents/CategorySelector";
import DateTimePicker from "../components/AddTaskComponents/DateTimePicker";
import FormSection from "../components/AddTaskComponents/FormSection";
import PredecessorTaskSelector from "../components/AddTaskComponents/PredecessorTaskSelector";
import PrioritySelector from "../components/AddTaskComponents/PrioritySelector";
import RepetitionSelector from "../components/AddTaskComponents/RepetitionSelector";
import TaskDescription from "../components/AddTaskComponents/TaskDescription";
import TaskTitleInput from "../components/AddTaskComponents/TaskTitleInput";
import GlassBar from "../components/common/GlassBar";
import RemindMeButton from "../components/common/RemindMeButton";
import ScreenHeader from "../components/common/ScreenHeader";
import { useTheme } from "../context/ThemeContext";
import { useAddTask } from "../hooks/useAddTask";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { SIZES } from "../theme";
import { typography } from "../typography";

const PRESS_SCALE = 1.06;
const PRESS_SCALE_REDUCED = 1.03;

const createButtonStyles = (shadowColor: string) =>
  StyleSheet.create({
    fab: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    },
    largeFab: {
      minWidth: 140,
      height: 56,
      borderRadius: 28,
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
      borderRadius: 28,
    },
    largeTouchable: {
      width: "100%",
      height: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 28,
      paddingHorizontal: 4,
    },
    shadow: {
      ...Platform.select({
        ios: {
          shadowColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
        },
        android: {},
      }),
    },
    largeShadow: {
      ...Platform.select({
        ios: {
          shadowColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
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
      duration: 200,
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
      duration: 200,
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
}: {
  onPress: () => void;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  backgroundColor: string;
  label: string;
  saveLabel: string;
  enabled: boolean;
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
      duration: 200,
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
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.largeFab,
        {
          backgroundColor: enabled ? backgroundColor : backgroundColor + "40",
          transform: [{ scale: pressScale }],
        },
        styles.largeShadow,
      ]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={label}
        accessibilityHint={
          enabled ? undefined : "Add a title above to enable saving."
        }
        accessibilityRole="button"
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
            },
          ]}>
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

  const showTitleError = saveAttempted && !title.trim();

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
  });

  if (loading) {
    return (
      <View
        style={styles.loadingContainer}
        accessibilityLabel="Loading task"
        accessibilityLiveRegion="polite">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={[
            typography.bodySmall,
            { color: colors.textSecondary, marginTop: SIZES.medium },
          ]}>
          Loading…
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScreenHeader
        title={isEditing ? "Edit task" : "New task"}
        showBackButton
        onBackPress={handleCancel}
      />

      <ScrollView
        style={styles.body}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomInsets.bottom + SIZES.extraLarge * 4 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <TaskTitleInput
          value={title}
          onChangeText={setTitle}
          showTitleError={showTitleError}
        />

        <TaskDescription value={description} onChangeText={setDescription} />

        <DateTimePicker dueDate={dueDate} onDateChange={setDueDate} />

        <AddTaskMoreOptions initiallyExpanded={isEditing}>
          <CategorySelector
            selectedCategory={category}
            onSelectCategory={setCategory}
          />

          <PrioritySelector
            selectedPriority={priority}
            onSelectPriority={setPriority}
          />

          <FormSection
            title="Reminders"
            optional
            subtitle="Optional nudge before the due time">
            <RemindMeButton
              value={remindMe}
              onChange={setRemindMe}
              maxOffsetMs={Math.max(dueDate.getTime() - Date.now(), 0)}
            />
          </FormSection>

          <RepetitionSelector
            repetition={repetition}
            onRepetitionChange={(newRepetition) => setRepetition(newRepetition)}
          />

          {!repetition.enabled && (
            <PredecessorTaskSelector
              availableTasks={availableTasks}
              selectedPredecessors={predecessorIds}
              onSelectPredecessor={handlePredecessorSelect}
            />
          )}
        </AddTaskMoreOptions>
      </ScrollView>

      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
        <GlassBar
          wrapperStyle={{
            marginBottom: bottomInsets.bottom,
          }}>
          <AnimatedActionButton
            onPress={handleCancel}
            iconName="close"
            iconColor={colors.error}
            backgroundColor={colors.card}
            borderColor={colors.border}
            label="Close without saving"
            reducedMotion={reducedMotion}
          />
          <AnimatedLargeSaveButton
            onPress={handleSave}
            iconName="checkmark"
            iconColor={colors.onPrimary}
            backgroundColor={colors.primary}
            label="Save"
            saveLabel="Save"
            enabled={isFormValid}
            reducedMotion={reducedMotion}
          />
        </GlassBar>
      </View>
    </KeyboardAvoidingView>
  );
};

export default AddTaskScreen;
