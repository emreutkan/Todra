import React, { useMemo, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    PanResponder,
    Dimensions,
    Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, PRIORITY_COLORS, SIZES } from '../../theme';
import { Task, TaskPriority } from '../../types';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = -100;

// In TaskItem.tsx
interface TaskItemProps {
    item: Task;
    index: number;
    taskOpacity: Animated.Value;
    totalTasks: number;
    allTasks: Task[]; // Add this line
    onDelete: (id: string) => void;
    onToggleComplete: (id: string) => void;
    onPress: (id: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
                                               item,
                                               index,
                                               taskOpacity,
                                               totalTasks,
                                               allTasks,
                                               onDelete,
                                               onToggleComplete,
                                               onPress,
                                           }) => {
    const translateX = useRef(new Animated.Value(0)).current;

    // Check if all predecessor tasks are completed
    const canComplete = useMemo(() => {
        if (!item.predecessorIds || item.predecessorIds.length === 0) return true;

        return item.predecessorIds.every(predId => {
            const predTask = allTasks.find(t => t.id === predId);
            return predTask?.completed;
        });
    }, [item.predecessorIds, allTasks]);

    // Get predecessor tasks information
    const predecessorInfo = useMemo(() => {
        if (!item.predecessorIds || item.predecessorIds.length === 0) {
            return null;
        }

        const completedCount = item.predecessorIds.reduce((count, predId) => {
            const predTask = allTasks.find(t => t.id === predId);
            return predTask?.completed ? count + 1 : count;
        }, 0);

        return {
            total: item.predecessorIds.length,
            completed: completedCount,
        };
    }, [item.predecessorIds, allTasks]);

    const panResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onPanResponderMove: (_, gestureState) => {
                    translateX.setValue(gestureState.dx);
                },
                onPanResponderRelease: (_, gestureState) => {
                    if (gestureState.dx < SWIPE_THRESHOLD) {
                        Animated.timing(translateX, {
                            toValue: -width,
                            duration: 250,
                            useNativeDriver: true,
                        }).start(() => onDelete(item.id));
                    } else {
                        Animated.spring(translateX, {
                            toValue: 0,
                            useNativeDriver: true,
                        }).start();
                    }
                },
            }),
        [translateX, onDelete, item.id]
    );

    const handleToggleComplete = () => {
        if (!item.completed && !canComplete) {
            Alert.alert(
                'Cannot Complete Task',
                'You must complete all predecessor tasks first.',
                [{ text: 'OK' }]
            );
            return;
        }
        onToggleComplete(item.id);
    };

    const taskAnimStyle = {
        transform: [{ translateX }],
        opacity: taskOpacity,
    };

    const getPriorityLabel = (priority: TaskPriority) =>
        priority.charAt(0).toUpperCase() + priority.slice(1);

    return (
        <Animated.View
            style={[styles.taskItemContainer, taskAnimStyle, { zIndex: totalTasks - index }]}
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
                    onPress={() => onPress(item.id)}
                    activeOpacity={0.7}
                    accessibilityLabel="Task item"
                    accessibilityHint="Tap to view task details"
                >
                    <TouchableOpacity
                        style={[
                            styles.checkbox,
                            item.completed && styles.checkboxChecked,
                            !canComplete && !item.completed && styles.checkboxDisabled
                        ]}
                        onPress={handleToggleComplete}
                        accessibilityLabel="Toggle task completion"
                        accessibilityHint="Marks this task as complete or incomplete"
                    >
                        {item.completed && (
                            <View style={styles.checkmark}>
                                <Text style={styles.checkmarkText}>✓</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <View style={styles.taskTextContainer}>
                        <Text
                            style={[styles.taskTitle, item.completed && styles.taskCompleted]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {item.title}
                        </Text>
                        {item.description ? (
                            <Text
                                style={[styles.taskDescription, item.completed && styles.taskCompleted]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {item.description}
                            </Text>
                        ) : null}

                        <View style={styles.taskMetaContainer}>
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

                            {predecessorInfo && (
                                <View style={styles.predecessorBadge}>
                                    <Text style={styles.predecessorText}>
                                        {`${predecessorInfo.completed}/${predecessorInfo.total} prereqs`}
                                    </Text>
                                    {!canComplete && !item.completed && (
                                        <Text style={styles.lockIcon}>🔒</Text>
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            </LinearGradient>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
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
    checkboxDisabled: {
        borderColor: COLORS.text + '40',
        backgroundColor: COLORS.text + '10',
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
    taskMetaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    priorityBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
    },
    priorityText: {
        color: COLORS.text,
        fontSize: SIZES.small - 1,
        fontWeight: '600',
    },
    predecessorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.text + '10',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        gap: 4,
    },
    predecessorText: {
        color: COLORS.text + '80',
        fontSize: SIZES.small - 1,
        fontWeight: '500',
    },
    lockIcon: {
        fontSize: SIZES.small,
    },
});

export default React.memo(TaskItem);