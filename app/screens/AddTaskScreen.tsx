import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { SIZES } from '../theme';
import { Task, TaskPriority, RootStackParamList } from '../types';
import { storageService } from '../storage';
import {useTheme} from "../context/ThemeContext";

// Component imports
import ScreenHeader from '../components/common/ScreenHeader';
import ActionFooter from '../components/AddTaskComponents/ActionFooter';
import TaskTitleInput from '../components/AddTaskComponents/TaskTitleInput';
import TaskDescription from '../components/AddTaskComponents/TaskDescription';
import PrioritySelector from '../components/AddTaskComponents/PrioritySelector';
import DateTimePicker from '../components/AddTaskComponents/DateTimePicker';
import CategorySelector from '../components/AddTaskComponents/CategorySelector';
import PredecessorTaskSelector from '../components/AddTaskComponents/PredecessorTaskSelector';
import {addTask, getActiveTasks} from "../utils/taskStorage";

type AddTaskScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddTask'>;
type AddTaskScreenRouteProp = RouteProp<RootStackParamList, 'AddTask'>;

const AddTaskScreen: React.FC = () => {
    const navigation = useNavigation<AddTaskScreenNavigationProp>();
    const route = useRoute<AddTaskScreenRouteProp>();

    // Get the selected date from navigation params or default to today
    const selectedDate = route.params?.selectedDate || new Date();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<TaskPriority>('normal');
    const [dueDate, setDueDate] = useState<Date>(selectedDate);
    const [category, setCategory] = useState<string>('personal');
    const [isFormValid, setIsFormValid] = useState(false);
    const [loading, setLoading] = useState(false);

    // New state for predecessor functionality
    const [predecessorIds, setPredecessorIds] = useState<string[]>([]);
    const [availableTasks, setAvailableTasks] = useState<Task[]>([]);

    const { colors } = useTheme();
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
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.background,
        }
    });
    // Load available tasks for predecessor selection
    useEffect(() => {
        const loadAvailableTasks = async () => {
            try {
                const tasks = await getActiveTasks();
                setAvailableTasks(tasks);
            } catch (error) {
                console.error('Error loading tasks:', error);
                Alert.alert('Error', 'Failed to load available tasks');
            }
        };
        loadAvailableTasks();
    }, []);

    // Check form validity whenever title changes
    useEffect(() => {
        setIsFormValid(title.trim().length > 0);
    }, [title]);

    // Function to check for circular dependencies
    const checkForCircularDependencies = (
        taskIds: string[],
        currentId: string,
        visited: Set<string>,
        tasks: Task[]
    ): boolean => {
        if (visited.has(currentId)) return true;
        visited.add(currentId);

        const task = tasks.find(t => t.id === currentId);
        if (!task) return false;

        for (const predId of task.predecessorIds || []) {
            if (taskIds.includes(predId) || checkForCircularDependencies(taskIds, predId, visited, tasks)) {
                return true;
            }
        }
        return false;
    };


// Update handleSave:
    const handleSave = useCallback(async () => {
        if (!isFormValid) {
            Alert.alert('Error', 'Please enter a task title');
            return;
        }

        try {
            setLoading(true);

            // Load existing tasks
            const existingTasks = await getActiveTasks();

            // Check for circular dependencies
            for (const predId of predecessorIds) {
                if (checkForCircularDependencies(predecessorIds, predId, new Set(), existingTasks)) {
                    Alert.alert('Error', 'Cannot add these predecessors as they would create a circular dependency');
                    return;
                }
            }

            // Create new task
            const newTask: Task = {
                id: Date.now().toString(),
                title: title.trim(),
                description: description.trim(),
                priority,
                completed: false,
                createdAt: selectedDate.getTime(),
                dueDate: dueDate.getTime(),
                category,
                predecessorIds,
                archived: false // Make sure to include this property
            };

            // Save task
            await addTask(newTask);

            // Navigate back with success message
            navigation.navigate('Home', {
                showSuccessMessage: true,
                message: 'Task added successfully',
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('Error saving task:', error);
            Alert.alert(
                'Error Saving Task',
                'Failed to save task. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    }, [title, description, priority, dueDate, category, predecessorIds, isFormValid, navigation, selectedDate]);

    const handleCancel = useCallback(() => {
        if (title.trim() || description.trim() || predecessorIds.length > 0) {
            Alert.alert(
                'Discard Changes?',
                'You have unsaved changes. Are you sure you want to discard them?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() }
                ]
            );
        } else {
            navigation.goBack();
        }
    }, [title, description, predecessorIds, navigation]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            // keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
            <StatusBar style="dark" />
            <ScreenHeader
                title="Create New Task"
                showBackButton
                onBackPress={handleCancel}
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <TaskTitleInput
                    value={title}
                    onChangeText={setTitle}
                />

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
                    initialDate={selectedDate}
                />

                <PredecessorTaskSelector
                    availableTasks={availableTasks}
                    selectedPredecessors={predecessorIds}
                    onSelectPredecessor={(taskId) => {
                        setPredecessorIds(prev =>
                            prev.includes(taskId)
                                ? prev.filter(id => id !== taskId)
                                : [...prev, taskId]
                        );
                    }}
                />

                <TaskDescription
                    value={description}
                    onChangeText={setDescription}
                />
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