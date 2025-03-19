import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { COLORS, SIZES } from '../../theme';
import { Task } from '../../types';

interface PredecessorTaskSelectorProps {
    availableTasks: Task[];
    selectedPredecessors: string[];
    onSelectPredecessor: (taskId: string) => void;
}

const PredecessorTaskSelector: React.FC<PredecessorTaskSelectorProps> = ({
                                                                             availableTasks,
                                                                             selectedPredecessors,
                                                                             onSelectPredecessor,
                                                                         }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Select Predecessor Tasks</Text>
            <Text style={styles.subtitle}>
                These tasks must be completed before this task can be marked as complete
            </Text>
            <ScrollView style={styles.taskList}>
                {availableTasks.map((task) => (
                    <TouchableOpacity
                        key={task.id}
                        style={[
                            styles.taskItem,
                            selectedPredecessors.includes(task.id) && styles.taskItemSelected,
                        ]}
                        onPress={() => onSelectPredecessor(task.id)}
                    >
                        <View style={styles.taskInfo}>
                            <Text style={styles.taskTitle} numberOfLines={1}>
                                {task.title}
                            </Text>
                            <Text style={styles.taskCategory} numberOfLines={1}>
                                {task.category}
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.checkbox,
                                selectedPredecessors.includes(task.id) && styles.checkboxSelected,
                            ]}
                        >
                            {selectedPredecessors.includes(task.id) && (
                                <Text style={styles.checkmark}>✓</Text>
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: SIZES.medium,
    },
    title: {
        fontSize: SIZES.medium,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SIZES.small,
    },
    subtitle: {
        fontSize: SIZES.small,
        color: COLORS.text + '80',
        marginBottom: SIZES.medium,
    },
    taskList: {
        maxHeight: 200,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SIZES.small,
        borderRadius: SIZES.base,
        backgroundColor: COLORS.card,
        marginBottom: SIZES.small,
        justifyContent: 'space-between',
    },
    taskItemSelected: {
        backgroundColor: COLORS.primary + '20',
    },
    taskInfo: {
        flex: 1,
        marginRight: SIZES.small,
    },
    taskTitle: {
        fontSize: SIZES.font,
        color: COLORS.text,
        fontWeight: '500',
    },
    taskCategory: {
        fontSize: SIZES.small,
        color: COLORS.text + '80',
        marginTop: 2,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: COLORS.primary,
    },
    checkmark: {
        color: COLORS.background,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default PredecessorTaskSelector;