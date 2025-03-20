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
} from 'react-native';
import { SIZES } from '../../theme';
import { Task } from '../../types';
import TaskItem from './TaskItem';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../context/ThemeContext';

type TaskSection = {
    title: string;
    data: Task[];
    count: number;
    completedCount: number;
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
    const [sortType, setSortType] = useState<'priority' | 'created' | 'dueDate'>('priority');
    const [groupByCompleted, setGroupByCompleted] = useState(true);
    const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
    const [filterVisible, setFilterVisible] = useState(false);

    // Animation refs for the filter panel
    const filterPanelHeight = useRef(new Animated.Value(0)).current;
    const filterPanelOpacity = useRef(new Animated.Value(0)).current;

    const toggleFilterPanel = () => {
        if (filterVisible) {
            Animated.parallel([
                Animated.timing(filterPanelHeight, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: false,
                }),
                Animated.timing(filterPanelOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: false,
                }),
            ]).start(() => setFilterVisible(false));
        } else {
            setFilterVisible(true);
            Animated.parallel([
                Animated.timing(filterPanelHeight, {
                    toValue: 130,
                    duration: 300,
                    useNativeDriver: false,
                }),
                Animated.timing(filterPanelOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: false,
                }),
            ]).start();
        }
    };

    const toggleSection = (sectionTitle: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionTitle]: !prev[sectionTitle],
        }));
    };

    const sortTasks = (tasksToSort: Task[], sortBy: string): Task[] => {
        const priorityOrder = { crucial: 0, high: 1, normal: 2, optional: 3 };
        return [...tasksToSort].sort((a, b) => {
            switch (sortBy) {
                case 'priority':
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                case 'created':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'dueDate':
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                default:
                    return 0;
            }
        });
    };

    const sections = useMemo(() => {
        if (tasks.length === 0) return [];
        let newSections: TaskSection[] = [];

        if (groupByCompleted) {
            const incompleteTasks = tasks.filter(task => !task.completed);
            const completedTasks = tasks.filter(task => task.completed);
            const sortedIncompleteTasks = sortTasks(incompleteTasks, sortType);
            const sortedCompletedTasks = sortTasks(completedTasks, sortType);

            if (sortedIncompleteTasks.length > 0) {
                newSections.push({
                    title: 'To Do',
                    data: sortedIncompleteTasks,
                    count: sortedIncompleteTasks.length,
                    completedCount: 0,
                });
            }
            if (sortedCompletedTasks.length > 0) {
                newSections.push({
                    title: 'Completed',
                    data: sortedCompletedTasks,
                    count: sortedCompletedTasks.length,
                    completedCount: sortedCompletedTasks.length,
                });
            }
        } else {
            const sortedTasks = sortTasks(tasks, sortType);
            newSections.push({
                title: 'All Tasks',
                data: sortedTasks,
                count: sortedTasks.length,
                completedCount: sortedTasks.filter(t => t.completed).length,
            });
        }
        return newSections;
    }, [tasks, groupByCompleted, sortType]);

    useEffect(() => {
        if (sections.length > 0 && Object.keys(expandedSections).length === 0) {
            const newExpandedSections: { [key: string]: boolean } = {};
            sections.forEach(section => {
                // Default: expand "To Do" and collapse "Completed"
                newExpandedSections[section.title] = section.title !== 'Completed';
            });
            setExpandedSections(newExpandedSections);
        }
    }, [sections, expandedSections]);

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
                    accessibilityLabel={`Section ${section.title}`}
                    accessibilityHint="Tap to expand or collapse this section"
                >
                    <View style={styles.sectionHeaderLeft}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
                        <View style={[styles.sectionBadge, { backgroundColor: colors.primary + '40' }]}>
                            <Text style={[styles.sectionCount, { color: colors.primary }]}>{section.data.length}</Text>
                        </View>
                    </View>
                    <View style={styles.sectionHeaderRight}>
                        {section.title === 'To Do' && (
                            <View style={[styles.progressContainer, { backgroundColor: colors.border }]}>
                                <View
                                    style={[
                                        styles.progressBar,
                                        {
                                            width: `${Math.max(0, 100 - (section.data.length / tasks.length * 100))}%`,
                                            backgroundColor: colors.success
                                        },
                                    ]}
                                />
                            </View>
                        )}
                        <MaterialIcons
                            name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                            size={24}
                            color={colors.text}
                        />
                    </View>
                </TouchableOpacity>
            );
        },
        [expandedSections, tasks.length, colors]
    );

    const renderListHeader = () => (
        <View style={styles.tasksHeader}>
            <View style={styles.headerTopRow}>
                <View style={styles.headerDivider}>
                    <Text style={[styles.tasksHeaderTitle, { color: colors.text }]}>
                        {tasks.length > 0 ? `${tasks.length} Task${tasks.length > 1 ? 's' : ''}` : 'No Tasks'}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.filterButton, {
                        backgroundColor: colors.card + '50',
                        borderColor: colors.border
                    }]}
                    onPress={toggleFilterPanel}
                    accessibilityLabel="Filter tasks"
                    accessibilityHint="Tap to open filter options"
                >
                    <MaterialIcons name="filter-list" size={22} color={colors.text} />
                </TouchableOpacity>
            </View>
            {filterVisible && (
                <Animated.View
                    style={[styles.filterPanel, {
                        height: filterPanelHeight,
                        opacity: filterPanelOpacity,
                        borderColor: colors.border
                    }]}
                >
                    <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={styles.filterBlur}>
                        <View style={styles.filterSection}>
                            <Text style={[styles.filterTitle, { color: colors.text }]}>Sort by:</Text>
                            <View style={styles.filterOptions}>
                                <TouchableOpacity
                                    style={[
                                        styles.filterOption,
                                        { backgroundColor: colors.card + '70', borderColor: colors.border },
                                        sortType === 'priority' && [styles.filterOptionActive, { backgroundColor: colors.primary }]
                                    ]}
                                    onPress={() => setSortType('priority')}
                                >
                                    <Text
                                        style={[
                                            styles.filterOptionText,
                                            { color: colors.text + '90' },
                                            sortType === 'priority' && [styles.filterOptionActiveText, { color: colors.onPrimary }]
                                        ]}
                                    >
                                        Priority
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.filterOption,
                                        { backgroundColor: colors.card + '70', borderColor: colors.border },
                                        sortType === 'created' && [styles.filterOptionActive, { backgroundColor: colors.primary }]
                                    ]}
                                    onPress={() => setSortType('created')}
                                >
                                    <Text
                                        style={[
                                            styles.filterOptionText,
                                            { color: colors.text + '90' },
                                            sortType === 'created' && [styles.filterOptionActiveText, { color: colors.onPrimary }]
                                        ]}
                                    >
                                        Created
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.filterOption,
                                        { backgroundColor: colors.card + '70', borderColor: colors.border },
                                        sortType === 'dueDate' && [styles.filterOptionActive, { backgroundColor: colors.primary }]
                                    ]}
                                    onPress={() => setSortType('dueDate')}
                                >
                                    <Text
                                        style={[
                                            styles.filterOptionText,
                                            { color: colors.text + '90' },
                                            sortType === 'dueDate' && [styles.filterOptionActiveText, { color: colors.onPrimary }]
                                        ]}
                                    >
                                        Due Date
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.filterSection}>
                            <Text style={[styles.filterTitle, { color: colors.text }]}>Group:</Text>
                            <View style={[styles.toggleContainer, {
                                backgroundColor: colors.card + '40',
                                borderColor: colors.border
                            }]}>
                                <TouchableOpacity
                                    style={[
                                        styles.toggleOption,
                                        groupByCompleted ? [styles.toggleOptionActive, { backgroundColor: colors.primary }] : styles.toggleOptionInactive,
                                    ]}
                                    onPress={() => setGroupByCompleted(true)}
                                >
                                    <Text
                                        style={[
                                            styles.toggleOptionText,
                                            groupByCompleted
                                                ? [styles.toggleOptionActiveText, { color: colors.onPrimary }]
                                                : [styles.toggleOptionInactiveText, { color: colors.text + '90' }],
                                        ]}
                                    >
                                        By Status
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.toggleOption,
                                        !groupByCompleted ? [styles.toggleOptionActive, { backgroundColor: colors.primary }] : styles.toggleOptionInactive,
                                    ]}
                                    onPress={() => setGroupByCompleted(false)}
                                >
                                    <Text
                                        style={[
                                            styles.toggleOptionText,
                                            !groupByCompleted
                                                ? [styles.toggleOptionActiveText, { color: colors.onPrimary }]
                                                : [styles.toggleOptionInactiveText, { color: colors.text + '90' }],
                                        ]}
                                    >
                                        All Together
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </BlurView>
                </Animated.View>
            )}
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
                    <Text style={[styles.emptyText, { color: colors.text }]}>No tasks for {currentDate.toLocaleDateString()}</Text>
                    <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Tap the + button to add a new task</Text>
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
    headerDivider: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tasksHeaderTitle: {
        fontSize: SIZES.large,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    filterButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    filterPanel: {
        marginVertical: 8,
        borderRadius: 12,
        overflow: 'hidden',
        marginHorizontal: 4,
        borderWidth: 1,
    },
    filterBlur: {
        padding: 15,
        height: '100%',
    },
    filterSection: {
        marginBottom: 12,
    },
    filterTitle: {
        fontSize: SIZES.small + 1,
        fontWeight: '600',
        marginBottom: 8,
    },
    filterOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 4,
    },
    filterOption: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
    },
    filterOptionText: {
        fontSize: SIZES.small,
    },
    filterOptionActive: {},
    filterOptionActiveText: {
        fontWeight: '600',
    },
    toggleContainer: {
        flexDirection: 'row',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    toggleOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    toggleOptionActive: {},
    toggleOptionInactive: {
        backgroundColor: 'transparent',
    },
    toggleOptionText: {
        fontSize: SIZES.small,
    },
    toggleOptionActiveText: {
        fontWeight: '600',
    },
    toggleOptionInactiveText: {},
    tasksSummary: {
        flexDirection: 'row',
        marginTop: 5,
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
    sectionHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressContainer: {
        width: 80,
        height: 4,
        borderRadius: 2,
        marginRight: 12,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 2,
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
        paddingHorizontal: 20,
        paddingVertical: 40,
    },
    emptyContent: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        borderRadius: 16,
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
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        borderWidth: 1,
    },
    emptyRefreshButtonText: {
        fontSize: SIZES.medium,
        fontWeight: '600',
    },
});

export default TaskList;