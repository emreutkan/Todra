import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Text,
    Dimensions,
    Alert,
    TouchableOpacity,
    Animated,
    StatusBar as RNStatusBar,
    Platform
} from 'react-native';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import DateSlider from '../components/HomeScreenComponents/DateSlider';
import TaskList from '../components/HomeScreenComponents/TaskList';
import AddButton from '../components/HomeScreenComponents/AddButton';
import ProgressChart from '../components/HomeScreenComponents/ProgressChart';
import { Task, TaskPriority } from '../types';
import { useSettings } from "../context/SettingsContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    getAllTasks,
    getArchivedTasks,
    saveActiveTasks,
    saveArchivedTasks,
} from "../services/taskStorageService";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from "../constants/StorageKeys";
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { Category } from '../components/AddTaskComponents/CategorySelector';

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;
type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const route = useRoute<HomeScreenRouteProp>();
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const { settings } = useSettings();

    // Task data state
    const [tasks, setTasks] = useState<Task[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filter state
    const [selectedFilterType, setSelectedFilterType] = useState<'createdAt' | 'dueDate'>('dueDate');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [filterView, setFilterView] = useState<boolean>(false);
    const [selectedPriority, setSelectedPriority] = useState<TaskPriority | 'all'>('all');
    const [viewType, setViewType] = useState<'calendar' | 'list'>('calendar');

    // Chart data
    const [completionStats, setCompletionStats] = useState({
        completed: 0,
        remaining: 0,
        totalTasks: 0
    });

    // Animation values
    const fadeAnim = useState(new Animated.Value(0))[0];
    const taskOpacity = useState(new Animated.Value(0))[0];
    const filterViewHeight = useState(new Animated.Value(0))[0];

    // New scroll-based animation values
    const scrollY = useRef(new Animated.Value(0)).current;
    const collapsibleContentHeight = useRef(new Animated.Value(1)).current;
    const collapsibleContentOpacity = useRef(new Animated.Value(1)).current;

    // Date selection state
    const today = useMemo(() => new Date(), []);
    const [currentDate, setCurrentDate] = useState(today);
    const [selectedMonth, setSelectedMonth] = useState(
        today.toLocaleString('default', { month: 'long', year: 'numeric' })
    );

    // Define the height of collapsible sections for animation calculations
    const COLLAPSIBLE_TOTAL_HEIGHT = 190; // Adjust based on your design (progress + date slider)

    // Setup scroll animations
    useEffect(() => {
        // Reset animation values
        collapsibleContentHeight.setValue(1);
        collapsibleContentOpacity.setValue(1);

        // Create interpolations based on scroll position
        const heightInterpolation = scrollY.interpolate({
            inputRange: [0, COLLAPSIBLE_TOTAL_HEIGHT],
            outputRange: [1, 0],
            extrapolate: 'clamp'
        });

        const opacityInterpolation = scrollY.interpolate({
            inputRange: [0, COLLAPSIBLE_TOTAL_HEIGHT * 0.7],
            outputRange: [1, 0],
            extrapolate: 'clamp'
        });

        // Connect the animated values
        Animated.parallel([
            Animated.timing(collapsibleContentHeight, {
                toValue: heightInterpolation,
                duration: 0,
                useNativeDriver: false
            }),
            Animated.timing(collapsibleContentOpacity, {
                toValue: opacityInterpolation,
                duration: 0,
                useNativeDriver: false
            })
        ]).start();
    }, [scrollY]);

    // Memoize the date range calculation to improve performance
    const dateRange = useMemo(() => {
        // Get the current date
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Create array of dates for the full month plus next 15 days
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
            const storedCategories = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
            if (storedCategories) {
                const parsedCategories: Category[] = JSON.parse(storedCategories);
                setCategories(parsedCategories);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }, []);

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

    // Calculate task completion stats
    const calculateTaskStats = useCallback((taskList: Task[]) => {
        if (taskList.length === 0) {
            // If there are no tasks, set all values to 0
            setCompletionStats({
                completed: 0,
                remaining: 0,
                totalTasks: 0
            });
            return;
        }

        const completed = taskList.filter(task => task.completed).length;
        const remaining = taskList.filter(task => !task.completed).length;

        setCompletionStats({
            completed,
            remaining,
            totalTasks: taskList.length
        });
    }, []);

    // Reload tasks when the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            loadTasks();

            // Check for success message from AddTaskScreen
            if (route.params?.showSuccessMessage) {
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

    // Filter tasks based on selected date, category and priority
    useEffect(() => {
        if (tasks.length === 0) {
            setFilteredTasks([]);
            return;
        }

        // Apply date filtering
        let result = [...tasks];

        if (viewType === 'calendar') {
            const startOfDay = new Date(currentDate);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(currentDate);
            endOfDay.setHours(23, 59, 59, 999);

            const startTimestamp = startOfDay.getTime();
            const endTimestamp = endOfDay.getTime();

            // Filter tasks for the selected date based on date filter type
            result = result.filter(task => {
                const relevantDate = selectedFilterType === 'dueDate' && task.dueDate
                    ? task.dueDate
                    : task.createdAt;

                const taskDate = new Date(relevantDate);
                taskDate.setHours(0, 0, 0, 0);
                const taskTimestamp = taskDate.getTime();
                return taskTimestamp >= startTimestamp && taskTimestamp <= endTimestamp;
            });
        }

        // Apply category filter if one is selected
        if (activeCategory) {
            result = result.filter(task => task.category === activeCategory);
        }

        // Apply priority filter
        if (selectedPriority !== 'all') {
            result = result.filter(task => task.priority === selectedPriority);
        }

        // Sort tasks by priority (crucial first, optional last)
        result.sort((a, b) => {
            const priorityOrder = {
                'high': 0,
                'normal': 1,
                'low': 2
            };
            return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
        });

        setFilteredTasks(result);
        calculateTaskStats(result);
    }, [currentDate, tasks, selectedFilterType, activeCategory, viewType, selectedPriority, calculateTaskStats]);

    const loadTasks = async () => {
        setRefreshing(true);
        try {
            const { active } = await getAllTasks();
            setTasks(active);
            calculateTaskStats(active);
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
        navigation.navigate('AddTask', { selectedDate: currentDate });
    }, [navigation, currentDate]);

    const handleTaskPress = useCallback((taskId: string) => {
        navigation.navigate('TaskDetails', { taskId });
    }, [navigation]);

    const handleToggleTaskCompletion = useCallback(async (taskId: string) => {
        try {
            // Find the task
            const taskToUpdate = tasks.find(task => task.id === taskId);
            if (!taskToUpdate) return;

            // Toggle completion status
            const newCompletionStatus = !taskToUpdate.completed;

            // Update the task locally first
            const updatedTask = {
                ...taskToUpdate,
                completed: newCompletionStatus
            };

            // Handle auto-archiving if enabled and task is being marked as completed
            if (settings.autoArchiveEnabled && newCompletionStatus) {
                // Archive the completed task
                const archivedTask = {
                    ...updatedTask,
                    archived: true,
                    archivedAt: new Date().toISOString()
                };

                // Get current archived tasks
                const archivedTasks = await getArchivedTasks();

                // Add to archived tasks
                await saveArchivedTasks([...archivedTasks, archivedTask]);

                // Remove from current tasks
                const updatedTasks = tasks.filter(t => t.id !== taskId);
                setTasks(updatedTasks);
                await saveActiveTasks(updatedTasks);
            } else {
                // Just update the completion status
                const updatedTasks = tasks.map(task =>
                    task.id === taskId ? updatedTask : task
                );
                setTasks(updatedTasks);
                await saveActiveTasks(updatedTasks);
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
                            await saveActiveTasks(updatedTasks);
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

    const toggleFilterView = useCallback(() => {
        Animated.timing(filterViewHeight, {
            toValue: filterView ? 0 : 200,
            duration: 300,
            useNativeDriver: false
        }).start();

        setFilterView(!filterView);
    }, [filterView, filterViewHeight]);

    const toggleDateFilterType = useCallback(() => {
        setSelectedFilterType(prev => prev === 'createdAt' ? 'dueDate' : 'createdAt');
    }, []);

    const handleCategoryFilter = useCallback((category: string | null) => {
        setActiveCategory(category);
    }, []);

    const handlePriorityFilter = useCallback((priority: TaskPriority | 'all') => {
        setSelectedPriority(priority);
    }, []);

    const toggleViewType = useCallback(() => {
        setViewType(prev => prev === 'calendar' ? 'list' : 'calendar');
    }, []);

    // Handle navigation to Settings screen
    const handleSettingsPress = useCallback(() => {
        navigation.navigate('Settings');
    }, [navigation]);

    // Handle navigation to All Tasks screen
    const handleAllTasksPress = useCallback(() => {
        navigation.navigate('AllTasks');
    }, [navigation]);

    // Handle navigation to Archived Tasks screen
    const handleArchivedTasksPress = useCallback(() => {
        navigation.navigate('ArchivedTasks');
    }, [navigation]);

    const formatDate = (date: Date): string => {
        if (isToday(date)) {
            return 'Today';
        } else if (isTomorrow(date)) {
            return 'Tomorrow';
        } else if (isYesterday(date)) {
            return 'Yesterday';
        }
        return format(date, 'EEEE, MMMM d, yyyy');
    };

    // Calculate the animated height for the collapsible section
    const collapsibleHeight = collapsibleContentHeight.interpolate({
        inputRange: [0, 1],
        outputRange: [0, COLLAPSIBLE_TOTAL_HEIGHT]
    });

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <StatusBar style={isDark ? "light" : "dark"} />

            {/* App Header - Fixed, does not collapse */}
            <Animated.View
                style={[
                    styles.header,
                    {
                        opacity: fadeAnim,
                        backgroundColor: colors.card,
                        borderBottomColor: colors.border,
                        zIndex: 10 // Ensure header stays on top
                    }
                ]}
            >
                <View style={styles.headerContent}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Task Planner</Text>

                    <View style={styles.headerControls}>
                        <TouchableOpacity
                            style={[styles.iconButton, { backgroundColor: colors.surface }]}
                            onPress={toggleFilterView}
                        >
                            <Ionicons name="filter" size={20} color={filterView ? colors.primary : colors.text} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.iconButton, { backgroundColor: colors.surface }]}
                            onPress={toggleViewType}
                        >
                            <Ionicons
                                name={viewType === 'calendar' ? "list" : "calendar"}
                                size={20}
                                color={colors.text}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.iconButton, { backgroundColor: colors.surface }]}
                            onPress={handleSettingsPress}
                        >
                            <Ionicons name="settings-outline" size={20} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Current date display */}
                {viewType === 'calendar' && (
                    <View style={styles.currentDateContainer}>
                        <Text style={[styles.currentDateText, { color: colors.text }]}>
                            {formatDate(currentDate)}
                        </Text>
                        <TouchableOpacity
                            style={[styles.filterTypeButton, { backgroundColor: colors.primary + '20' }]}
                            onPress={toggleDateFilterType}
                        >
                            <Text style={[styles.filterTypeText, { color: colors.primary }]}>
                                {selectedFilterType === 'dueDate' ? 'Due Date' : 'Created Date'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </Animated.View>

            {/* Filter panel - Part of the fixed header when active */}
            <Animated.View
                style={[
                    styles.filterPanel,
                    {
                        height: filterViewHeight,
                        backgroundColor: colors.card,
                        borderBottomColor: colors.border,
                        zIndex: 9 // Below header but above other content
                    }
                ]}
            >
                <View style={styles.filterSection}>
                    <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Categories</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor: activeCategory === null ? colors.primary : colors.surface,
                                    borderColor: colors.border
                                }
                            ]}
                            onPress={() => handleCategoryFilter(null)}
                        >
                            <Text style={[
                                styles.filterChipText,
                                { color: activeCategory === null ? colors.onPrimary : colors.text }
                            ]}>
                                All
                            </Text>
                        </TouchableOpacity>

                        {categories.map(category => (
                            <TouchableOpacity
                                key={category.id}
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: activeCategory === category.id ? colors.primary : colors.surface,
                                        borderColor: colors.border
                                    }
                                ]}
                                onPress={() => handleCategoryFilter(category.id)}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    { color: activeCategory === category.id ? colors.onPrimary : colors.text }
                                ]}>
                                    {category.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.filterSection}>
                    <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Priority</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor: selectedPriority === 'all' ? colors.primary : colors.surface,
                                    borderColor: colors.border
                                }
                            ]}
                            onPress={() => handlePriorityFilter('all')}
                        >
                            <Text style={[
                                styles.filterChipText,
                                { color: selectedPriority === 'all' ? colors.onPrimary : colors.text }
                            ]}>
                                All
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor: selectedPriority === 'high' ? colors.primary : colors.surface,
                                    borderColor: colors.border
                                }
                            ]}
                            onPress={() => handlePriorityFilter('high')}
                        >
                            <View style={styles.priorityChipContent}>
                                <View style={[styles.priorityIndicator, { backgroundColor: colors.error }]} />
                                <Text style={[
                                    styles.filterChipText,
                                    { color: selectedPriority === 'high' ? colors.onPrimary : colors.text }
                                ]}>
                                    High
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor: selectedPriority === 'normal' ? colors.primary : colors.surface,
                                    borderColor: colors.border
                                }
                            ]}
                            onPress={() => handlePriorityFilter('normal')}
                        >
                            <View style={styles.priorityChipContent}>
                                <View style={[styles.priorityIndicator, { backgroundColor: colors.warning }]} />
                                <Text style={[
                                    styles.filterChipText,
                                    { color: selectedPriority === 'normal' ? colors.onPrimary : colors.text }
                                ]}>
                                    Normal
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor: selectedPriority === 'low' ? colors.primary : colors.surface,
                                    borderColor: colors.border
                                }
                            ]}
                            onPress={() => handlePriorityFilter('low')}
                        >
                            <View style={styles.priorityChipContent}>
                                <View style={[styles.priorityIndicator, { backgroundColor: colors.info }]} />
                                <Text style={[
                                    styles.filterChipText,
                                    { color: selectedPriority === 'low' ? colors.onPrimary : colors.text }
                                ]}>
                                    Low
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                <View style={styles.filterActions}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={handleAllTasksPress}
                    >
                        <Text style={[styles.actionButtonText, { color: colors.text }]}>All Tasks</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={handleArchivedTasksPress}
                    >
                        <Text style={[styles.actionButtonText, { color: colors.text }]}>Archived</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* Main content container - fixed structure with collapsible content */}
            <View style={styles.mainContentContainer}>
                {/* Collapsible content wrapper */}
                <Animated.View
                    style={[
                        styles.collapsibleContainer,
                        {
                            height: collapsibleHeight,
                            opacity: collapsibleContentOpacity
                        }
                    ]}
                >
                    {/* Task Progress Chart - Only shown when there are tasks */}
                    {completionStats.totalTasks > 0 && (
                        <View
                            style={[
                                styles.progressSection,
                                {
                                    backgroundColor: colors.card,
                                    borderBottomColor: colors.border,
                                }
                            ]}
                        >
                            <ProgressChart
                                completed={completionStats.completed}
                                remaining={completionStats.remaining}
                                colors={colors}
                            />
                            <View style={styles.statsContainer}>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
                                    <Text style={[styles.statValue, { color: colors.success }]}>{completionStats.completed}</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Remaining</Text>
                                    <Text style={[styles.statValue, { color: colors.primary }]}>{completionStats.remaining}</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
                                    <Text style={[styles.statValue, { color: colors.text }]}>{completionStats.totalTasks}</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Date Slider - Only shown in calendar view */}
                    {viewType === 'calendar' && (
                        <View style={styles.dateSliderContainer}>
                            <DateSlider
                                fadeAnim={fadeAnim}
                                dateRange={dateRange}
                                currentDate={currentDate}
                                today={today}
                                selectedMonth={selectedMonth}
                                onDateChange={handleDateChange}
                                filterType={selectedFilterType}
                            />
                        </View>
                    )}
                </Animated.View>

                {/* Task List - Scrollable */}
                <Animated.ScrollView
                    style={styles.scrollContainer}
                    scrollEventThrottle={16}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false }
                    )}
                >
                    {/* Empty space to account for collapsible content when fully expanded */}
                    <View style={{ height: COLLAPSIBLE_TOTAL_HEIGHT }} />

                    {/* Task List Content */}
                    <View style={styles.contentContainer}>
                        <TaskList
                            tasks={filteredTasks}
                            taskOpacity={taskOpacity}
                            loading={loading}
                            currentDate={currentDate}
                            onDeleteTask={handleDeleteTask}
                            onToggleTaskCompletion={handleToggleTaskCompletion}
                            onTaskPress={handleTaskPress}
                            onRefresh={loadTasks}
                        />
                    </View>
                </Animated.ScrollView>
            </View>

            {/* Add Button */}
            <AddButton onPress={handleAddTask} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    mainContentContainer: {
        flex: 1,
        position: 'relative',
    },
    collapsibleContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        zIndex: 5,
        overflow: 'hidden',
    },
    scrollContainer: {
        flex: 1,
        zIndex: 1,
    },
    header: {
        borderBottomWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 10,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            }
        })
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    currentDateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    currentDateText: {
        fontSize: 16,
        fontWeight: '500',
    },
    filterTypeButton: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
    },
    filterTypeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    filterPanel: {
        borderBottomWidth: 1,
        overflow: 'hidden',
    },
    filterSection: {
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    filterSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    filterScrollView: {
        marginBottom: 12,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        marginRight: 8,
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '500',
    },
    priorityChipContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    priorityIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    filterActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        minWidth: 100,
        alignItems: 'center',
    },
    actionButtonText: {
        fontSize: 13,
        fontWeight: '500',
    },
    contentContainer: {
        flex: 1,
        paddingBottom: 80, // Extra padding to ensure the add button doesn't overlay content
    },
    progressSection: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    dateSliderContainer: {
        backgroundColor: 'transparent',
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        flex: 1,
        marginLeft: 10,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '600',
    },
    statDivider: {
        width: 1,
        height: 30,
        opacity: 0.2,
        backgroundColor: '#000',
    },
});

export default HomeScreen;