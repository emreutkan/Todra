import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    StatusBar,
    Animated,
    Platform
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/common/ScreenHeader';
import { SIZES } from '../theme';
import { Task, RootStackParamList } from '../types';
import { useTheme } from "../context/ThemeContext";
import {
    deleteTask,
    getActiveTasks,
    getArchivedTasks,
    updateTask
} from "../services/taskStorageService";

type TaskDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TaskDetails'>;
type TaskDetailsScreenRouteProp = RouteProp<RootStackParamList, 'TaskDetails'>;

const TaskDetailsScreen = () => {
    const navigation = useNavigation<TaskDetailsScreenNavigationProp>();
    const route = useRoute<TaskDetailsScreenRouteProp>();
    const { taskId } = route.params;
    const { colors, isDark } = useTheme();

    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [relatedTasks, setRelatedTasks] = useState<Task[]>([]);
    const [expandedDescription, setExpandedDescription] = useState(false);

    // Animation values
    const statusOpacity = new Animated.Value(0);
    const detailsOpacity = new Animated.Value(0);

    useEffect(() => {
        loadTask();
    }, [taskId]);

    // Animate elements when task loads
    useEffect(() => {
        if (task) {
            Animated.sequence([
                Animated.timing(statusOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true
                }),
                Animated.timing(detailsOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true
                })
            ]).start();
        }
    }, [task]);

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

                // Load related tasks (predecessors)
                if (foundTask.predecessorIds && foundTask.predecessorIds.length > 0) {
                    const allTasks = [...activeTasks, ...await getArchivedTasks()];
                    const related = allTasks.filter(t =>
                        foundTask?.predecessorIds?.includes(t.id)
                    );
                    setRelatedTasks(related);
                }
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

        // Check for prerequisites
        if (!task.completed && task.predecessorIds && task.predecessorIds.length > 0) {
            const incompletePrereqs = relatedTasks.filter(t =>
                !t.completed && task.predecessorIds?.includes(t.id)
            );

            if (incompletePrereqs.length > 0) {
                // Show error with specific prereq information
                const prereqNames = incompletePrereqs
                    .map(task => `• ${task.title}`)
                    .join('\n');

                Alert.alert(
                    'Prerequisites Required',
                    `You need to complete these tasks first:\n\n${prereqNames}`,
                    [{
                        text: 'View First Task',
                        onPress: () => incompletePrereqs[0] &&
                            navigation.navigate('TaskDetails', { taskId: incompletePrereqs[0].id })
                    },
                        { text: 'OK' }]
                );
                return;
            }
        }

        try {
            const updatedTask = { ...task, completed: !task.completed };
            await updateTask(updatedTask);
            setTask(updatedTask);

            // Provide visual feedback
            Animated.sequence([
                Animated.timing(statusOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true
                }),
                Animated.timing(statusOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true
                })
            ]).start();
        } catch (error) {
            console.error('Error updating task:', error);
            Alert.alert('Error', 'Failed to update task');
        }
    };

    const handleEdit = () => {
        navigation.navigate('EditTask', { taskId });
    };

    const handleDelete = async () => {
        Alert.alert(
            'Delete Task',
            'Are you sure you want to delete this task? This action cannot be undone.',
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

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case 'high': return colors.error;
            case 'normal': return colors.warning;
            case 'low': return colors.success;
            default: return colors.info;
        }
    };

    const isOverdue = (dueDate: number) => {
        return !task?.completed && dueDate < Date.now();
    };

    const renderPrerequisites = () => {
        if (!task?.predecessorIds || task.predecessorIds.length === 0) {
            return null;
        }

        return (
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Prerequisites</Text>
                <View style={styles.prerequisitesContainer}>
                    {relatedTasks.map(prereqTask => (
                        <TouchableOpacity
                            key={prereqTask.id}
                            style={[
                                styles.prerequisiteItem,
                                { borderColor: prereqTask.completed ? colors.success : colors.warning }
                            ]}
                            onPress={() => navigation.push('TaskDetails', { taskId: prereqTask.id })}
                            activeOpacity={0.7}
                        >
                            <View style={styles.prerequisiteContent}>
                                <View style={[
                                    styles.prerequisiteStatus,
                                    { backgroundColor: prereqTask.completed ? colors.success : colors.warning + '40' }
                                ]}>
                                    <Ionicons
                                        name={prereqTask.completed ? "checkmark" : "time-outline"}
                                        size={14}
                                        color={prereqTask.completed ? 'white' : colors.warning}
                                    />
                                </View>
                                <View style={styles.prerequisiteTextContainer}>
                                    <Text
                                        style={[
                                            styles.prerequisiteTitle,
                                            {
                                                color: colors.text,
                                                textDecorationLine: prereqTask.completed ? 'line-through' : 'none'
                                            }
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {prereqTask.title}
                                    </Text>
                                    <Text style={[styles.prerequisiteSubtitle, { color: colors.textSecondary }]}>
                                        {prereqTask.completed ? 'Completed' : 'Pending'}
                                    </Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
                <ScreenHeader
                    title="Task Details"
                    showBackButton={true}
                    onBackPress={() => navigation.goBack()}
                />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.text }]}>
                        Loading task details...
                    </Text>
                </View>
            </View>
        );
    }

    if (!task) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
                <ScreenHeader
                    title="Task Details"
                    showBackButton={true}
                    onBackPress={() => navigation.goBack()}
                />
                <View style={styles.loadingContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
                    <Text style={[styles.loadingText, { color: colors.text, marginTop: 16 }]}>
                        Task not found
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <ScreenHeader
                title="Task Details"
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
                rightComponent={
                    <TouchableOpacity
                        onPress={handleEdit}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.editButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="pencil" size={22} color={colors.primary} />
                    </TouchableOpacity>
                }
            />

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Status Banner */}
                <Animated.View
                    style={[
                        styles.statusBanner,
                        {
                            backgroundColor: task.completed ?
                                colors.success + '20' :
                                isOverdue(task.dueDate) ?
                                    colors.error + '20' :
                                    colors.warning + '20',
                            borderColor: task.completed ?
                                colors.success :
                                isOverdue(task.dueDate) ?
                                    colors.error :
                                    colors.warning,
                            opacity: statusOpacity
                        }
                    ]}
                >
                    <Ionicons
                        name={
                            task.completed ?
                                "checkmark-circle" :
                                isOverdue(task.dueDate) ?
                                    "alert-circle" :
                                    "time-outline"
                        }
                        size={18}
                        color={
                            task.completed ?
                                colors.success :
                                isOverdue(task.dueDate) ?
                                    colors.error :
                                    colors.warning
                        }
                    />
                    <Text
                        style={[
                            styles.statusText,
                            {
                                color: task.completed ?
                                    colors.success :
                                    isOverdue(task.dueDate) ?
                                        colors.error :
                                        colors.warning
                            }
                        ]}
                    >
                        {task.completed ?
                            'Completed' :
                            isOverdue(task.dueDate) ?
                                'Overdue' :
                                'In Progress'
                        }
                    </Text>
                </Animated.View>

                {/* Title and Priority */}
                <View style={styles.titleContainer}>
                    <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
                    <View style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityColor(task.priority) }
                    ]}>
                        <Text style={styles.priorityText}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </Text>
                    </View>
                </View>

                {/* Task Metadata */}
                <Animated.View
                    style={[
                        styles.metadataContainer,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            opacity: detailsOpacity
                        }
                    ]}
                >
                    <View style={styles.metadataRow}>
                        <View style={styles.metadataItem}>
                            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                            <View style={styles.metadataTextContainer}>
                                <Text style={[styles.metadataLabel, { color: colors.textSecondary }]}>
                                    Due Date
                                </Text>
                                <Text style={[
                                    styles.metadataValue,
                                    {
                                        color: isOverdue(task.dueDate) && !task.completed ?
                                            colors.error :
                                            colors.text
                                    }
                                ]}>
                                    {formatDate(task.dueDate)}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.metadataItem}>
                            <Ionicons name="time-outline" size={18} color={colors.primary} />
                            <View style={styles.metadataTextContainer}>
                                <Text style={[styles.metadataLabel, { color: colors.textSecondary }]}>
                                    Time
                                </Text>
                                <Text style={[
                                    styles.metadataValue,
                                    {
                                        color: isOverdue(task.dueDate) && !task.completed ?
                                            colors.error :
                                            colors.text
                                    }
                                ]}>
                                    {formatTime(task.dueDate)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.metadataDivider, { backgroundColor: colors.border }]} />

                    <View style={styles.metadataRow}>
                        <View style={styles.metadataItem}>
                            <Ionicons name="folder-outline" size={18} color={colors.primary} />
                            <View style={styles.metadataTextContainer}>
                                <Text style={[styles.metadataLabel, { color: colors.textSecondary }]}>
                                    Category
                                </Text>
                                <Text style={[styles.metadataValue, { color: colors.text }]}>
                                    {task.category || 'Uncategorized'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.metadataItem}>
                            <Ionicons name="create-outline" size={18} color={colors.primary} />
                            <View style={styles.metadataTextContainer}>
                                <Text style={[styles.metadataLabel, { color: colors.textSecondary }]}>
                                    Created
                                </Text>
                                <Text style={[styles.metadataValue, { color: colors.text }]}>
                                    {formatDate(task.createdAt)}
                                </Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* Description */}
                {task.description ? (
                    <Animated.View
                        style={[
                            styles.descriptionContainer,
                            {
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                                opacity: detailsOpacity
                            }
                        ]}
                    >
                        <View style={styles.descriptionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Description
                            </Text>
                            {task.description.length > 100 && (
                                <TouchableOpacity
                                    onPress={() => setExpandedDescription(!expandedDescription)}
                                    style={styles.expandButton}
                                >
                                    <Text style={[styles.expandButtonText, { color: colors.primary }]}>
                                        {expandedDescription ? 'Show Less' : 'Show More'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <Text
                            style={[styles.descriptionText, { color: colors.text }]}
                            numberOfLines={expandedDescription ? undefined : 4}
                        >
                            {task.description}
                        </Text>
                    </Animated.View>
                ) : null}

                {/* Prerequisites */}
                <Animated.View style={{ opacity: detailsOpacity }}>
                    {renderPrerequisites()}
                </Animated.View>
            </ScrollView>

            {/* Action Footer */}
            <View
                style={[
                    styles.footer,
                    {
                        backgroundColor: colors.card,
                        borderTopColor: colors.border
                    }
                ]}
            >
                <TouchableOpacity
                    style={[styles.deleteButton, { borderColor: colors.error }]}
                    onPress={handleDelete}
                    activeOpacity={0.7}
                    accessibilityLabel="Delete task"
                    accessibilityRole="button"
                >
                    <Ionicons name="trash-outline" size={22} color={colors.error} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.toggleButton,
                        {
                            backgroundColor: task.completed ?
                                colors.success :
                                colors.primary
                        }
                    ]}
                    onPress={handleToggleComplete}
                    activeOpacity={0.7}
                    accessibilityLabel={task.completed ? "Mark as incomplete" : "Mark as complete"}
                    accessibilityRole="button"
                >
                    <Text style={styles.toggleButtonText}>
                        {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
                    </Text>
                    <Ionicons
                        name={task.completed ? "close-circle" : "checkmark-circle"}
                        size={22}
                        color="white"
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: SIZES.medium,
        paddingBottom: 100,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: SIZES.medium,
        marginTop: SIZES.medium,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SIZES.small,
        paddingHorizontal: SIZES.medium,
        borderRadius: 12,
        marginBottom: SIZES.medium,
        borderWidth: 1,
    },
    statusText: {
        fontSize: SIZES.font,
        fontWeight: '600',
        marginLeft: SIZES.small / 2,
    },
    titleContainer: {
        marginBottom: SIZES.medium,
    },
    taskTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: SIZES.small,
    },
    priorityBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: SIZES.medium,
        paddingVertical: SIZES.small / 2,
        borderRadius: 16,
    },
    priorityText: {
        color: 'white',
        fontSize: SIZES.font,
        fontWeight: '600',
    },
    metadataContainer: {
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: SIZES.medium,
        overflow: 'hidden',
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    metadataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: SIZES.medium,
    },
    metadataItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    metadataTextContainer: {
        marginLeft: SIZES.small,
    },
    metadataLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    metadataValue: {
        fontSize: SIZES.font,
        fontWeight: '500',
    },
    metadataDivider: {
        height: 1,
        width: '100%',
    },
    descriptionContainer: {
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: SIZES.medium,
        padding: SIZES.medium,
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    descriptionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SIZES.small,
    },
    sectionTitle: {
        fontSize: SIZES.medium,
        fontWeight: '600',
    },
    expandButton: {
        padding: SIZES.small / 2,
    },
    expandButtonText: {
        fontSize: SIZES.font - 2,
        fontWeight: '500',
    },
    descriptionText: {
        fontSize: SIZES.font,
        lineHeight: SIZES.medium * 1.3,
    },
    sectionContainer: {
        marginBottom: SIZES.medium,
    },
    prerequisitesContainer: {
        marginTop: SIZES.small,
    },
    prerequisiteItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: SIZES.small,
        padding: SIZES.small,
    },
    prerequisiteContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    prerequisiteStatus: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SIZES.small,
    },
    prerequisiteTextContainer: {
        flex: 1,
    },
    prerequisiteTitle: {
        fontSize: SIZES.font,
        fontWeight: '500',
    },
    prerequisiteSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: SIZES.medium,
        borderTopWidth: 1,
        paddingBottom: Platform.OS === 'ios' ? 34 : SIZES.medium,
    },
    deleteButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        marginRight: SIZES.medium,
    },
    toggleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderRadius: 24,
        paddingHorizontal: SIZES.medium,
    },
    toggleButtonText: {
        color: 'white',
        fontWeight: '600',
        marginRight: SIZES.small,
    },
    editButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default TaskDetailsScreen;