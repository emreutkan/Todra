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
import { Task } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';

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
}

const TaskItem: React.FC<TaskItemProps> = ({
                                               item,
                                               index,
                                               totalTasks,
                                               allTasks,
                                               onDelete,
                                               onToggleComplete,
                                               onPress,
                                           }) => {
    const { colors } = useTheme();
    const translateX = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(1)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const checkScale = useRef(new Animated.Value(item.completed ? 1 : 0)).current;
    const deleteButtonOpacity = useRef(new Animated.Value(0)).current;

    // Format due date
    const formattedDueDate = useMemo(() => {
        if (!item.dueDate) return '';
        const date = new Date(item.dueDate);

        if (isToday(date)) {
            return `Today, ${format(date, 'h:mm a')}`;
        } else if (isTomorrow(date)) {
            return `Tomorrow, ${format(date, 'h:mm a')}`;
        } else if (isYesterday(date)) {
            return `Yesterday, ${format(date, 'h:mm a')}`;
        }
        return format(date, 'MMM d, h:mm a');
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

    // Priority color mapping
    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case 'high': return colors.error;
            case 'normal': return colors.warning;
            case 'low': return colors.info;
            default: return colors.textSecondary;
        }
    };

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
                        borderLeftColor: getPriorityColor(item.priority),
                        transform: [{ translateX }, { scale }],
                        opacity
                    }
                ]}
                {...panResponder.panHandlers}
            >
                {/* Checkbox */}
                <TouchableOpacity
                    style={[
                        styles.checkbox,
                        {
                            borderColor: item.completed ? colors.primary : colors.border,
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
                    <View style={styles.taskHeader}>
                        <Text
                            style={[
                                styles.taskTitle,
                                {
                                    color: colors.text,
                                    textDecorationLine: item.completed ? 'line-through' : 'none',
                                    opacity: item.completed ? 0.7 : 1
                                }
                            ]}
                            numberOfLines={1}
                        >
                            {item.title}
                        </Text>

                        {item.category && (
                            <View style={[
                                styles.categoryBadge,
                                { backgroundColor: colors.primary + '20' }
                            ]}>
                                <Text style={[
                                    styles.categoryText,
                                    { color: colors.primary }
                                ]}>
                                    {item.category}
                                </Text>
                            </View>
                        )}
                    </View>

                    {item.description && (
                        <Text
                            style={[
                                styles.taskDescription,
                                {
                                    color: colors.textSecondary,
                                    opacity: item.completed ? 0.6 : 0.9
                                }
                            ]}
                            numberOfLines={2}
                        >
                            {item.description}
                        </Text>
                    )}

                    <View style={styles.taskFooter}>
                        {item.dueDate && (
                            <View style={styles.dueDate}>
                                <Ionicons
                                    name="calendar-outline"
                                    size={14}
                                    color={colors.textSecondary}
                                    style={styles.footerIcon}
                                />
                                <Text style={[
                                    styles.dueText,
                                    { color: colors.textSecondary }
                                ]}>
                                    {formattedDueDate}
                                </Text>
                            </View>
                        )}

                        <View style={[
                            styles.priorityBadge,
                            { backgroundColor: getPriorityColor(item.priority) + '20' }
                        ]}>
                            <Text style={[
                                styles.priorityText,
                                { color: getPriorityColor(item.priority) }
                            ]}>
                                {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginVertical: 6,
        position: 'relative',
    },
    taskCard: {
        flexDirection: 'row',
        borderRadius: 12,
        borderLeftWidth: 5,
        overflow: 'hidden',
        paddingVertical: 14,
        paddingHorizontal: 16,
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
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        marginTop: 2,
    },
    taskContent: {
        flex: 1,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        marginRight: 8,
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
    },
    taskDescription: {
        fontSize: 14,
        marginBottom: 8,
        lineHeight: 18,
    },
    taskFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dueDate: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerIcon: {
        marginRight: 4,
    },
    dueText: {
        fontSize: 12,
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    priorityText: {
        fontSize: 12,
        fontWeight: '500',
    },
    deleteButton: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 80,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: -1,
    },
    prerequisiteIndicator: {
        position: 'absolute',
        left: -8,
        top: '50%',
        marginTop: -16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 10,
        zIndex: 1,
    },
    prerequisiteText: {
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 2,
    }
});

export default TaskItem;