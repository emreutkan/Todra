import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../context/ThemeContext";
import { SIZES } from "../theme";

// Component imports
import CategorySelector from "../components/AddTaskComponents/CategorySelector";
import DateTimePicker from "../components/AddTaskComponents/DateTimePicker";
import FormSection from "../components/AddTaskComponents/FormSection";
import PredecessorTaskSelector from "../components/AddTaskComponents/PredecessorTaskSelector";
import PrioritySelector from "../components/AddTaskComponents/PrioritySelector";
import RepetitionSelector from "../components/AddTaskComponents/RepetitionSelector";
import TaskDescription from "../components/AddTaskComponents/TaskDescription";
import TaskTitleInput from "../components/AddTaskComponents/TaskTitleInput";
import RemindMeButton from "../components/common/RemindMeButton";
import GlassBar from "../components/common/GlassBar";
import ScreenHeader from "../components/common/ScreenHeader";
import { useAddTask } from "../hooks/useAddTask";
import { useReducedMotion } from "../hooks/useReducedMotion";

// Styles for the floating buttons
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
      width: 126,
      height: 56,
      borderRadius: 28,
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
    shadow: {
      ...Platform.select({
        ios: {
          shadowColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
        },
        android: {
          // elevation: 6,
        },
      }),
    },
    largeShadow: {
      ...Platform.select({
        ios: {
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          // elevation: 20,
        },
      }),
    },
  });

// Animated Button Component (matching HomeScreen style)
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

  const handlePressIn = () => {
    if (reducedMotion) {
      pressScale.setValue(1.2);
      return;
    }
    Animated.timing(pressScale, {
      toValue: 1.2,
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

// Special large button for save (size of + and filter combined)
const AnimatedLargeSaveButton = ({
  onPress,
  iconName,
  iconColor,
  backgroundColor,
  label,
  enabled,
  reducedMotion,
}: {
  onPress: () => void;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  backgroundColor: string;
  label: string;
  enabled: boolean;
  reducedMotion: boolean;
}) => {
  const { colors } = useTheme();
  const pressScale = useRef(new Animated.Value(1)).current;
  const styles = createButtonStyles(colors.shadowColor);

  const handlePressIn = () => {
    if (!enabled) return;
    if (reducedMotion) {
      pressScale.setValue(1.2);
      return;
    }
    Animated.timing(pressScale, {
      toValue: 1.2,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (!enabled) return;
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
        activeOpacity={enabled ? 1 : 0.5}
        onPress={enabled ? onPress : undefined}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={label}
        accessibilityRole="button"
        style={styles.touchable}>
        <Ionicons
          name={iconName}
          size={24}
          color={enabled ? iconColor : iconColor + "80"}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const AddTaskScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const bottomInsets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  // Animation values for sliding header
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = 80; // Approximate header height
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, headerHeight],
    outputRange: [0, -headerHeight],
    extrapolate: "clamp",
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, headerHeight * 0.5],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const {
    // Form state
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
    loading,

    // Predecessor state
    predecessorIds,
    availableTasks,

    // Repetition state
    repetition,
    setRepetition,

    // Reminder state
    remindMe,
    setRemindMe,

    // Actions
    handleSave,
    handleCancel,
    handlePredecessorSelect,

    // Meta
    isEditing,
  } = useAddTask();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: SIZES.medium,
      paddingTop: 120, // Add more top padding for better spacing after header slides up
      paddingBottom: 100, // Add extra padding to prevent content from being hidden behind floating buttons
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <Animated.View
        style={[
          styles.headerContainer,
          {
            transform: [{ translateY: headerTranslateY }],
            opacity: headerOpacity,
          },
        ]}>
        <ScreenHeader
          title={isEditing ? "Edit Task" : "Create New Task"}
          showBackButton
          onBackPress={handleCancel}
        />
      </Animated.View>

      <Animated.ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}>
        <TaskTitleInput value={title} onChangeText={setTitle} />

        <CategorySelector
          selectedCategory={category}
          onSelectCategory={setCategory}
        />

        <PrioritySelector
          selectedPriority={priority}
          onSelectPriority={setPriority}
        />

        <DateTimePicker dueDate={dueDate} onDateChange={setDueDate} />

        <FormSection title="Set Reminder">
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

        <TaskDescription value={description} onChangeText={setDescription} />
      </Animated.ScrollView>

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
            label="Cancel"
            reducedMotion={reducedMotion}
          />
          <AnimatedLargeSaveButton
            onPress={handleSave}
            iconName="checkmark"
            iconColor={colors.onPrimary}
            backgroundColor={colors.primary}
            label="Save Task"
            enabled={isFormValid}
            reducedMotion={reducedMotion}
          />
        </GlassBar>
      </View>
    </KeyboardAvoidingView>
  );
};

export default AddTaskScreen;
