import React, {useEffect, useMemo, useRef} from 'react';
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
import { PRIORITY_COLORS, SIZES } from '../../theme';
import { Task, TaskPriority } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = -80; // Reduced threshold for easier deletion

interface TaskItemProps {
    item: Task;
    index: number;
    taskOpacity: Animated.Value;
    totalTasks: number;
    allTasks: Task[];
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
    const { colors } = useTheme();
    const translateX = useRef(new Animated.Value(0)).current;
    const scaleValue = useRef(new Animated.Value(1)).current;
    const deleteButtonOpacity = useRef(new Animated.Value(0)).current;
    const prerequisitePulse = useRef(new Animated.Value(0.8)).current;

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

        const incompletePrereqs = item.predecessorIds
            .map(predId => allTasks.find(t => t.id === predId))
            .filter(task => task && !task.completed);

        return {
            total: item.predecessorIds.length,
            completed: completedCount,
            incompletePrereqs: incompletePrereqs,
        };
    }, [item.predecessorIds, allTasks]);

    // Animate the prerequisite indicator if prerequisites are not met
    useEffect(() => {
        if (predecessorInfo && predecessorInfo.completed < predecessorInfo.total && !item.completed) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(prerequisitePulse, {
                        toValue: 1.1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(prerequisitePulse, {
                        toValue: 0.8,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            prerequisitePulse.setValue(1);
        }
    }, [prerequisitePulse, predecessorInfo, item.completed]);

    const panResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onPanResponderGrant: () => {
                    // Provide feedback when user starts dragging
                    Animated.spring(scaleValue, {
                        toValue: 0.98,
                        friction: 7,
                        useNativeDriver: true,
                    }).start();
                },
                onPanResponderMove: (_, gestureState) => {
                    translateX.setValue(gestureState.dx);
                    // Show delete button as user swipes
                    if (gestureState.dx < 0) {
                        const opacity = Math.min(Math.abs(gestureState.dx) / Math.abs(SWIPE_THRESHOLD), 1);
                        deleteButtonOpacity.setValue(opacity);
                    }
                },
                onPanResponderRelease: (_, gestureState) => {
                    // Reset scale
                    Animated.spring(scaleValue, {
                        toValue: 1,
                        friction: 7,
                        useNativeDriver: true,
                    }).start();

                    if (gestureState.dx < SWIPE_THRESHOLD) {
                        // Vibration feedback when threshold is crossed
                        Vibration.vibrate(100);

                        Animated.timing(translateX, {
                            toValue: -width,
                            duration: 250,
                            useNativeDriver: true,
                        }).start(() => onDelete(item.id));
                    } else {
                        Animated.parallel([
                            Animated.spring(translateX, {
                                toValue: 0,
                                tension: 40,
                                friction: 7,
                                useNativeDriver: true,
                            }),
                            Animated.timing(deleteButtonOpacity, {
                                toValue: 0,
                                duration: 200,
                                useNativeDriver: true,
                            })
                        ]).start();
                    }
                },
            }),
        [translateX, scaleValue, deleteButtonOpacity, onDelete, item.id]
    );

    const handleToggleComplete = () => {
        if (!item.completed && !canComplete) {
            // Error vibration feedback
            Vibration.vibrate([0, 50, 50, 50]);

            // Show more specific error with prerequisite task information
            const incompletePrereqs = predecessorInfo?.incompletePrereqs || [];
            const prereqNames = incompletePrereqs
                .map(task => `• ${task?.title}`)
                .join('\n');

            Alert.alert(
                'Prerequisites Required',
                `You need to complete these tasks first:\n\n${prereqNames}`,
                [{
                    text: 'View First Task',
                    onPress: () => incompletePrereqs[0] && onPress(incompletePrereqs[0].id)
                },
                    { text: 'OK' }]
            );
            return;
        }

        // Success vibration feedback
        Vibration.vibrate(50);

        onToggleComplete(item.id);
    };

    const taskAnimStyle = {
        transform: [{ translateX }, { scale: scaleValue }],
        opacity: taskOpacity,
    };

    const getPriorityLabel = (priority: TaskPriority) =>
        priority.charAt(0).toUpperCase() + priority.slice(1);

    const checkmarkScale = useRef(new Animated.Value(item.completed ? 1 : 0)).current;

    useEffect(() => {
        Animated.spring(checkmarkScale, {
            toValue: item.completed ? 1 : 0,
            friction: 4,
            useNativeDriver: true,
        }).start();
    }, [item.completed, checkmarkScale]);

    // Calculate visual indicators based on prerequisite status
    const hasPrerequisites = predecessorInfo && predecessorInfo.total > 0;
    const allPrerequisitesComplete = predecessorInfo &&
        predecessorInfo.completed === predecessorInfo.total;
    const prerequisiteProgress = predecessorInfo ?
        (predecessorInfo.completed / predecessorInfo.total) * 100 : 0;

    return (
        <View style={styles.containerWrapper}>
            {/* Delete button behind the card */}
                <Animated.View
                    style={[
                        styles.deleteButton,
                        {
                            opacity: deleteButtonOpacity,
                            backgroundColor: colors.error || '#FF3B30'
                        }
                    ]}
                >
                    <Icon name="delete" size={24} color="#fff" />
                </Animated.View>

                {/* Prerequisite visual indicator - shown on left side of card */}
                {hasPrerequisites && !item.completed && (
                    <Animated.View
                        style={[
                            styles.prerequisiteIndicator,
                            {
                                transform: [{ scale: prerequisitePulse }],
                                backgroundColor: allPrerequisitesComplete ?
                                    colors.success + '30' : colors.warning + '30'
                            }
                        ]}
                    >
                        <Icon
                            name={allPrerequisitesComplete ? "check-circle" : "hourglass-top"}
                            size={14}
                            color={allPrerequisitesComplete ? colors.success : colors.warning}
                        />
                    </Animated.View>
                )}

                <Animated.View
                    style={[
                        styles.taskItemContainer,
                        taskAnimStyle,
                        {
                            zIndex: totalTasks - index,
                            shadowColor: colors.text,
                            borderLeftWidth: 4,
                            borderLeftColor: PRIORITY_COLORS[item.priority]
                        }
                    ]}
                    {...panResponder.panHandlers}
                >
                    <View
                        style={[
                            styles.taskItem,
                            { backgroundColor: colors.card }
                        ]}
                    >
                        {/* Prerequisite progress bar - shown at top of card */}
                        {hasPrerequisites && !item.completed && (
                            <View style={styles.prereqProgressContainer}>
                                <View
                                    style={[
                                        styles.prereqProgressBar,
                                        {
                                            width: `${prerequisiteProgress}%`,
                                            backgroundColor: allPrerequisitesComplete ?
                                                colors.success : colors.warning
                                        }
                                    ]}
                                />
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.taskContent}
                            onPress={() => onPress(item.id)}
                            activeOpacity={0.7}
                            accessibilityLabel={`Task: ${item.title}${item.completed ? ', completed' : ''}`}
                            accessibilityHint="Tap to view task details"
                            accessibilityRole="button"
                        >
                            <TouchableOpacity
                                style={[
                                    styles.checkbox,
                                    {
                                        borderColor: item.completed ? colors.primary : colors.border
                                    },
                                    item.completed && { backgroundColor: colors.primary },
                                    !canComplete && !item.completed && {
                                        borderColor: colors.warning,
                                        borderStyle: 'dashed',
                                    }
                                ]}
                                onPress={handleToggleComplete}
                                accessibilityLabel={item.completed ? "Mark as incomplete" : "Mark as complete"}
                                accessibilityRole="checkbox"
                                accessibilityState={{ checked: item.completed }}
                            >
                                {item.completed ? (
                                    <Animated.View style={{ transform: [{ scale: checkmarkScale }] }}>
                                        <Icon name="check" size={18} color={colors.onPrimary} />
                                    </Animated.View>
                                ) : !canComplete ? (
                                    <Animated.View
                                        style={{
                                            transform: [{ scale: prerequisitePulse }],
                                            opacity: 0.9
                                        }}
                                    >
                                        <Icon name="lock" size={16} color={colors.warning} />
                                    </Animated.View>
                                ) : null}
                            </TouchableOpacity>

                            <View style={styles.taskTextContainer}>
                                <Text
                                    style={[
                                        styles.taskTitle,
                                        { color: colors.text },
                                        item.completed && styles.taskCompleted,
                                        !canComplete && !item.completed && { color: colors.textSecondary }
                                    ]}
                                    numberOfLines={2}
                                    ellipsizeMode="tail"
                                >
                                    {item.title}
                                </Text>

                                {item.description ? (
                                    <Text
                                        style={[
                                            styles.taskDescription,
                                            { color: colors.textSecondary },
                                            item.completed && styles.taskCompleted
                                        ]}
                                        numberOfLines={2}
                                        ellipsizeMode="tail"
                                    >
                                        {item.description}
                                    </Text>
                                ) : null}

                                <View style={styles.taskMetaContainer}>
                                    <View
                                        style={[
                                            styles.priorityBadge,
                                            { backgroundColor: PRIORITY_COLORS[item.priority] + 'E6' }
                                        ]}
                                    >
                                        <Text style={styles.priorityText}>
                                            {getPriorityLabel(item.priority)}
                                        </Text>
                                    </View>

                                    {predecessorInfo && (
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (!canComplete && predecessorInfo.incompletePrereqs.length > 0) {
                                                    const incompletePrereqs = predecessorInfo.incompletePrereqs;
                                                    const prereqNames = incompletePrereqs
                                                        .map(task => `• ${task?.title}`)
                                                        .join('\n');

                                                    Alert.alert(
                                                        'Prerequisite Tasks',
                                                        `Complete these tasks first:\n\n${prereqNames}`,
                                                        [
                                                            {
                                                                text: 'View First Task',
                                                                onPress: () => incompletePrereqs[0] && onPress(incompletePrereqs[0].id)
                                                            },
                                                            { text: 'OK' }
                                                        ]
                                                    );
                                                }
                                            }}
                                            style={[
                                                styles.predecessorBadge,
                                                {
                                                    backgroundColor: allPrerequisitesComplete
                                                        ? colors.success + '20'
                                                        : colors.warning + '20',
                                                    borderColor: allPrerequisitesComplete
                                                        ? colors.success + '40'
                                                        : colors.warning + '40',
                                                    borderWidth: 1
                                                }
                                            ]}
                                        >
                                            <Icon
                                                name={allPrerequisitesComplete ? "check-circle" : "link"}
                                                size={14}
                                                color={allPrerequisitesComplete ? colors.success : colors.warning}
                                                style={styles.linkIcon}
                                            />
                                            <Text style={[
                                                styles.predecessorText,
                                                {
                                                    color: allPrerequisitesComplete
                                                        ? colors.success
                                                        : colors.warning,
                                                    fontWeight: '600'
                                                }
                                            ]}>
                                                {`${predecessorInfo.completed}/${predecessorInfo.total} prereqs`}
                                            </Text>
                                            {!canComplete && !item.completed && (
                                                <Icon
                                                    name="info-outline"
                                                    size={14}
                                                    color={colors.warning}
                                                    style={styles.infoIcon}
                                                />
                                            )}
                                        </TouchableOpacity>
                                    )}


                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    containerWrapper: {
        position: 'relative',
        marginBottom: 16,
    },
    deleteButton: {
        position: 'absolute',
        right: 20,
        top: '50%',
        marginTop: -18,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 0,
    },
    taskItemContainer: {
        marginHorizontal: 12,
        borderRadius: 14,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 5,
        elevation: 3,
    },
    taskItem: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    taskContent: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        marginRight: 16,
        marginTop: 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    taskTextContainer: {
        flex: 1,
    },
    taskTitle: {
        fontSize: SIZES.medium,
        fontWeight: '600',
        marginBottom: 6,
        lineHeight: SIZES.medium * 1.4,
    },
    taskDescription: {
        fontSize: SIZES.small,
        marginBottom: 10,
        lineHeight: SIZES.small * 1.3,
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
        marginTop: 4,
    },
    priorityBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    priorityText: {
        color: '#FFFFFF',
        fontSize: SIZES.small - 1,
        fontWeight: '600',
    },
    predecessorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    predecessorText: {
        fontSize: SIZES.small - 1,
    },
    linkIcon: {
        marginLeft: 1,
    },
    infoIcon: {
        marginLeft: 2,
    },
    lockIcon: {
        marginLeft: 2,
    },

    prerequisiteIndicator: {
        position: 'absolute',
        left: 0,
        top: '50%',
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        marginTop: -10,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    prereqProgressContainer: {
        height: 3,
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14,
        overflow: 'hidden',
    },
    prereqProgressBar: {
        height: 3,
        borderTopLeftRadius: 14,
    },
});

export default React.memo(TaskItem);