import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList, Task } from '../types';
import { storageService } from '../storage';

type AllTasksScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AllTasks'>;

const AllTasksScreen: React.FC = () => {
    const navigation = useNavigation<AllTasksScreenNavigationProp>();
    const { colors, isDark } = useTheme();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    const loadTasks = useCallback(async () => {
        setLoading(true);
        try {
            const loadedTasks = await storageService.loadTasks();
            // Sort tasks by createdAt date (newest first)
            loadedTasks.sort((a, b) => b.createdAt - a.createdAt);
            setTasks(loadedTasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
            Alert.alert('Error', 'Failed to load tasks');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    const handleBackPress = () => {
        navigation.goBack();
    };

    const handleTaskPress = (taskId: string) => {
        navigation.navigate('TaskDetails', { taskId });
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const renderItem = ({ item }: { item: Task }) => {
        const categoryColor = item.category ? '#3498db' : 'transparent';

        return (
            <TouchableOpacity
                style={[styles.taskItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleTaskPress(item.id)}
            >
                <View style={styles.taskHeader}>
                    <View style={styles.taskTitleContainer}>
                        <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(item.priority) }]} />
                        <Text
                            style={[
                                styles.taskTitle,
                                { color: colors.text },
                                item.completed && styles.completedText
                            ]}
                            numberOfLines={1}
                        >
                            {item.title}
                        </Text>
                    </View>
                    {item.completed && (
                        <View style={[styles.statusBadge, { backgroundColor: colors.success }]}>
                            <Text style={styles.statusText}>Completed</Text>
                        </View>
                    )}
                </View>

                <View style={styles.taskDetails}>
                    <View style={styles.taskDetailRow}>
                        <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.taskDetailText, { color: colors.textSecondary }]}>
                            Created: {formatDate(item.createdAt)}
                        </Text>
                    </View>

                    {item.dueDate > 0 && (
                        <View style={styles.taskDetailRow}>
                            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                            <Text style={[styles.taskDetailText, { color: colors.textSecondary }]}>
                                Due: {formatDate(item.dueDate)}
                            </Text>
                        </View>
                    )}

                    {item.category && (
                        <View style={styles.taskDetailRow}>
                            <Ionicons name="bookmark-outline" size={16} color={colors.textSecondary} />
                            <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
                                <Text style={styles.categoryText}>
                                    {item.category}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return '#e74c3c';
            case 'normal':
                return '#3498db';
            case 'low':
                return '#2ecc71';
            default:
                return '#95a5a6';
        }
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
                <View style={styles.placeholder} />
            </View>

            <FlatList
                data={tasks}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons
                            name="document-text-outline"
                            size={64}
                            color={colors.textSecondary}
                        />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            {loading ? 'Loading tasks...' : 'No tasks found'}
                        </Text>
                    </View>
                }
            />
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
    placeholder: {
        width: 40,
    },
    listContainer: {
        padding: 16,
    },
    taskItem: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    taskTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    priorityIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    completedText: {
        textDecorationLine: 'line-through',
        opacity: 0.7,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginLeft: 8,
    },
    statusText: {
        fontSize: 12,
        color: 'white',
        fontWeight: '500',
    },
    taskDetails: {
        marginTop: 8,
    },
    taskDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    taskDetailText: {
        fontSize: 14,
        marginLeft: 6,
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 6,
    },
    categoryText: {
        fontSize: 12,
        color: 'white',
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 16,
        textAlign: 'center',
    },
});

export default AllTasksScreen;