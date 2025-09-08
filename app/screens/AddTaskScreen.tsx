import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: SIZES.medium,
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
      <ScreenHeader
        title={isEditing ? "Edit Task" : "Create New Task"}
        showBackButton
        onBackPress={handleCancel}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
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

        <PredecessorTaskSelector
          availableTasks={availableTasks}
          selectedPredecessors={predecessorIds}
          onSelectPredecessor={handlePredecessorSelect}
        />

        <TaskDescription value={description} onChangeText={setDescription} />
      </ScrollView>

      <ActionFooter
        onCancel={handleCancel}
        onSave={handleSave}
        saveEnabled={isFormValid}
      />
    </KeyboardAvoidingView>
  );
};

export default AddTaskScreen;
