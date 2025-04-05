import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { COLORS, PRIORITY_COLORS, SIZES } from '../theme';
import { Task, RootStackParamList } from '../types';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { storageService } from '../storage';
import { StatusBar } from 'expo-status-bar';
import {deleteTask, getActiveTasks, getArchivedTasks, updateTask} from "../utils/taskStorage";

type TaskDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TaskDetails'>;
type TaskDetailsScreenRouteProp = RouteProp<RootStackParamList, 'TaskDetails'>;

const TaskDetailsScreen = () => {
    const navigation = useNavigation<TaskDetailsScreenNavigationProp>();
    const route = useRoute<TaskDetailsScreenRouteProp>();
    const { taskId } = route.params;

    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTask();
    }, [taskId]);

    const loadTask = async () => {
        try {
            // First check active tasks
            const activeTasks = await getActiveTasks();
            let foundTask = activeTasks.find(t => t.id === taskId);

            // If not found, check archived tasks
            if (!foundTask) {
                const archivedTasks = await getArchivedTasks();
                foundTask = archivedTasks.find(t => t.id === taskId);
            }

            if (foundTask) {
                setTask(foundTask);
            } else {
                Alert.alert('Error', 'Task not found');
                navigation.goBack();
            }

            setLoading(false);
        } catch (error) {
            console.error('Error loading task:', error);
            setLoading(false);
            Alert.alert('Error', 'Failed to load task details');
            navigation.goBack();
        }
    };

    const handleToggleComplete = async () => {
        if (!task) return;

        try {
            const updatedTask = { ...task, completed: !task.completed };
            await updateTask(updatedTask);
            setTask(updatedTask);
        } catch (error) {
            console.error('Error updating task:', error);
            Alert.alert('Error', 'Failed to update task');
        }
    };


    const handleEdit = () => {
        navigation.navigate('EditTask', { taskId });
    };


// Update handleDelete:
    const handleDelete = async () => {
        Alert.alert(
            'Delete Task',
            'Are you sure you want to delete this task?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteTask(taskId);
                            navigation.navigate('Home');
                        } catch (error) {
                            console.error('Error deleting task:', error);
                            Alert.alert('Error', 'Failed to delete task');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <StatusBar style="light" />
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading task details...</Text>
                </View>
            </View>
        );
    }

    if (!task) {
        return (
            <View style={styles.container}>
                <StatusBar style="light" />
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Task not found</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Task Details</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={styles.taskHeader}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <View
                        style={[
                            styles.priorityBadge,
                            { backgroundColor: PRIORITY_COLORS[task.priority] }
                        ]}
                    >
                        <Text style={styles.priorityText}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </Text>
                    </View>
                </View>

                {task.description ? (
                    <View style={styles.descriptionContainer}>
                        <Text style={styles.sectionTitle}>Description</Text>
                        <Text style={styles.descriptionText}>{task.description}</Text>
                    </View>
                ) : null}

                <View style={styles.infoContainer}>
                    <Text style={styles.sectionTitle}>Created</Text>
                    <Text style={styles.infoText}>
                        {new Date(task.createdAt).toLocaleString()}
                    </Text>
                </View>

                <View style={styles.statusContainer}>
                    <Text style={styles.sectionTitle}>Status</Text>
                    <Text style={styles.statusText}>
                        {task.completed ? 'Completed' : 'In Progress'}
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.button, styles.deleteButton]}
                    onPress={handleDelete}
                >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.toggleButton]}
                    onPress={handleToggleComplete}
                >
                    <Text style={styles.toggleButtonText}>
                        {task.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.editButton]}
                    onPress={handleEdit}
                >
                    <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default TaskDetailsScreen;

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
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: SIZES.medium,
    },
    backButtonText: {
        color: COLORS.primary,
        fontSize: SIZES.medium,
        fontWeight: '600',
    },
    headerTitle: {
        color: COLORS.text,
        fontSize: SIZES.large,
        fontWeight: 'bold',
        flex: 1,
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
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: SIZES.medium,
    },
    taskHeader: {
        marginBottom: SIZES.large,
    },
    taskTitle: {
        color: COLORS.text,
        fontSize: SIZES.extraLarge,
        fontWeight: 'bold',
        marginBottom: SIZES.small,
    },
    priorityBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: SIZES.medium,
        paddingVertical: SIZES.small / 2,
        borderRadius: SIZES.base,
    },
    priorityText: {
        color: COLORS.background,
        fontSize: SIZES.font,
        fontWeight: '600',
    },
    descriptionContainer: {
        marginBottom: SIZES.large,
        backgroundColor: COLORS.card,
        borderRadius: SIZES.base,
        padding: SIZES.medium,
    },
    sectionTitle: {
        color: COLORS.text,
        fontSize: SIZES.medium,
        fontWeight: '600',
        marginBottom: SIZES.small / 2,
        opacity: 0.8,
    },
    descriptionText: {
        color: COLORS.text,
        fontSize: SIZES.font,
        lineHeight: SIZES.medium * 1.3,
    },
    infoContainer: {
        marginBottom: SIZES.large,
        backgroundColor: COLORS.card,
        borderRadius: SIZES.base,
        padding: SIZES.medium,
    },
    infoText: {
        color: COLORS.text,
        fontSize: SIZES.font,
    },
    statusContainer: {
        marginBottom: SIZES.large,
        backgroundColor: COLORS.card,
        borderRadius: SIZES.base,
        padding: SIZES.medium,
    },
    statusText: {
        color: COLORS.text,
        fontSize: SIZES.font,
        fontWeight: '500',
    },
    footer: {
        flexDirection: 'row',
        padding: SIZES.medium,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        justifyContent: 'space-between',
    },
    button: {
        paddingVertical: SIZES.small,
        paddingHorizontal: SIZES.medium,
        borderRadius: SIZES.base,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButton: {
        backgroundColor: '#F44336',
        flex: 1,
        marginRight: SIZES.small,
    },
    deleteButtonText: {
        color: COLORS.text,
        fontWeight: '600',
    },
    toggleButton: {
        backgroundColor: COLORS.primary,
        flex: 2,
        marginHorizontal: SIZES.small / 2,
    },
    toggleButtonText: {
        color: COLORS.background,
        fontWeight: '600',
    },
    editButton: {
        backgroundColor: COLORS.info,
        flex: 1,
        marginLeft: SIZES.small,
    },
    editButtonText: {
        color: COLORS.background,
        fontWeight: '600',
    },
});