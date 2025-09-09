import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import React, { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";

import { useTheme } from "../context/ThemeContext";
import { SIZES } from "../theme";
import { RootStackParamList } from "../types";

// Component imports
import ActionFooter from "../components/AddTaskComponents/ActionFooter";
import CategorySelector from "../components/AddTaskComponents/CategorySelector";
import DateTimePicker from "../components/AddTaskComponents/DateTimePicker";
import PredecessorTaskSelector from "../components/AddTaskComponents/PredecessorTaskSelector";
import PrioritySelector from "../components/AddTaskComponents/PrioritySelector";
import RepetitionSelector from "../components/AddTaskComponents/RepetitionSelector";
import TaskDescription from "../components/AddTaskComponents/TaskDescription";
import TaskTitleInput from "../components/AddTaskComponents/TaskTitleInput";
import ScreenHeader from "../components/common/ScreenHeader";
import { useAddTask } from "../hooks/useAddTask";

type AddTaskScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AddTask" | "EditTask"
>;

const AddTaskScreen: React.FC = () => {
  const navigation = useNavigation<AddTaskScreenNavigationProp>();
  const { colors } = useTheme();

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
      paddingBottom: SIZES.extraLarge * 2,
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
      <StatusBar style="dark" />

      {/* Animated Header */}
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

        <DateTimePicker
          dueDate={dueDate}
          onDateChange={setDueDate}
          initialDate={dueDate}
        />

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

      <ActionFooter
        onCancel={handleCancel}
        onSave={handleSave}
        saveEnabled={isFormValid}
      />
    </KeyboardAvoidingView>
  );
};

export default AddTaskScreen;
