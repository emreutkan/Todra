import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    PanResponder,
    Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, PRIORITY_COLORS, SIZES } from '../../theme';
import { Task, TaskPriority } from '../../types';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = -100;

interface TaskItemProps {
    item: Task;
    index: number;
    taskOpacity: Animated.Value;
    totalTasks: number;
    onDelete: (id: string) => void;
    onToggleComplete: (id: string) => void;
    onPress: (id: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
                                               item,
                                               index,
                                               taskOpacity,
                                               totalTasks,
                                               onDelete,
                                               onToggleComplete,
                                               onPress
                                           }) => {
    const translateX = new Animated.Value(0);

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => {
            translateX.setValue(gestureState.dx);
        },
        onPanResponderRelease: (_, gestureState) => {
            if (gestureState.dx < SWIPE_THRESHOLD) {
                // Delete the task
                Animated.timing(translateX, {
                    toValue: -width,
                    duration: 250,
                    useNativeDriver: true,
                }).start(() => onDelete(item.id));
            } else {
                // Reset position
                Animated.spring(translateX, {
                    toValue: 0,
                    useNativeDriver: true,
                }).start();
            }
        },
    });

    // Animating the task item entrance
    const taskAnimStyle = {
        transform: [{ translateX }],
        opacity: taskOpacity,
    };

    const getPriorityLabel = (priority: TaskPriority) => {
        return priority.charAt(0).toUpperCase() + priority.slice(1);
    };

    return (
        <Animated.View
            style={[
                styles.taskItemContainer,
                taskAnimStyle,
                { zIndex: totalTasks - index }
            ]}
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
                >
                    <TouchableOpacity
                        style={[
                            styles.checkbox,
                            item.completed && styles.checkboxChecked
                        ]}
                        onPress={() => onToggleComplete(item.id)}
                    >
                        {item.completed && (
                            <View style={styles.checkmark}>
                                <Text style={styles.checkmarkText}>✓</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <View style={styles.taskTextContainer}>
                        <Text
                            style={[
                                styles.taskTitle,
                                item.completed && styles.taskCompleted
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {item.title}
                        </Text>
                        {item.description ? (
                            <Text
                                style={[
                                    styles.taskDescription,
                                    item.completed && styles.taskCompleted
                                ]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {item.description}
                            </Text>
                        ) : null}
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
    priorityBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
        marginTop: 4,
    },
    priorityText: {
        color: COLORS.text,
        fontSize: SIZES.small - 1,
        fontWeight: '600',
    },
});

export default TaskItem;