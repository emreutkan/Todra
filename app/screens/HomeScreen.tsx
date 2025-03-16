import React, { useState, useEffect, useRef } from 'react';
import {View, StyleSheet, Animated, Dimensions, Alert} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../theme';
import { Task } from '../types';
import { RootStackParamList } from '../types';
import { storageService } from '../storage';

// Import components
import Header from '../components/HomeScreenComponents/Header';
import DateSlider from '../components/HomeScreenComponents/DateSlider';
import TaskList from '../components/HomeScreenComponents/TaskList';
import AddButton from '../components/HomeScreenComponents/AddButton';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const { width } = Dimensions.get('window');

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

    // Setup date range for slider
    useEffect(() => {
        // Get the current date
        const now = new Date();

        // Get first and last day of the current month
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Create array of dates for the full month
        const dates: Date[] = [];
        let currentMonth = now.getMonth();
        let currentYear = now.getFullYear();

        // Add dates from the current month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            dates.push(new Date(currentYear, currentMonth, i));
        }

        // Add first 10 days of next month
        for (let i = 1; i <= 10; i++) {
            dates.push(new Date(currentYear, currentMonth + 1, i));
        }

        setDateRange(dates);

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

    const handleToggleTaskCompletion = async (taskId: string) => {
        const updatedTasks = tasks.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        setTasks(updatedTasks);
        await storageService.saveTasks(updatedTasks);
    };

    const handleDeleteTask = async (taskId: string) => {
        try {
            const updatedTasks = tasks.filter(task => task.id !== taskId);
            setTasks(updatedTasks);
            await storageService.saveTasks(updatedTasks);
        } catch (error) {
            console.error('Error deleting task:', error);
            Alert.alert('Error', 'Failed to delete task');
        }
    };

    const handleDateChange = (date: Date) => {
        setCurrentDate(date);
        setSelectedMonth(date.toLocaleString('default', { month: 'long' }));
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <Header fadeAnim={fadeAnim} />

            {/* Date slider */}
            <DateSlider
                fadeAnim={fadeAnim}
                dateRange={dateRange}
                currentDate={currentDate}
                today={today}
                selectedMonth={selectedMonth}
                onDateChange={handleDateChange}
            />

            {/* Main content */}
            <View style={styles.contentContainer}>
                <TaskList
                    tasks={filteredTasks}
                    taskOpacity={taskOpacity}
                    loading={loading}
                    currentDate={currentDate}
                    onDeleteTask={handleDeleteTask}
                    onToggleTaskCompletion={handleToggleTaskCompletion}
                    onTaskPress={handleTaskPress}
                />
            </View>

            {/* Floating add button */}
            <AddButton onPress={handleAddTask} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 15,
    },
});

export default HomeScreen;