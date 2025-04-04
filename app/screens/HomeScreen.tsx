import React, {useState, useCallback, useMemo, useEffect} from 'react';
import { View, StyleSheet, Animated, Dimensions, Alert, Platform, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { RootStackParamList } from '../types';
import { storageService } from '../storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/HomeScreenComponents/Header';
import DateSlider from '../components/HomeScreenComponents/DateSlider';
import TaskList from '../components/HomeScreenComponents/TaskList';
import AddButton from '../components/HomeScreenComponents/AddButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Category } from '../components/AddTaskComponents/CategorySelector';
import { Task } from '../types';
import {useSettings} from "../context/SettingsContext";
import {useSafeAreaInsets} from "react-native-safe-area-context";

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;
type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;

const { width } = Dimensions.get('window');
const CATEGORIES_STORAGE_KEY = 'user_categories';

const HomeScreen: React.FC = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const route = useRoute<HomeScreenRouteProp>();
    const { colors, isDark } = useTheme();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFilterType, setSelectedFilterType] = useState<'createdAt' | 'dueDate'>('dueDate');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [activeCategoryName, setActiveCategoryName] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);

    // For animations
    const fadeAnim = useState(new Animated.Value(0))[0];
    const taskOpacity = useState(new Animated.Value(0))[0];

    // For date slider
    const today = useMemo(() => new Date(), []);
    const [currentDate, setCurrentDate] = useState(today);
    const [selectedMonth, setSelectedMonth] = useState(
        today.toLocaleString('default', { month: 'long', year: 'numeric' })
    );

    // Memoize the date range calculation to improve performance
    const dateRange = useMemo(() => {
        // Get the current date
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Create array of dates for the full month plus next 10 days
        const dates: Date[] = [];

        // Add dates from the current month
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        for (let i = 1; i <= lastDay.getDate(); i++) {
            dates.push(new Date(currentYear, currentMonth, i));
        }

        // Add first 15 days of next month
        const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
        for (let i = 1; i <= 15; i++) {
            dates.push(new Date(nextMonthYear, nextMonth, i));
        }

        return dates;
    }, []);

    // Load categories from AsyncStorage
    const loadCategories = useCallback(async () => {
        try {
            const storedCategories = await AsyncStorage.getItem(CATEGORIES_STORAGE_KEY);
            if (storedCategories) {
                const parsedCategories: Category[] = JSON.parse(storedCategories);
                setCategories(parsedCategories);

                // Update active category name if there's an active category
                if (activeCategory) {
                    const categoryDetails = parsedCategories.find(cat => cat.id === activeCategory);
                    if (categoryDetails) {
                        setActiveCategoryName(categoryDetails.name);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }, [activeCategory]);

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

    // Get category details by ID
    const getCategoryDetails = useCallback((categoryId: string | null) => {
        if (!categoryId) return null;
        return categories.find(cat => cat.id === categoryId) || null;
    }, [categories]);

    // Start entrance animations when component mounts
    useEffect(() => {
        Animated.sequence([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(taskOpacity, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    // Reload tasks when the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            loadTasks();

            // Check for success message from AddTaskScreen
            if (route.params?.showSuccessMessage) {
                // You could use a toast notification here instead of Alert
                Alert.alert('Success', route.params.message || 'Task action completed');

                // Clear the parameters to avoid showing the message again
                navigation.setParams({
                    showSuccessMessage: undefined,
                    message: undefined,
                    timestamp: undefined
                });
            }

            return () => {
                // Clean up any subscriptions if needed
            };
        }, [route.params?.timestamp])
    );

    // Filter tasks based on selected date and category
    useEffect(() => {
        if (tasks.length === 0) {
            setFilteredTasks([]);
            return;
        }

        const startOfDay = new Date(currentDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(currentDate);
        endOfDay.setHours(23, 59, 59, 999);

        const startTimestamp = startOfDay.getTime();
        const endTimestamp = endOfDay.getTime();

        // Filter tasks for the selected date based on date filter type
        let dateFiltered = tasks.filter(task => {
            // Use either createdAt or dueDate based on the filter type
            const relevantDate = selectedFilterType === 'dueDate' && task.dueDate
                ? task.dueDate
                : task.createdAt;

            const taskDate = new Date(relevantDate);
            taskDate.setHours(0, 0, 0, 0);
            const taskTimestamp = taskDate.getTime();
            return taskTimestamp >= startTimestamp && taskTimestamp <= endTimestamp;
        });

        // Further filter by category if one is selected
        if (activeCategory) {
            dateFiltered = dateFiltered.filter(task =>
                task.category === activeCategory
            );

            // Update the active category name
            const categoryDetails = getCategoryDetails(activeCategory);
            if (categoryDetails) {
                setActiveCategoryName(categoryDetails.name);
            }
        } else {
            setActiveCategoryName(null);
        }

        // Sort tasks by priority (crucial first, optional last)
        dateFiltered.sort((a, b) => {
            const priorityOrder = {
                'crucial': 0,
                'high': 1,
                'normal': 2,
                'optional': 3
            };
            return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
        });

        setFilteredTasks(dateFiltered);
    }, [currentDate, tasks, selectedFilterType, activeCategory, categories, getCategoryDetails]);

    const loadTasks = async () => {
        setRefreshing(true);
        try {
            const loadedTasks = await storageService.loadTasks();
            setTasks(loadedTasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
            Alert.alert(
                'Error',
                'Failed to load tasks. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleAddTask = useCallback(() => {
        // Pass the current selected date to the AddTask screen
        navigation.navigate('AddTask', { selectedDate: currentDate });
    }, [navigation, currentDate]);

    const handleTaskPress = useCallback((taskId: string) => {
        navigation.navigate('TaskDetails', { taskId });
    }, [navigation]);

    const {
        settings,

    } = useSettings();

// Update the handleToggleTaskCompletion function
    const handleToggleTaskCompletion = useCallback(async (taskId: string) => {
        try {
            // Find the task
            const taskToUpdate = tasks.find(task => task.id === taskId);
            if (!taskToUpdate) return;

            // Toggle completion status
            const newCompletionStatus = !taskToUpdate.completed;

            // Update the task in local state
            const updatedTasks = tasks.map(task =>
                task.id === taskId ? { ...task, completed: newCompletionStatus } : task
            );

            // Handle auto-archiving if enabled and task is being marked as completed
            if (settings.autoArchiveEnabled && newCompletionStatus) {
                // Find index of task to remove from local state
                const taskIndex = updatedTasks.findIndex(t => t.id === taskId);
                if (taskIndex !== -1) {
                    // Remove the task from the current tasks array
                    updatedTasks.splice(taskIndex, 1);
                }

                // Save the updated tasks (without the completed one)
                setTasks(updatedTasks);
                await storageService.saveTasks(updatedTasks);

                // Archive the task
                await storageService.archiveTask(taskId);
            } else {
                // Just save the updated tasks normally if not auto-archiving
                setTasks(updatedTasks);
                await storageService.saveTasks(updatedTasks);
            }
        } catch (error) {
            console.error('Error updating task:', error);
            Alert.alert('Error', 'Failed to update task status');
        }
    }, [tasks, settings.autoArchiveEnabled]);

    const handleDeleteTask = useCallback(async (taskId: string) => {
        try {
            Alert.alert(
                'Delete Task',
                'Are you sure you want to delete this task?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                            const updatedTasks = tasks.filter(task => task.id !== taskId);
                            setTasks(updatedTasks);
                            await storageService.saveTasks(updatedTasks);
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Error deleting task:', error);
            Alert.alert('Error', 'Failed to delete task');
        }
    }, [tasks]);

    const handleDateChange = useCallback((date: Date) => {
        setCurrentDate(date);
        setSelectedMonth(date.toLocaleString('default', { month: 'long', year: 'numeric' }));
    }, []);

    const toggleDateFilterType = useCallback(() => {
        setSelectedFilterType(prev => prev === 'createdAt' ? 'dueDate' : 'createdAt');
    }, []);

    const handleCategoryFilter = useCallback((category: string | null) => {
        setActiveCategory(category);

        // Update active category name immediately
        if (category) {
            const categoryDetails = getCategoryDetails(category);
            if (categoryDetails) {
                setActiveCategoryName(categoryDetails.name);
            }
        } else {
            setActiveCategoryName(null);
        }
    }, [getCategoryDetails]);

    // Format the date string for display
    useMemo(() => {
        return currentDate.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            weekday: 'short'
        });
    }, [currentDate]);

    // Handle navigation to Settings screen
    const handleSettingsPress = useCallback(() => {
        navigation.navigate('Settings');
    }, [navigation]);

    const insets = useSafeAreaInsets();
    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <StatusBar style={isDark ? "light" : "dark"} />

            <Header
                fadeAnim={fadeAnim}
                onCategoryFilterChange={handleCategoryFilter}
                activeCategory={activeCategory}
                onSettingsPress={handleSettingsPress}
            />

            {/* Date slider */}
            <DateSlider
                fadeAnim={fadeAnim}
                dateRange={dateRange}
                currentDate={currentDate}
                today={today}
                selectedMonth={selectedMonth}
                onDateChange={handleDateChange}
                filterType={selectedFilterType}
            />

            {/* Main content */}
            <View style={styles.contentContainer}>
                <TaskList
                    tasks={filteredTasks}
                    taskOpacity={taskOpacity}
                    loading={loading}
                    // refreshing={refreshing}
                    currentDate={currentDate}
                    onDeleteTask={handleDeleteTask}
                    onToggleTaskCompletion={handleToggleTaskCompletion}
                    onTaskPress={handleTaskPress}
                />
            </View>

            <AddButton
                onPress={handleAddTask}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,

    },
    contentContainer: {
        flex: 1,
    }
});

export default HomeScreen;