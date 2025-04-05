import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
    Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSettings, Task } from '../context/SettingsContext';
import { RootStackParamList } from '../types';
import AsyncStorage from "@react-native-async-storage/async-storage";

type AllTasksScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AllTasks'>;

type TaskCategory = 'current' | 'archived';

const AllTasksScreen: React.FC = () => {
    const navigation = useNavigation<AllTasksScreenNavigationProp>();
    const { colors, isDark } = useTheme();
    const { getCurrentTasks, getArchivedTasks, archiveCompletedTasks } = useSettings();

    const [isLoading, setIsLoading] = useState(true);
    const [currentTasks, setCurrentTasks] = useState<Task[]>([]);
    const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<TaskCategory>('current');

    const debugCheckStorage = async () => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            console.log('All storage keys:', keys);

            for (const key of keys) {
                const value = await AsyncStorage.getItem(key);
                console.log(`Key: ${key}\nValue:`, value);
            }
        } catch (error) {
            console.error('Debug error:', error);
        }
    };
    const fetchTasks = useCallback(async () => {
        setIsLoading(true);
        try {
            const current = await getCurrentTasks();
            const archived = await getArchivedTasks();

            console.log('Current tasks:', current);  // Add this
            console.log('Archived tasks:', archived); // Add this

            setCurrentTasks(current);
            setArchivedTasks(archived);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            Alert.alert('Error', 'Failed to load tasks. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [getCurrentTasks, getArchivedTasks]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleBackPress = () => {
        navigation.goBack();
    };

    const handleArchiveAllCompleted = async () => {
        try {
            const count = await archiveCompletedTasks();
            if (count > 0) {
                Alert.alert('Success', `${count} completed task${count !== 1 ? 's' : ''} archived.`);
                fetchTasks(); // Refresh the lists
            } else {
                Alert.alert('No Tasks', 'There are no completed tasks to archive.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to archive tasks. Please try again.');
        }
    };

    const handleTaskPress = (task: Task) => {
        // Navigate to task details screen
        navigation.navigate('TaskDetails', { taskId: task.id });
    };

    const renderTaskItem = ({ item }: { item: Task }) => (
        <TouchableOpacity
            style={[
                styles.taskItem,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: item.completed ? 0.7 : 1
                }
            ]}
            onPress={() => handleTaskPress(item)}
        >
            <View style={styles.taskHeader}>
                <Text
                    style={[
                        styles.taskTitle,
                        {
                            color: colors.text,
                            textDecorationLine: item.completed ? 'line-through' : 'none'
                        }
                    ]}
                >
                    {item.title}
                </Text>
                <Text style={[styles.taskPriority, { color: getPriorityColor(item.priority) }]}>
                    {item.priority}
                </Text>
            </View>

            {item.description ? (
                <Text
                    style={[styles.taskDescription, { color: colors.textSecondary }]}
                    numberOfLines={2}
                >
                    {item.description}
                </Text>
            ) : null}

            <View style={styles.taskFooter}>
                <Text style={[styles.taskDate, { color: colors.textSecondary }]}>
                    {formatDate(item.dueDate)}
                </Text>
                <View style={styles.taskStatus}>
                    <Ionicons
                        name={item.completed ? "checkmark-circle" : "time-outline"}
                        size={16}
                        color={item.completed ? colors.success : colors.warning}
                        style={styles.taskStatusIcon}
                    />
                    <Text style={[styles.taskStatusText, { color: colors.textSecondary }]}>
                        {item.completed ? "Completed" : "Pending"}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const getPriorityColor = (priority: string): string => {
        switch (priority.toLowerCase()) {
            case 'high':
                return colors.error || '#e74c3c';
            case 'medium':
                return colors.warning || '#f39c12';
            case 'low':
                return colors.success || '#2ecc71';
            default:
                return colors.text;
        }
    };

    const formatDate = (dateString: string): string => {
        if (!dateString) return 'No date';

        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={isDark ? "light" : "dark"} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBackPress}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>All Tasks</Text>

                {selectedCategory === 'current' && (
                    <TouchableOpacity style={styles.actionButton} onPress={handleArchiveAllCompleted}>
                        <Ionicons name="archive-outline" size={24} color={colors.primary} />
                    </TouchableOpacity>
                )}

                {selectedCategory === 'archived' && (
                    <View style={{ width: 32 }} />
                )}
            </View>
            {__DEV__ && (
                <TouchableOpacity
                    style={[styles.debugButton, { backgroundColor: colors.card }]}
                    onPress={debugCheckStorage}
                >
                    <Text style={{ color: colors.text }}>Debug Storage</Text>
                </TouchableOpacity>
            )}
            {/* Category Tabs */}
            <View style={[styles.tabContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        selectedCategory === 'current' && [styles.activeTab, { borderColor: colors.primary }]
                    ]}
                    onPress={() => setSelectedCategory('current')}
                >
                    <Text
                        style={[
                            styles.tabText,
                            { color: selectedCategory === 'current' ? colors.primary : colors.textSecondary }
                        ]}
                    >
                        Current Tasks
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.tab,
                        selectedCategory === 'archived' && [styles.activeTab, { borderColor: colors.primary }]
                    ]}
                    onPress={() => setSelectedCategory('archived')}
                >
                    <Text
                        style={[
                            styles.tabText,
                            { color: selectedCategory === 'archived' ? colors.primary : colors.textSecondary }
                        ]}
                    >
                        Archived
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Tasks List */}
            {isLoading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loaderText, { color: colors.text }]}>Loading tasks...</Text>
                </View>
            ) : (
                <FlatList
                    data={selectedCategory === 'current' ? currentTasks : archivedTasks}
                    keyExtractor={(item) => item.id}
                    renderItem={renderTaskItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Ionicons
                                name={selectedCategory === 'current' ? "document-outline" : "archive-outline"}
                                size={60}
                                color={colors.textSecondary}
                            />
                            <Text style={[styles.emptyText, { color: colors.text }]}>
                                {selectedCategory === 'current'
                                    ? "No active tasks found"
                                    : "No archived tasks yet"
                                }
                            </Text>
                            {selectedCategory === 'current' && (
                                <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
                                    Add a new task to get started
                                </Text>
                            )}
                        </View>
                    )}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        ...Platform.select({
            ios: {
                paddingTop: 50,
            },
            android: {
                paddingTop: 25,
            }
        })
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 15,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    actionButton: {
        padding: 8,
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
    },
    tabText: {
        fontSize: 16,
        fontWeight: '500',
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    taskItem: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    taskTitle: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
    },
    taskPriority: {
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 8,
    },
    taskDescription: {
        fontSize: 14,
        marginBottom: 8,
    },
    taskFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    taskDate: {
        fontSize: 14,
    },
    taskStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    taskStatusIcon: {
        marginRight: 4,
    },
    taskStatusText: {
        fontSize: 14,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderText: {
        marginTop: 16,
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '600',
    },
    emptySubText: {
        marginTop: 8,
        fontSize: 14,
    },
});

export default AllTasksScreen;