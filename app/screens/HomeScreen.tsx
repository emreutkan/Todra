import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    Animated,
    PanResponder,
    Dimensions,
    ScrollView,
    ImageBackground,
    StatusBar as RNStatusBar,
    Platform
} from 'react-native';
import { COLORS, PRIORITY_COLORS, SIZES } from '../theme';
import { Task, TaskPriority } from '../types';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { storageService } from '../storage';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = -100; // Threshold for considering a delete swipe
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : RNStatusBar.currentHeight || 0;

const HomeScreen = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<HomeScreenNavigationProp>();

    // For animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const taskOpacity = useRef(new Animated.Value(0)).current;

    // For date slider
    const today = new Date();
    const [currentDate, setCurrentDate] = useState(today);
    const [selectedMonth, setSelectedMonth] = useState(today.toLocaleString('default', { month: 'long' }));
    const [dateRange, setDateRange] = useState<Date[]>([]);

    // Create date range for slider (7 days before and after today)
    useEffect(() => {
        const range: Date[] = [];
        for (let i = -7; i <= 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            range.push(date);
        }
        setDateRange(range);

        // Start entrance animations
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
        React.useCallback(() => {
            loadTasks();
        }, [])
    );

    // Filter tasks based on selected date
    useEffect(() => {
        if (tasks.length > 0) {
            const startOfDay = new Date(currentDate);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(currentDate);
            endOfDay.setHours(23, 59, 59, 999);

            const startTimestamp = startOfDay.getTime();
            const endTimestamp = endOfDay.getTime();

            // Filter tasks for the selected date
            const filtered = tasks.filter(task => {
                const taskDate = new Date(task.createdAt);
                taskDate.setHours(0, 0, 0, 0);
                const taskTimestamp = taskDate.getTime();
                return taskTimestamp >= startTimestamp && taskTimestamp <= endTimestamp;
            });

            setFilteredTasks(filtered);

            // Update month when date changes
            setSelectedMonth(currentDate.toLocaleString('default', { month: 'long' }));
        }
    }, [currentDate, tasks]);

    const loadTasks = async () => {
        try {
            const loadedTasks = await storageService.loadTasks();
            setTasks(loadedTasks);
            setLoading(false);
        } catch (error) {
            console.error('Error loading tasks:', error);
            setLoading(false);
        }
    };

    const handleAddTask = () => {
        navigation.navigate('AddTask');
    };

    const handleTaskPress = (taskId: string) => {
        navigation.navigate('TaskDetails', { taskId });
    };

    const toggleTaskCompletion = async (taskId: string) => {
        const updatedTasks = tasks.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        setTasks(updatedTasks);
        await storageService.saveTasks(updatedTasks);
    };

    const deleteTask = async (taskId: string) => {
        try {
            const updatedTasks = tasks.filter(task => task.id !== taskId);
            setTasks(updatedTasks);
            await storageService.saveTasks(updatedTasks);
        } catch (error) {
            console.error('Error deleting task:', error);
            Alert.alert('Error', 'Failed to delete task');
        }
    };

    const getPriorityLabel = (priority: TaskPriority) => {
        return priority.charAt(0).toUpperCase() + priority.slice(1);
    };

    const renderSwipeableTaskItem = ({ item, index }: { item: Task, index: number }) => {
        const translateX = new Animated.Value(0);

        const panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                translateX.setValue(gestureState.dx);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx < SWIPE_THRESHOLD) {
                    // Delete the task
                    Animated.timing(translateX, {
                        toValue: -width,
                        duration: 250,
                        useNativeDriver: true,
                    }).start(() => deleteTask(item.id));
                } else {
                    // Reset position
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        });

        // Animating the task item entrance
        const taskAnimStyle = {
            transform: [{ translateX }],
            opacity: taskOpacity,
        };

        return (
            <Animated.View
                style={[
                    styles.taskItemContainer,
                    taskAnimStyle,
                    { zIndex: filteredTasks.length - index }
                ]}
                {...panResponder.panHandlers}
            >
                <LinearGradient
                    colors={[COLORS.card, COLORS.card + '90']}
                    style={styles.taskItem}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <TouchableOpacity
                        style={styles.taskContent}
                        onPress={() => handleTaskPress(item.id)}
                        activeOpacity={0.7}
                    >
                        <TouchableOpacity
                            style={[
                                styles.checkbox,
                                item.completed && styles.checkboxChecked
                            ]}
                            onPress={() => toggleTaskCompletion(item.id)}
                        >
                            {item.completed && (
                                <View style={styles.checkmark}>
                                    <Text style={styles.checkmarkText}>✓</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <View style={styles.taskTextContainer}>
                            <Text
                                style={[
                                    styles.taskTitle,
                                    item.completed && styles.taskCompleted
                                ]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {item.title}
                            </Text>
                            {item.description ? (
                                <Text
                                    style={[
                                        styles.taskDescription,
                                        item.completed && styles.taskCompleted
                                    ]}
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                >
                                    {item.description}
                                </Text>
                            ) : null}
                            <View
                                style={[
                                    styles.priorityBadge,
                                    { backgroundColor: PRIORITY_COLORS[item.priority] }
                                ]}
                            >
                                <Text style={styles.priorityText}>
                                    {getPriorityLabel(item.priority)}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </LinearGradient>
            </Animated.View>
        );
    };

    const renderDateSlider = () => {
        return (
            <Animated.View
                style={[
                    styles.dateSliderContainer,
                    { opacity: fadeAnim }
                ]}
            >
                <BlurView intensity={15} tint="dark" style={styles.blurContainer}>
                    <Text style={styles.monthText}>{selectedMonth}</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.dateScrollContent}
                    >
                        {dateRange.map((date, index) => {
                            const isSelected = date.getDate() === currentDate.getDate() &&
                                date.getMonth() === currentDate.getMonth();
                            const isToday = date.getDate() === today.getDate() &&
                                date.getMonth() === today.getMonth();

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.dateButton,
                                        isSelected && styles.selectedDateButton,
                                        isToday && !isSelected && styles.todayDateButton
                                    ]}
                                    onPress={() => setCurrentDate(date)}
                                >
                                    <Text
                                        style={[
                                            styles.dateText,
                                            isSelected && styles.selectedDateText,
                                            isToday && !isSelected && styles.todayDateText
                                        ]}
                                    >
                                        {date.getDate()}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.dayText,
                                            isSelected && styles.selectedDateText,
                                            isToday && !isSelected && styles.todayDateText
                                        ]}
                                    >
                                        {date.toLocaleString('default', { weekday: 'short' }).substr(0, 3)}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </BlurView>
            </Animated.View>
        );
    };

    const renderTasksHeader = () => {
        return (
            <View style={styles.tasksHeader}>
                <View style={styles.headerDivider}>
                    <Text style={styles.tasksHeaderTitle}>
                        {filteredTasks.length > 0
                            ? `${filteredTasks.length} Task${filteredTasks.length > 1 ? 's' : ''}`
                            : 'No Tasks'}
                    </Text>
                </View>

                <View style={styles.tasksSummary}>
                    <View style={styles.tasksSummaryItem}>
                        <View style={[styles.tasksSummaryDot, { backgroundColor: COLORS.success }]} />
                        <Text style={styles.tasksSummaryText}>
                            {filteredTasks.filter(t => t.completed).length} Completed
                        </Text>
                    </View>
                    <View style={styles.tasksSummaryItem}>
                        <View style={[styles.tasksSummaryDot, { backgroundColor: COLORS.primary }]} />
                        <Text style={styles.tasksSummaryText}>
                            {filteredTasks.filter(t => !t.completed).length} Remaining
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header with gradient */}
            <LinearGradient
                colors={['rgba(0,0,0,0.8)', COLORS.background]}
                style={styles.header}
            >
                <Animated.View style={{ opacity: fadeAnim }}>
                    <Text style={styles.headerTitle}>Task Planner</Text>
                    <Text style={styles.headerSubtitle}>Organize your day</Text>
                </Animated.View>
            </LinearGradient>

            {/* Date slider */}
            {renderDateSlider()}

            {/* Main content */}
            <View style={styles.contentContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Loading tasks...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredTasks}
                        renderItem={renderSwipeableTaskItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.taskList}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={renderTasksHeader}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No tasks for {currentDate.toLocaleDateString()}</Text>
                                <Text style={styles.emptySubtext}>Swipe left/right on tasks to delete them</Text>
                            </View>
                        }
                    />
                )}
            </View>

            {/* Floating add button */}
            <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddTask}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={[COLORS.primary, '#FF6B00']}
                    style={styles.addButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Text style={styles.addButtonText}>+</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingTop: STATUSBAR_HEIGHT + 20,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    headerTitle: {
        color: COLORS.text,
        fontSize: SIZES.extraLarge,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    headerSubtitle: {
        color: COLORS.text + '90',
        fontSize: SIZES.medium,
        marginTop: 5,
    },
    dateSliderContainer: {
        paddingVertical: 10,
        backgroundColor: COLORS.card + '50',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border + '30',
    },
    blurContainer: {
        paddingVertical: 10,
        overflow: 'hidden',
        paddingHorizontal: 15,
    },
    monthText: {
        color: COLORS.text,
        fontSize: SIZES.large,
        fontWeight: '600',
        marginBottom: 10,
        marginLeft: 5,
    },
    dateScrollContent: {
        paddingVertical: 5,
        paddingHorizontal: 5,
    },
    dateButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 45,
        height: 65,
        borderRadius: 22,
        marginHorizontal: 5,
        backgroundColor: COLORS.card,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    selectedDateButton: {
        backgroundColor: COLORS.primary,
        transform: [{ scale: 1.05 }],
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 3,
        elevation: 5,
    },
    todayDateButton: {
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    dateText: {
        color: COLORS.text,
        fontSize: SIZES.medium,
        fontWeight: '600',
    },
    selectedDateText: {
        color: COLORS.background,
        fontWeight: 'bold',
    },
    todayDateText: {
        color: COLORS.primary,
    },
    dayText: {
        color: COLORS.text + '90',
        fontSize: SIZES.small,
        marginTop: 3,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 15,
    },
    tasksHeader: {
        marginTop: 20,
        marginBottom: 15,
    },
    headerDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    tasksHeaderTitle: {
        color: COLORS.text,
        fontSize: SIZES.large,
        fontWeight: 'bold',
    },
    tasksSummary: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    tasksSummaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    tasksSummaryDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    tasksSummaryText: {
        color: COLORS.text + '80',
        fontSize: SIZES.small,
    },
    taskList: {
        paddingBottom: 100,
    },
    taskItemContainer: {
        marginBottom: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    taskItem: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    taskContent: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.primary,
        marginRight: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    checkboxChecked: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    checkmark: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkmarkText: {
        color: COLORS.background,
        fontSize: 16,
        fontWeight: 'bold',
    },
    taskTextContainer: {
        flex: 1,
    },
    taskTitle: {
        color: COLORS.text,
        fontSize: SIZES.medium,
        fontWeight: '600',
        marginBottom: 4,
    },
    taskDescription: {
        color: COLORS.text + '80',
        fontSize: SIZES.small,
        marginBottom: 8,
    },
    taskCompleted: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    priorityBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
        marginTop: 4,
    },
    priorityText: {
        color: COLORS.text,
        fontSize: SIZES.small - 1,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: COLORS.text,
        fontSize: SIZES.medium,
    },
    emptyContainer: {
        marginTop: 40,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    emptyText: {
        color: COLORS.text,
        fontSize: SIZES.large,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 10,
    },
    emptySubtext: {
        color: COLORS.text + '80',
        fontSize: SIZES.medium,
        textAlign: 'center',
    },
    addButton: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 8,
        zIndex: 100,
    },
    addButtonGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonText: {
        color: COLORS.background,
        fontSize: 32,
        fontWeight: 'bold',
    },
});

export default HomeScreen;