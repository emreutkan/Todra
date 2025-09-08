import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Animated, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AddButton from "../components/HomeScreenComponents/AddButton";
import DateSlider from "../components/HomeScreenComponents/DateSlider";
import SettingsButton from "../components/HomeScreenComponents/SettingsButton";
import TaskList from "../components/HomeScreenComponents/TaskList";
import { useTheme } from "../context/ThemeContext";
import { useHomeCategories } from "../hooks/useHomeCategories";
import { useHomeDateRange } from "../hooks/useHomeDateRange";
import { useHomeFilters } from "../hooks/useHomeFilters";
import { useHomeStats } from "../hooks/useHomeStats";
import { useHomeTasks } from "../hooks/useHomeTasks";
import { RootStackParamList } from "../types";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;
type HomeScreenRouteProp = RouteProp<RootStackParamList, "Home">;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const route = useRoute<HomeScreenRouteProp>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const { today, currentDate, selectedMonth, dateRange, handleDateChange } =
    useHomeDateRange();

  // Custom hooks for business logic
  const {
    tasks,
    loading,
    refreshing,
    loadTasks,
    handleToggleTaskCompletion,
    handleDeleteTask,
    handleTaskPress,
    handleAddTask,
  } = useHomeTasks(currentDate);

  const { filteredTasks, selectedFilterType } = useHomeFilters(tasks);

  const { completionStats, calculateTaskStats } = useHomeStats();

  const { categories, loadCategories } = useHomeCategories();

  // Animation values
  const taskOpacity = useState(new Animated.Value(0))[0];
  const filterViewHeight = useState(new Animated.Value(0))[0];

  // New scroll-based animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const collapsibleContentHeight = useRef(new Animated.Value(1)).current;
  const collapsibleContentOpacity = useRef(new Animated.Value(1)).current;

  // Start entrance animations when component mounts
  useEffect(() => {
    Animated.timing(taskOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Load categories when component mounts and when screen is focused
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
      return () => {};
    }, [loadCategories])
  );

  // Reload tasks when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTasks();

      // Check for success message from AddTaskScreen
      if (route.params?.showSuccessMessage) {
        Alert.alert("Success", route.params.message || "Task action completed");

        // Clear the parameters to avoid showing the message again
        navigation.setParams({
          showSuccessMessage: undefined,
          message: undefined,
          timestamp: undefined,
        });
      }

      return () => {
        // Clean up any subscriptions if needed
      };
    }, [route.params?.timestamp, loadTasks])
  );

  // Calculate stats when filtered tasks change
  useEffect(() => {
    calculateTaskStats(filteredTasks);
  }, [filteredTasks, calculateTaskStats]);

  // Handle navigation to Settings screen
  const handleSettingsPress = useCallback(() => {
    navigation.navigate("Settings");
  }, [navigation]);

  // Wrapper for loadTasks to match TaskList's expected signature
  const handleRefresh = useCallback(async () => {
    await loadTasks();
  }, [loadTasks]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <Animated.View
        style={[
          styles.filterPanel,
          {
            height: filterViewHeight,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            zIndex: 9, // Below header but above other content
          },
        ]}></Animated.View>

      <View style={styles.mainContentContainer}>
        <Animated.View>
          <DateSlider
            dateRange={dateRange}
            currentDate={currentDate}
            today={today}
            selectedMonth={selectedMonth}
            onDateChange={handleDateChange}
            filterType={selectedFilterType}
          />
        </Animated.View>

        <Animated.ScrollView
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}>
          <View style={styles.contentContainer}>
            <TaskList
              tasks={filteredTasks}
              taskOpacity={taskOpacity}
              loading={loading}
              currentDate={currentDate}
              onDeleteTask={handleDeleteTask}
              onToggleTaskCompletion={handleToggleTaskCompletion}
              onTaskPress={handleTaskPress}
              onRefresh={handleRefresh}
            />
          </View>
        </Animated.ScrollView>
      </View>

      <SettingsButton onPress={handleSettingsPress} />
      <AddButton onPress={() => handleAddTask(currentDate)} />
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
  filterPanel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    borderBottomWidth: 1,
  },
  contentContainer: {
    flex: 1,
  },
});

export default HomeScreen;
