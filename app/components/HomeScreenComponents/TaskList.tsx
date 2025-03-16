import React from 'react';
import { View, Text, StyleSheet, FlatList, Animated } from 'react-native';
import { COLORS, SIZES } from '../../theme';
import { Task } from '../../types';
import TaskItem from './TaskItem';

interface TaskListProps {
    tasks: Task[];
    taskOpacity: Animated.Value;
    loading: boolean;
    currentDate: Date;
    onDeleteTask: (id: string) => void;
    onToggleTaskCompletion: (id: string) => void;
    onTaskPress: (id: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({
                                               tasks,
                                               taskOpacity,
                                               loading,
                                               currentDate,
                                               onDeleteTask,
                                               onToggleTaskCompletion,
                                               onTaskPress
                                           }) => {
    const renderTasksHeader = () => {
        return (
            <View style={styles.tasksHeader}>
                <View style={styles.headerDivider}>
                    <Text style={styles.tasksHeaderTitle}>
                        {tasks.length > 0
                            ? `${tasks.length} Task${tasks.length > 1 ? 's' : ''}`
                            : 'No Tasks'}
                    </Text>
                </View>

                <View style={styles.tasksSummary}>
                    <View style={styles.tasksSummaryItem}>
                        <View style={[styles.tasksSummaryDot, { backgroundColor: COLORS.success }]} />
                        <Text style={styles.tasksSummaryText}>
                            {tasks.filter(t => t.completed).length} Completed
                        </Text>
                    </View>
                    <View style={styles.tasksSummaryItem}>
                        <View style={[styles.tasksSummaryDot, { backgroundColor: COLORS.primary }]} />
                        <Text style={styles.tasksSummaryText}>
                            {tasks.filter(t => !t.completed).length} Remaining
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading tasks...</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={tasks}
            renderItem={({ item, index }) => (
                <TaskItem
                    item={item}
                    index={index}
                    taskOpacity={taskOpacity}
                    totalTasks={tasks.length}
                    onDelete={onDeleteTask}
                    onToggleComplete={onToggleTaskCompletion}
                    onPress={onTaskPress}
                />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.taskList}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={renderTasksHeader}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No tasks for {currentDate.toLocaleDateString()}</Text>
                    <Text style={styles.emptySubtext}>Swipe left/right on tasks to delete them</Text>
                </View>
            }
        />
    );
};

const styles = StyleSheet.create({
    tasksHeader: {
        marginTop: 20,
        marginBottom: 15,
    },
    headerDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    tasksHeaderTitle: {
        color: COLORS.text,
        fontSize: SIZES.large,
        fontWeight: 'bold',
    },
    tasksSummary: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    tasksSummaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    tasksSummaryDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    tasksSummaryText: {
        color: COLORS.text + '80',
        fontSize: SIZES.small,
    },
    taskList: {
        paddingBottom: 100,
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
    emptyContainer: {
        marginTop: 40,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    emptyText: {
        color: COLORS.text,
        fontSize: SIZES.large,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 10,
    },
    emptySubtext: {
        color: COLORS.text + '80',
        fontSize: SIZES.medium,
        textAlign: 'center',
    },
});

export default TaskList;