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
    priority: TaskPriority;
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

    // Create priority-based sections
    const sections = useMemo(() => {
        if (tasks.length === 0) return [];

        const filteredTasks = selectedCategory === 'all'
            ? tasks
            : tasks.filter(task => (task.category || 'Uncategorized') === selectedCategory);

        // Filter out completed tasks
        const activeTasks = filteredTasks.filter(task => !task.completed);

        // Group by priority
        const priorityGroups: { [key in TaskPriority]: Task[] } = {
            high: [],
            normal: [],
            low: [],
        };

        activeTasks.forEach(task => {
            const priority = priorityGroups.hasOwnProperty(task.priority) ? task.priority : 'normal';
            priorityGroups[priority].push(task);
        });

        // For each priority group, sort tasks by:
        // 1. Overdue tasks first
        // 2. Tasks with prerequisites met next
        // 3. Then by due date (soonest first)
        const now = currentDate.getTime();

        const sortedSections = Object.entries(priorityGroups)
            .filter(([_, tasks]) => tasks.length > 0)
            .map(([priority, priorityTasks]) => {
                const sortedTasks = [...priorityTasks].sort((a, b) => {
                    // Check for overdue
                    const aIsOverdue = a.dueDate && a.dueDate < now;
                    const bIsOverdue = b.dueDate && b.dueDate < now;

                    if (aIsOverdue && !bIsOverdue) return -1;
                    if (!aIsOverdue && bIsOverdue) return 1;

                    // Check prerequisites
                    const aPrereqsMet = !a.predecessorIds || a.predecessorIds.length === 0 ||
                        a.predecessorIds.every(predId =>
                            tasks.find(t => t.id === predId)?.completed);

                    const bPrereqsMet = !b.predecessorIds || b.predecessorIds.length === 0 ||
                        b.predecessorIds.every(predId =>
                            tasks.find(t => t.id === predId)?.completed);

                    if (aPrereqsMet && !bPrereqsMet) return -1;
                    if (!aPrereqsMet && bPrereqsMet) return 1;

                    // Sort by due date
                    if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
                    if (a.dueDate && !b.dueDate) return -1;
                    if (!a.dueDate && b.dueDate) return 1;

                    return 0;
                });

                let title;
                switch(priority) {
                    case 'high':
                        title = 'Do First';
                        break;
                    case 'normal':
                        title = 'Do Next';
                        break;
                    case 'low':
                        title = 'Do Later';
                        break;
                    default:
                        title = 'Tasks';
                }

                return {
                    title,
                    data: sortedTasks,
                    count: sortedTasks.length,
                    priority: priority as TaskPriority
                };
            });

        return sortedSections;
    }, [tasks, selectedCategory, currentDate]);

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

    // Get color for priority section
    const getPrioritySectionColor = (priority: TaskPriority) => {
        switch(priority) {
            case 'high': return colors.error;
            case 'normal': return colors.warning;
            case 'low': return colors.success;
            default: return colors.primary;
        }
    };

    const renderSectionHeader = useCallback(
        ({ section }: { section: TaskSection }) => {
            const isExpanded = expandedSections[section.title] || false;
            const priorityColor = getPrioritySectionColor(section.priority);

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
                        <View style={[styles.priorityIndicator, { backgroundColor: priorityColor }]} />
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
                        <View style={[styles.sectionBadge, { backgroundColor: priorityColor + '20' }]}>
                            <Text style={[styles.sectionCount, { color: priorityColor }]}>{section.count}</Text>
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

    const renderTasksHeader = () => (
        <View style={styles.tasksHeader}>
            <View style={styles.headerTopRow}>
                <Text style={[styles.tasksHeaderTitle, { color: colors.text }]}>
                    My Tasks
                </Text>
                <Text style={[styles.tasksCount, { color: colors.textSecondary }]}>
                    {tasks.filter(t => !t.completed).length} remaining
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
                                backgroundColor: selectedCategory === category ? colors.primary : 'transparent',
                                borderColor: selectedCategory === category ? colors.primary : colors.border,
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

            <View style={styles.priorityLegend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                        High Priority
                    </Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                        Normal Priority
                    </Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                        Low Priority
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
            ListHeaderComponent={renderTasksHeader}
            renderItem={({ item, index, section }) => {
                if (!expandedSections[section.title]) return null;

                // Calculate if overdue
                const isOverdue = item.dueDate && item.dueDate < currentDate.getTime();

                // Calculate if prerequisites are met
                const prereqsMet = !item.predecessorIds || item.predecessorIds.length === 0 ||
                    item.predecessorIds.every(predId =>
                        tasks.find(t => t.id === predId)?.completed);

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
                        arePrereqsMet={prereqsMet}
                        priority={section.priority}
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
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    tasksHeaderTitle: {
        fontSize: SIZES.large,
        fontWeight: 'bold',
    },
    tasksCount: {
        fontSize: SIZES.medium,
    },
    categoryScrollView: {
        marginBottom: 16,
    },
    categoryScrollContent: {
        paddingRight: 8,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
    },
    categoryChipText: {
        fontSize: SIZES.small,
        fontWeight: '500',
    },
    priorityLegend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        marginBottom: 8,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    legendText: {
        fontSize: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    priorityIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    sectionTitle: {
        fontSize: SIZES.medium,
        fontWeight: '600',
    },
    sectionBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 8,
    },
    sectionCount: {
        fontSize: SIZES.small,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyContent: {
        width: '100%',
        padding: 30,
        borderRadius: 12,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: SIZES.large,
        fontWeight: 'bold',
        marginTop: 20,
    },
    emptySubtext: {
        fontSize: SIZES.medium,
        textAlign: 'center',
        marginTop: 10,
    },
    emptyRefreshButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 20,
        borderWidth: 1,
    },
    emptyRefreshButtonText: {
        fontSize: SIZES.medium,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: SIZES.medium,
    },
    taskList: {
        paddingBottom: 100,
    },
});

export default TaskList;