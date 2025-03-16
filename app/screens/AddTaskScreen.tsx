import React, { useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ScrollView
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { COLORS, SIZES } from '../theme';
import { Task, TaskPriority, RootStackParamList } from '../types';
import { storageService } from '../storage';

// Component imports
import ScreenHeader from '../components/common/ScreenHeader';
import ActionFooter from '../components/AddTaskComponents/ActionFooter';
import TaskTitleInput from '../components/AddTaskComponents/TaskTitleInput';
import TaskDescription from '../components/AddTaskComponents/TaskDescription';
import PrioritySelector from '../components/AddTaskComponents/PrioritySelector';
import DateTimePicker from '../components/AddTaskComponents/DateTimePicker';
import CategorySelector from '../components/AddTaskComponents/CategorySelector';

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

    // Check form validity whenever title changes
    React.useEffect(() => {
        setIsFormValid(title.trim().length > 0);
    }, [title]);

// In your handleSave function, update it like this:

    const handleSave = useCallback(async () => {
        if (!isFormValid) {
            Alert.alert('Error', 'Please enter a task title');
            return;
        }

        try {
            // Add a loading state
            // setLoading(true); // Uncomment if you add a loading state

            console.log('Creating new task with:', {
                title: title.trim(),
                description: description.trim(),
                priority,
                dueDate: new Date(dueDate).toISOString(),
                category
            });

            // Load existing tasks
            const existingTasks = await storageService.loadTasks();
            console.log(`Loaded ${existingTasks.length} existing tasks`);

            // Create new task
            const newTask: Task = {
                id: Date.now().toString(),
                title: title.trim(),
                description: description.trim(),
                priority,
                completed: false,
                createdAt: selectedDate.getTime(),
                dueDate: dueDate.getTime(),
                category
            };

            console.log('New task created:', newTask);

            // Save tasks (add new task to existing ones)
            const updatedTasks = [...existingTasks, newTask];
            await storageService.saveTasks(updatedTasks);
            console.log('Task saved successfully!');

            // Navigate back to home screen with success message
            navigation.navigate('Home', {
                showSuccessMessage: true,
                message: 'Task added successfully',
                timestamp: Date.now() // Add this to force a refresh on the home screen
            });
        } catch (error) {
            console.error('Error saving task:', error);
            Alert.alert(
                'Error Saving Task',
                'Failed to save task. Please try again. Error: ' + (error instanceof Error ? error.message : 'Unknown error')
            );
        } finally {
            // setLoading(false); // Uncomment if you add a loading state
        }
    }, [title, description, priority, dueDate, category, isFormValid, navigation, selectedDate]);
    const handleCancel = useCallback(() => {
        if (title.trim() || description.trim()) {
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
    }, [title, description, navigation]);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
            <StatusBar style="light" />
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: SIZES.medium,
        paddingBottom: SIZES.extraLarge * 2,
    }
});

export default AddTaskScreen;