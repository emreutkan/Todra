import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, PRIORITY_COLORS, SIZES } from '../theme';
import { Task, TaskPriority, RootStackParamList } from '../types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { storageService } from '../storage';
import { StatusBar } from 'expo-status-bar';

type AddTaskScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddTask'>;

const AddTaskScreen = () => {
    const navigation = useNavigation<AddTaskScreenNavigationProp>();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<TaskPriority>('normal');

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a task title');
            return;
        }

        try {
            // Load existing tasks
            const existingTasks = await storageService.loadTasks();

            // Create new task
            const newTask: Task = {
                id: Date.now().toString(),
                title: title.trim(),
                description: description.trim(),
                priority,
                completed: false,
                createdAt: Date.now(),
            };

            // Save tasks (add new task to existing ones)
            await storageService.saveTasks([...existingTasks, newTask]);

            // Navigate back to home screen
            navigation.navigate('Home');
        } catch (error) {
            console.error('Error saving task:', error);
            Alert.alert('Error', 'Failed to save task. Please try again.');
        }
    };

    const handleCancel = () => {
        navigation.goBack();
    };

    const priorityOptions: TaskPriority[] = ['normal', 'high', 'crucial', 'optional'];

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar style="light" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Add New Task</Text>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Title</Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Enter task title"
                        placeholderTextColor={COLORS.text + '80'}
                        autoCapitalize="sentences"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Enter task description (optional)"
                        placeholderTextColor={COLORS.text + '80'}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Priority</Text>
                    <View style={styles.priorityContainer}>
                        {priorityOptions.map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={[
                                    styles.priorityButton,
                                    { backgroundColor: priority === option ? PRIORITY_COLORS[option] : 'transparent' },
                                    { borderColor: PRIORITY_COLORS[option] }
                                ]}
                                onPress={() => setPriority(option)}
                            >
                                <Text
                                    style={[
                                        styles.priorityButtonText,
                                        priority === option && styles.activePriorityText
                                    ]}
                                >
                                    {option.charAt(0).toUpperCase() + option.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleCancel}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={handleSave}
                >
                    <Text style={styles.saveButtonText}>Save Task</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        padding: SIZES.medium,
        paddingTop: SIZES.extraLarge * 2,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        color: COLORS.text,
        fontSize: SIZES.extraLarge,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: SIZES.medium,
    },
    formGroup: {
        marginBottom: SIZES.large,
    },
    label: {
        color: COLORS.text,
        fontSize: SIZES.medium,
        fontWeight: '500',
        marginBottom: SIZES.small,
    },
    input: {
        backgroundColor: COLORS.card,
        borderRadius: SIZES.base,
        padding: SIZES.medium,
        color: COLORS.text,
        fontSize: SIZES.font,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    textArea: {
        minHeight: 100,
    },
    priorityContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -5,
    },
    priorityButton: {
        borderRadius: SIZES.base,
        paddingVertical: SIZES.small,
        paddingHorizontal: SIZES.medium,
        marginRight: SIZES.small,
        marginBottom: SIZES.small,
        borderWidth: 1,
    },
    priorityButtonText: {
        color: COLORS.text,
        fontSize: SIZES.font,
        fontWeight: '500',
    },
    activePriorityText: {
        color: COLORS.background,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        padding: SIZES.medium,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    button: {
        flex: 1,
        borderRadius: SIZES.base,
        padding: SIZES.medium,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: SIZES.small / 2,
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
    },
    cancelButtonText: {
        color: COLORS.primary,
        fontSize: SIZES.font,
        fontWeight: '600',
    },
    saveButtonText: {
        color: COLORS.background,
        fontSize: SIZES.font,
        fontWeight: '600',
    },
});

export default AddTaskScreen;