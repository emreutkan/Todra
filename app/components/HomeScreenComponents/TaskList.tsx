import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SectionList,
    Animated,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    ScrollView,
} from 'react-native';
import { SIZES } from '../../theme';
import { Task, TaskPriority } from '../../types';
import TaskItem from './TaskItem';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

type TaskSection = {
    title: string;
    data: Task[];
    count: number;
};

interface TaskListProps {
    tasks: Task[];
    taskOpacity: Animated.Value;
    loading: boolean;
    currentDate: Date;
    onDeleteTask: (id: string) => void;
    onToggleTaskCompletion: (id: string) => void;
    onTaskPress: (id: string) => void;
    onRefresh?: () => Promise<void>;
}

const TaskList: React.FC<TaskListProps> = ({
                                               tasks,
                                               taskOpacity,
                                               loading,
                                               currentDate,
                                               onDeleteTask,
                                               onToggleTaskCompletion,
                                               onTaskPress,
                                               onRefresh,
                                           }) => {
    const { colors, isDark } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

    const toggleSection = (sectionTitle: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionTitle]: !prev[sectionTitle],
        }));
    };

    const categories = useMemo(() => {
        const uniqueCategories = new Set(tasks.map(task => task.category || 'Uncategorized'));
        return ['all', ...Array.from(uniqueCategories)];
    }, [tasks]);

    const sections = useMemo(() => {
        if (tasks.length === 0) return [];

        const filteredTasks = selectedCategory === 'all'
            ? tasks
            : tasks.filter(task => (task.category || 'Uncategorized') === selectedCategory);

        const priorityGroups: { [key in TaskPriority]: Task[] } = {
            high: [],
            normal: [],
            low: [],
        };

        filteredTasks.forEach(task => {
            const priority = priorityGroups.hasOwnProperty(task.priority) ? task.priority : 'normal';
            priorityGroups[priority].push(task);
        });

        return Object.entries(priorityGroups)
            .filter(([_, tasks]) => tasks.length > 0)
            .map(([priority, tasks]) => ({
                title: priority.charAt(0).toUpperCase() + priority.slice(1) + ' Priority',
                data: tasks.sort((a, b) => (b.dueDate || 0) - (a.dueDate || 0)),
                count: tasks.length,
            }));
    }, [tasks, selectedCategory]);

    useEffect(() => {
        if (sections.length > 0 && Object.keys(expandedSections).length === 0) {
            const newExpandedSections: { [key: string]: boolean } = {};
            sections.forEach(section => {
                newExpandedSections[section.title] = true;
            });
            setExpandedSections(newExpandedSections);
        }
    }, [sections]);

    const handleRefresh = async () => {
        if (onRefresh) {
            setRefreshing(true);
            await onRefresh();
            setRefreshing(false);
        }
    };

    const renderSectionHeader = useCallback(
        ({ section }: { section: TaskSection }) => {
            const isExpanded = expandedSections[section.title] || false;
            return (
                <TouchableOpacity
                    style={[styles.sectionHeader, {
                        backgroundColor: colors.background + 'F8',
                        borderBottomColor: colors.border
                    }]}
                    onPress={() => toggleSection(section.title)}
                    activeOpacity={0.7}
                >
                    <View style={styles.sectionHeaderLeft}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
                        <View style={[styles.sectionBadge, { backgroundColor: colors.primary + '40' }]}>
                            <Text style={[styles.sectionCount, { color: colors.primary }]}>{section.count}</Text>
                        </View>
                    </View>
                    <MaterialIcons
                        name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                        size={24}
                        color={colors.text}
                    />
                </TouchableOpacity>
            );
        },
        [expandedSections, colors]
    );

    const renderListHeader = () => (
        <View style={styles.tasksHeader}>
            <View style={styles.headerTopRow}>
                <Text style={[styles.tasksHeaderTitle, { color: colors.text }]}>
                    {tasks.length > 0 ? `${tasks.length} Task${tasks.length > 1 ? 's' : ''}` : 'No Tasks'}
                </Text>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScrollView}
                contentContainerStyle={styles.categoryScrollContent}
            >
                {categories.map((category) => (
                    <TouchableOpacity
                        key={category}
                        style={[
                            styles.categoryChip,
                            {
                                backgroundColor: selectedCategory === category ? colors.primary : colors.card,
                                borderColor: colors.border,
                            },
                        ]}
                        onPress={() => setSelectedCategory(category)}
                    >
                        <Text
                            style={[
                                styles.categoryChipText,
                                { color: selectedCategory === category ? colors.onPrimary : colors.text },
                            ]}
                        >
                            {category === 'all' ? 'All Categories' : category}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            <View style={styles.tasksSummary}>
                <View style={styles.tasksSummaryItem}>
                    <View style={[styles.tasksSummaryDot, { backgroundColor: colors.success }]} />
                    <Text style={[styles.tasksSummaryText, { color: colors.textSecondary }]}>
                        {tasks.filter(t => t.completed).length} Completed
                    </Text>
                </View>
                <View style={styles.tasksSummaryItem}>
                    <View style={[styles.tasksSummaryDot, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.tasksSummaryText, { color: colors.textSecondary }]}>
                        {tasks.filter(t => !t.completed).length} Remaining
                    </Text>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={[styles.loadingText, { color: colors.text }]}>Loading tasks...</Text>
            </View>
        );
    }

    if (tasks.length === 0) {
        return (
            <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
                <View style={[styles.emptyContent, {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderWidth: 1,
                }]}>
                    <Ionicons name="calendar-outline" size={70} color={colors.text + '40'} />
                    <Text style={[styles.emptyText, { color: colors.text }]}>No tasks</Text>
                    <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                        Tap the + button to add a new task
                    </Text>
                    <TouchableOpacity
                        style={[styles.emptyRefreshButton, {
                            backgroundColor: colors.primary + '30',
                            borderColor: colors.primary + '50'
                        }]}
                        onPress={handleRefresh}
                    >
                        <Text style={[styles.emptyRefreshButtonText, { color: colors.primary }]}>Refresh</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderSectionHeader={renderSectionHeader}
            stickySectionHeadersEnabled
            ListHeaderComponent={renderListHeader}
            renderItem={({ item, index, section }) => {
                if (!expandedSections[section.title]) return null;
                return (
                    <TaskItem
                        item={item}
                        index={index}
                        taskOpacity={taskOpacity}
                        totalTasks={section.data.length}
                        allTasks={tasks}
                        onDelete={onDeleteTask}
                        onToggleComplete={onToggleTaskCompletion}
                        onPress={onTaskPress}
                    />
                );
            }}
            contentContainerStyle={styles.taskList}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={[colors.primary]}
                    tintColor={colors.primary}
                    progressBackgroundColor={colors.card}
                />
            }
        />
    );
};

