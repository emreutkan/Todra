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
import ProgressChart from '../HomeScreenComponents/ProgressChart';

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

    // New state for filter panel toggle
    const [showFilters, setShowFilters] = useState(false);
    // New state for category and priority filtering
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedPriority, setSelectedPriority] = useState<TaskPriority | 'all'>('all');
    const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

    // Toggle filter panel display
    const toggleFilter = () => {
        setShowFilters(prev => !prev);
    };

    // Build list of unique categories from tasks (defaulting to "Uncategorized")
    const categories = useMemo(() => {
        const uniqueCategories = new Set(tasks.map(task => task.category || 'Uncategorized'));
        return ['all', ...Array.from(uniqueCategories)];
    }, [tasks]);

    // Filter tasks for header and progress calculation based on both selectors
    const filteredTasksForHeader = useMemo(() => {
        return tasks.filter(task => {
            const matchesCategory =
                selectedCategory === 'all' || (task.category || 'Uncategorized') === selectedCategory;
            const matchesPriority =
                selectedPriority === 'all' || task.priority === selectedPriority;
            return matchesCategory && matchesPriority;
        });
    }, [tasks, selectedCategory, selectedPriority]);

    // Group filtered (active) tasks into sections for the SectionList
    const sections = useMemo(() => {
        const activeTasks = filteredTasksForHeader.filter(task => !task.completed);
        const priorityGroups: { [key in TaskPriority]: Task[] } = {
            high: [],
            normal: [],
            low: [],
        };

        activeTasks.forEach(task => {
            const prio: TaskPriority = priorityGroups.hasOwnProperty(task.priority)
                ? task.priority
                : 'normal';
            priorityGroups[prio].push(task);
        });

        const now = currentDate.getTime();
        const sortedSections = Object.entries(priorityGroups)
            .filter(([_, tasks]) => tasks.length > 0)
            .map(([priority, priorityTasks]) => {
                const sortedTasks = [...priorityTasks].sort((a, b) => {
                    const aIsOverdue = a.dueDate && a.dueDate < now;
                    const bIsOverdue = b.dueDate && b.dueDate < now;
                    if (aIsOverdue && !bIsOverdue) return -1;
                    if (!aIsOverdue && bIsOverdue) return 1;
                    if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
                    if (a.dueDate && !b.dueDate) return -1;
                    if (!a.dueDate && b.dueDate) return 1;
                    return 0;
                });

                let title;
                switch (priority) {
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
                    priority: priority as TaskPriority,
                };
            });

        return sortedSections;
    }, [filteredTasksForHeader, currentDate]);

    // Initially expand all sections
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

    // Helper: Return a color based on task priority
    const getPrioritySectionColor = (priority: TaskPriority) => {
        switch (priority) {
            case 'high': return colors.error;
            case 'normal': return colors.warning;
            case 'low': return colors.success;
            default: return colors.primary;
        }
    };

    // Render header for each section in SectionList
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
                    onPress={() =>
                        setExpandedSections(prev => ({
                            ...prev,
                            [section.title]: !prev[section.title]
                        }))
                    }
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

    // Render the main header for TaskList
    const renderTasksHeader = () => {
        // Calculate progress stats from filtered tasks (including completed tasks)
        const total = filteredTasksForHeader.length;
        const completed = filteredTasksForHeader.filter(t => t.completed).length;
        const remaining = total - completed;

        return (
            <View style={styles.tasksHeaderContainer}>
                <View style={styles.tasksHeaderTopRow}>
                    <Text style={[styles.tasksHeaderTitle, { color: colors.text }]}>
                        My Tasks
                    </Text>
                    <TouchableOpacity onPress={toggleFilter} style={styles.filterButton}>
                        <Text style={styles.filterChip}>
                            Filter
                        </Text>
                    </TouchableOpacity>
                </View>

                {showFilters && (
                    <View style={styles.filterPanel}>
                        {/* Category selector */}
                        <Text style={[styles.filterLabel, { color: colors.text }]}>Category</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.filterScrollContent}
                        >
                            {categories.map((category) => (
                                <TouchableOpacity
                                    key={category}
                                    style={[
                                        styles.filterChip,
                                        {
                                            backgroundColor: selectedCategory === category ? colors.primary : 'transparent',
                                            borderColor: selectedCategory === category ? colors.primary : colors.border,
                                        },
                                    ]}
                                    onPress={() => setSelectedCategory(category)}
                                >
                                    <Text style={[
                                        styles.filterChipText,
                                        { color: selectedCategory === category ? colors.onPrimary : colors.text },
                                    ]}>
                                        {category === 'all' ? 'All Categories' : category}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Priority selector */}
                        <Text style={[styles.filterLabel, { color: colors.text, marginTop: 10 }]}>Priority</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.filterScrollContent}
                        >
                            {(['all', 'high', 'normal', 'low'] as const).map((prio) => (
                                <TouchableOpacity
                                    key={prio}
                                    style={[
                                        styles.filterChip,
                                        {
                                            backgroundColor: selectedPriority === prio ? colors.primary : 'transparent',
                                            borderColor: selectedPriority === prio ? colors.primary : colors.border,
                                            marginRight: 8,
                                        },
                                    ]}
                                    onPress={() => setSelectedPriority(prio)}
                                >
                                    <Text style={[
                                        styles.filterChipText,
                                        { color: selectedPriority === prio ? colors.onPrimary : colors.text },
                                    ]}>
                                        {prio === 'all'
                                            ? 'All'
                                            : prio.charAt(0).toUpperCase() + prio.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Progress section - always visible below filters */}
                <View style={[styles.progressSection, {
                    backgroundColor: colors.card,
                    borderBottomColor: colors.border,
                }]}>
                    <ProgressChart
                        completed={completed}
                        remaining={remaining}
                        colors={colors}
                    />
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                Completed
                            </Text>
                            <Text style={[styles.statValue, { color: colors.success }]}>{completed}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                Remaining
                            </Text>
                            <Text style={[styles.statValue, { color: colors.primary }]}>{remaining}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                Total
                            </Text>
                            <Text style={[styles.statValue, { color: colors.text }]}>{total}</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

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
                        <Text style={[styles.emptyRefreshButtonText, { color: colors.primary }]}>
                            Refresh
                        </Text>
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
                const isOverdue = item.dueDate && item.dueDate < currentDate.getTime();
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
                        isOverdue={isOverdue}
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
    tasksHeaderContainer: {
        paddingHorizontal: 16,
    },
    tasksHeaderTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tasksHeaderTitle: {
        fontSize: SIZES.large,
        fontWeight: 'bold',
    },
    filterButton: {
        padding: 8,
    },

    filterLabel: {
        fontSize: SIZES.medium,
        fontWeight: '600',
        marginBottom: 6,
    },
    filterScrollContent: {
        paddingRight: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
    },
    filterChipText: {
        fontSize: SIZES.small,
        fontWeight: '500',
    },
    progressSection: {
        paddingVertical: 6,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        flex: 1,
        marginLeft: 10,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '600',
    },
    statDivider: {
        width: 1,
        height: 30,
        opacity: 0.2,
        backgroundColor: '#000',
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: SIZES.medium,
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
    taskList: {
        paddingBottom: 100,
    },
});

export default TaskList;
