import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomNavigator from "../components/HomeScreenComponents/BottomNavigator";
import DateSlider from "../components/HomeScreenComponents/DateSlider";
import FilterPopup from "../components/HomeScreenComponents/FilterPopup";
import TaskList from "../components/HomeScreenComponents/TaskList";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { useHomeCategories } from "../hooks/useHomeCategories";
import { useHomeDateRange } from "../hooks/useHomeDateRange";
import { useHomeFilters } from "../hooks/useHomeFilters";
import { useHomeTasks } from "../hooks/useHomeTasks";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { HOME_GUTTER } from "../theme";
import { RootStackParamList } from "../types";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;
type HomeScreenRouteProp = RouteProp<RootStackParamList, "Home">;

const runHaptic = (fn: () => Promise<void>) => {
  void fn().catch(() => {});
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const route = useRoute<HomeScreenRouteProp>();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const { today, currentDate, selectedMonth, dateRange, handleDateChange } =
    useHomeDateRange();

  // Custom hooks for business logic
  const {
    tasks,
    loading,
    loadTasks,
    handleToggleTaskCompletion,
    handleDeleteTask,
    handleTaskPress,
    handleAddTask,
  } = useHomeTasks(currentDate);

  const {
    filteredTasks,
    activeCategory,
    selectedPriority,
    activeFilterCount,
    clearFilters,
    setCategoryFilter,
    setPriorityFilter,
  } = useHomeFilters(tasks);

  const { categories, loadCategories } = useHomeCategories();
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const reducedMotion = useReducedMotion();

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(12)).current;
  const listOpacity = useRef(new Animated.Value(0)).current;
  const listTranslateY = useRef(new Animated.Value(10)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const footerTranslateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    if (reducedMotion) {
      headerOpacity.setValue(1);
      headerTranslateY.setValue(0);
      listOpacity.setValue(1);
      listTranslateY.setValue(0);
      footerOpacity.setValue(1);
      footerTranslateY.setValue(0);
      return;
    }

    const easing = Easing.out(Easing.cubic);
    const duration = 400;
    const slideIn = (opacity: Animated.Value, translateY: Animated.Value) =>
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          easing,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration,
          easing,
          useNativeDriver: true,
        }),
      ]);

    const sequence = Animated.stagger(88, [
      slideIn(headerOpacity, headerTranslateY),
      slideIn(listOpacity, listTranslateY),
      slideIn(footerOpacity, footerTranslateY),
    ]);
    sequence.start();
    return () => sequence.stop();
  }, [
    reducedMotion,
    headerOpacity,
    headerTranslateY,
    listOpacity,
    listTranslateY,
    footerOpacity,
    footerTranslateY,
  ]);

  const filterCategories = useMemo(() => {
    const defaults = [
      "Personal",
      "Work",
      "Shopping",
      "Health",
      "Education",
    ];
    const named = categories.map((c) => c.name).filter(Boolean) as string[];
    return [...defaults, ...named].filter(
      (v, i, arr) => arr.indexOf(v) === i
    );
  }, [categories]);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
      void loadTasks();

      if (route.params?.showSuccessMessage) {
        runHaptic(() =>
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        );
        showToast(
          route.params.message || "Task action completed",
          "success"
        );
        navigation.setParams({
          showSuccessMessage: undefined,
          message: undefined,
          timestamp: undefined,
        });
      }
    }, [
      route.params?.timestamp,
      route.params?.showSuccessMessage,
      route.params?.message,
      loadCategories,
      loadTasks,
      showToast,
      navigation,
    ])
  );

  // Handle navigation to Settings screen
  const handleSettingsPress = useCallback(() => {
    navigation.navigate("Settings");
  }, [navigation]);

  const handleAssistantPress = useCallback(() => {
    navigation.navigate("AiAssistant");
  }, [navigation]);

  // Wrapper for loadTasks to match TaskList's expected signature
  const handleRefresh = useCallback(async () => {
    await loadTasks();
  }, [loadTasks]);

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={styles.mainContentContainer}>
        <Animated.View
          style={{
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          }}>
          <DateSlider
            dateRange={dateRange}
            currentDate={currentDate}
            today={today}
            selectedMonth={selectedMonth}
            onDateChange={handleDateChange}
            safeAreaTopInset={insets.top}
            onHabitsPress={() => navigation.navigate("Habits")}
          />
        </Animated.View>

        <View
          style={[
            styles.contentContainer,
            { paddingHorizontal: HOME_GUTTER },
          ]}>
          <TaskList
            tasks={filteredTasks}
            listEntranceOpacity={listOpacity}
            listEntranceTranslateY={listTranslateY}
            loading={loading}
            currentDate={currentDate}
            onDeleteTask={handleDeleteTask}
            onToggleTaskCompletion={handleToggleTaskCompletion}
            onTaskPress={handleTaskPress}
            onRefresh={handleRefresh}
          />
        </View>
      </View>

      <Animated.View
        style={[
          styles.footerDock,
          {
            opacity: footerOpacity,
            transform: [{ translateY: footerTranslateY }],
          },
        ]}>
        <BottomNavigator
          onFilterPress={() => setIsFilterVisible(true)}
          onAddTaskPress={() => handleAddTask()}
          onSettingsPress={handleSettingsPress}
          onAssistantPress={handleAssistantPress}
          activeFilterCount={activeFilterCount}
        />
      </Animated.View>

      <FilterPopup
        visible={isFilterVisible}
        categories={filterCategories}
        activeCategory={activeCategory}
        selectedPriority={selectedPriority}
        onClose={() => setIsFilterVisible(false)}
        onCategoryChange={setCategoryFilter}
        onPriorityChange={setPriorityFilter}
        onClear={clearFilters}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContentContainer: {
    flex: 1,
    position: "relative",
  },
  contentContainer: {
    flex: 1,
  },
  footerDock: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default HomeScreen;