const styles = StyleSheet.create({
    tasksHeader: {
        marginTop: 20,
        marginBottom: 15,
        paddingHorizontal: 16,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    tasksHeaderTitle: {
        fontSize: SIZES.large,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    categoryScrollView: {
        marginTop: 12,
        marginBottom: 8,
    },
    categoryScrollContent: {
        paddingRight: 16,
    },
    categoryChip: {
        // paddingHorizontal: 16,
        // paddingVertical: 8,
        // borderRadius: 20,
        // marginRight: 8,
        borderWidth: 1,
        borderRadius: 20,
        marginRight: SIZES.small,
        paddingHorizontal: SIZES.medium,
        paddingVertical: 8,
        elevation: 1,                   // Subtle shadow for depth
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    categoryChipText: {
        fontSize: SIZES.small,
        fontWeight: '500',
    },
    tasksSummary: {
        flexDirection: 'row',
        marginTop: 12,
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
        fontSize: SIZES.small,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: SIZES.medium,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    sectionBadge: {
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginLeft: 8,
        minWidth: 24,
        alignItems: 'center',
    },
    sectionCount: {
        fontSize: SIZES.small - 1,
        fontWeight: '600',
    },
    taskList: {
        paddingBottom: 100,
        paddingHorizontal: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 40,
    },
    loadingText: {
        fontSize: SIZES.medium,
        marginTop: 16,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SIZES.medium,
        paddingVertical: 40,
    },
    emptyContent: {
        width: '100%',
        justifyContent: 'center',
        borderRadius: SIZES.base * 1.5,  // More consistent rounding
        paddingVertical: SIZES.extraLarge * 1.5,
        paddingHorizontal: SIZES.medium,
        marginTop: SIZES.extraLarge,
        alignItems: 'center',
        elevation: 3,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    emptyText: {
        fontSize: SIZES.large,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 10,
    },
    emptySubtext: {
        fontSize: SIZES.medium,
        textAlign: 'center',
        marginBottom: 24,
    },
    emptyRefreshButton: {

        borderWidth: 1,
        marginTop: SIZES.large,
        paddingVertical: SIZES.small,
        paddingHorizontal: SIZES.medium * 1.5,
        borderRadius: SIZES.base * 1.5,  // Match container radius
    },
    emptyRefreshButtonText: {
        fontSize: SIZES.medium,
        fontWeight: '600',
    },
});

export default TaskList;