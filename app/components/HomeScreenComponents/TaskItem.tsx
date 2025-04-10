import React, { useRef, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    PanResponder,
    Dimensions,
    Alert,
    Vibration
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Task, TaskPriority } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isTomorrow, isYesterday, differenceInDays } from 'date-fns';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = -100;

interface TaskItemProps {
    item: Task;
    index: number;
    totalTasks: number;
    allTasks: Task[];
    onDelete: (id: string) => void;
    onToggleComplete: (id: string) => void;
    onPress: (id: string) => void;
    isOverdue?: boolean;
    arePrereqsMet?: boolean;
    priority: TaskPriority;
}

const TaskItem: React.FC<TaskItemProps> = ({
                                               item,
                                               index,
                                               totalTasks,
                                               allTasks,
                                               onDelete,
                                               onToggleComplete,
                                               onPress,
                                               isOverdue = false,
                                               arePrereqsMet = true,
                                               priority,
                                           }) => {
    const { colors } = useTheme();
    const translateX = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(1)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const checkScale = useRef(new Animated.Value(item.completed ? 1 : 0)).current;
    const deleteButtonOpacity = useRef(new Animated.Value(0)).current;

    // Format due date with better readability
    const dueDateInfo = useMemo(() => {
        if (!item.dueDate) return { text: '', urgent: false };

        const date = new Date(item.dueDate);
        const now = new Date();
        const daysDiff = differenceInDays(date, now);

        if (isToday(date)) {
            return {
                text: `Today at ${format(date, 'h:mm a')}`,
                urgent: true,
                icon: 'today'
            };
        } else if (isTomorrow(date)) {
            return {
                text: `Tomorrow at ${format(date, 'h:mm a')}`,
                urgent: false,
                icon: 'calendar'
            };
        } else if (isYesterday(date)) {
            return {
                text: `Overdue by 1 day`,
                urgent: true,
                icon: 'alert-circle'
            };
        } else if (daysDiff < 0) {
            return {
                text: `Overdue by ${Math.abs(daysDiff)} days`,
                urgent: true,
                icon: 'alert-circle'
            };
        } else if (daysDiff <= 3) {
            return {
                text: `In ${daysDiff} days`,
                urgent: false,
                icon: 'time'
            };
        }

        return {
            text: format(date, 'MMM d, yyyy'),
            urgent: false,
            icon: 'calendar'
        };
    }, [item.dueDate]);

    // Check if task can be completed (all prerequisites met)
    const prereqStatus = useMemo(() => {
        if (!item.predecessorIds || item.predecessorIds.length === 0) {
            return { canComplete: true, completedCount: 0, total: 0 };
        }

        const completedCount = item.predecessorIds.reduce((count, predId) => {
            const predTask = allTasks.find(t => t.id === predId);
            return predTask?.completed ? count + 1 : count;
        }, 0);

        return {
            canComplete: completedCount === item.predecessorIds.length,
            completedCount,
            total: item.predecessorIds.length
        };
    }, [item.predecessorIds, allTasks]);

    // Update check animation when completion status changes
    useEffect(() => {
        Animated.spring(checkScale, {
            toValue: item.completed ? 1 : 0,
            friction: 6,
            tension: 80,
            useNativeDriver: true
        }).start();
    }, [item.completed]);

    // Pan responder for swipe to delete
    const panResponder = useMemo(() =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onPanResponderGrant: () => {
                    Animated.spring(scale, {
                        toValue: 0.98,
                        friction: 8,
                        useNativeDriver: true
                    }).start();
                },
                onPanResponderMove: (_, gestureState) => {
                    // Only allow left swipe
                    if (gestureState.dx < 0) {
                        translateX.setValue(gestureState.dx);
                        const opacity = Math.min(Math.abs(gestureState.dx) / Math.abs(SWIPE_THRESHOLD), 1);
                        deleteButtonOpacity.setValue(opacity);
                    }
                },
                onPanResponderRelease: (_, gestureState) => {
                    // Reset scale
                    Animated.spring(scale, {
                        toValue: 1,
                        friction: 8,
                        useNativeDriver: true
                    }).start();

                    if (gestureState.dx < SWIPE_THRESHOLD) {
                        // Delete confirmed
                        Vibration.vibrate(50);

                        // Animate off screen then delete
                        Animated.timing(translateX, {
                            toValue: -width,
                            duration: 250,
                            useNativeDriver: true
                        }).start();

                        Animated.timing(opacity, {
                            toValue: 0,
                            duration: 300,
                            useNativeDriver: true
                        }).start(() => onDelete(item.id));
                    } else {
                        // Return to original position
                        Animated.spring(translateX, {
                            toValue: 0,
                            friction: 8,
                            useNativeDriver: true
                        }).start();

                        Animated.timing(deleteButtonOpacity, {
                            toValue: 0,
                            duration: 200,
                            useNativeDriver: true
                        }).start();
                    }
                }
            }),
        [item.id, onDelete]);

    // Handle task completion toggle with prerequisites check
    const handleToggleComplete = () => {
        if (!item.completed && !prereqStatus.canComplete) {
            Vibration.vibrate([0, 50, 50, 50]);

            // Get incomplete prerequisite tasks
            const incompletePrereqs = item.predecessorIds
                ?.map(predId => allTasks.find(t => t.id === predId))
                .filter(task => task && !task.completed);

            const prereqNames = incompletePrereqs
                ?.map(task => `• ${task?.title}`)
                .join('\n');

            Alert.alert(
                'Prerequisites Required',
                `Complete these tasks first:\n\n${prereqNames}`,
                [
                    { text: 'View First Task', onPress: () => incompletePrereqs?.[0] && onPress(incompletePrereqs[0].id) },
                    { text: 'OK' }
                ]
            );
            return;
        }

        // Success vibration
        Vibration.vibrate(40);
        onToggleComplete(item.id);
    };

    // Get color based on priority
    const getPriorityColor = (priority: TaskPriority) => {
        switch (priority) {
            case 'high': return colors.error;
            case 'normal': return colors.warning;
            case 'low': return colors.success;
            default: return colors.textSecondary;
        }
    };

    const priorityColor = getPriorityColor(priority);

    return (
        <View style={styles.container}>
            {/* Delete button (revealed on swipe) */}
            <Animated.View
                style={[
                    styles.deleteButton,
                    {
                        backgroundColor: colors.error,
                        opacity: deleteButtonOpacity
                    }
                ]}
            >
                <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
            </Animated.View>

            {/* Prerequisites indicator */}
            {item.predecessorIds?.length > 0 && !item.completed && (
                <View style={[
                    styles.prerequisiteIndicator,
                    {
                        backgroundColor: prereqStatus.canComplete ?
                            colors.success + '20' :
                            colors.warning + '20'
                    }
                ]}>
                    <Ionicons
                        name={prereqStatus.canComplete ? "checkmark-circle" : "time-outline"}
                        size={14}
                        color={prereqStatus.canComplete ? colors.success : colors.warning}
                    />
                    <Text style={[
                        styles.prerequisiteText,
                        { color: prereqStatus.canComplete ? colors.success : colors.warning }
                    ]}>
                        {prereqStatus.completedCount}/{prereqStatus.total}
                    </Text>
                </View>
            )}

            {/* Main task card */}
            <Animated.View
                style={[
                    styles.taskCard,
                    {
                        backgroundColor: colors.card,
                        // Visual indicator for status
                        borderLeftWidth: 4,
                        borderLeftColor: priorityColor,
                        transform: [{ translateX }, { scale }],
                        opacity,
                        // Optional: add subtle background tint for overdue
                        backgroundColor: isOverdue ? colors.error + '08' : colors.card,
                    }
                ]}
                {...panResponder.panHandlers}
            >
                {/* Checkbox */}
                <TouchableOpacity
                    style={[
                        styles.checkbox,
                        {
                            borderColor: item.completed ? colors.primary :
                                !arePrereqsMet ? colors.warning :
                                    colors.border,
                            backgroundColor: item.completed ? colors.primary : 'transparent'
                        }
                    ]}
                    onPress={handleToggleComplete}
                    disabled={!prereqStatus.canComplete && !item.completed}
                    accessibilityLabel={item.completed ? "Mark as incomplete" : "Mark as complete"}
                >
                    <Animated.View style={{
                        transform: [{ scale: checkScale }],
                        opacity: checkScale
                    }}>
                        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    </Animated.View>
                </TouchableOpacity>

                {/* Task content */}
                <TouchableOpacity
                    style={styles.taskContent}
                    onPress={() => onPress(item.id)}
                    activeOpacity={0.7}
                    accessibilityLabel={`Task: ${item.title}`}
                >
                    {/* Task title with category */}
                    <View style={styles.titleRow}>
                        <Text
                            style={[
                                styles.taskTitle,
                                {
                                    color: isOverdue ? colors.error : colors.text,
                                    textDecorationLine: item.completed ? 'line-through' : 'none',
                                    opacity: item.completed ? 0.7 : 1,
                                    fontWeight: isOverdue ? '600' : 'normal',
                                }
                            ]}
                            numberOfLines={2}
                        >
                            {item.title}
                        </Text>

                        {item.category && (
                            <View style={styles.categoryContainer}>
                                <Text style={[styles.categoryText, { color: colors.primary }]}>
                                    {item.category}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Task metadata */}
                    <View style={styles.metadataRow}>
                        {/* Due date */}
                        {item.dueDate && (
                            <View style={styles.metadataItem}>
                                <Ionicons
                                    name={dueDateInfo.icon as any}
                                    size={14}
                                    color={dueDateInfo.urgent ? colors.error : colors.textSecondary}
                                    style={styles.metadataIcon}
                                />
                                <Text
                                    style={[
                                        styles.metadataText,
                                        {
                                            color: dueDateInfo.urgent ? colors.error : colors.textSecondary,
                                            fontWeight: dueDateInfo.urgent ? '600' : 'normal',
                                        }
                                    ]}
                                >
                                    {dueDateInfo.text}
                                </Text>
                            </View>
                        )}

                        {/* Prerequisite status */}
                        {!arePrereqsMet && !item.completed && (
                            <View style={styles.metadataItem}>
                                <Ionicons
                                    name="lock-closed"
                                    size={14}
                                    color={colors.warning}
                                    style={styles.metadataIcon}
                                />
                                <Text style={[styles.metadataText, { color: colors.warning }]}>
                                    Blocked by prerequisites
                                </Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 8,
        marginHorizontal: 16,
        position: 'relative',
    },
    deleteButton: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 80,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    taskCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    taskContent: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'column',
        marginBottom: 8,
    },
    taskTitle: {
        fontSize: 16,
        marginBottom: 4,
        lineHeight: 22,
    },
    categoryContainer: {
        alignSelf: 'flex-start',
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
        opacity: 0.8,
    },
    metadataRow: {
        flexDirection: 'column',
        gap: 4,
    },
    metadataItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metadataIcon: {
        marginRight: 4,
    },
    metadataText: {
        fontSize: 12,
    },
    prerequisiteIndicator: {
        position: 'absolute',
        top: -5,
        left: 25,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        zIndex: 1,
    },
    prerequisiteText: {
        fontSize: 10,
        fontWeight: '600',
        marginLeft: 2,
    },
});

export default TaskItem;