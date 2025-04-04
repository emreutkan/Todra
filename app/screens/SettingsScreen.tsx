import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    Switch,
    Alert,
    Share,
    Linking
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { RootStackParamList } from '../types';
import ThemeSwitcher from '../components/common/ThemeSwitcher';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

const SettingsScreen: React.FC = () => {
    const navigation = useNavigation<SettingsScreenNavigationProp>();
    const { colors, isDark } = useTheme();
    const {
        settings,
        updateSetting,
        exportData,
        importData,
        clearAllTasks
    } = useSettings();

    const handleBackPress = () => {
        navigation.goBack();
    };

    const handleViewAllTasks = () => {
        navigation.navigate('AllTasks');
    };
// Replace the existing handleExportData function with this one:

    // Inside the SettingsScreen component:

    const handleExportData = async () => {
        try {
            // Get the exported data
            const data = await exportData();

            // Create a timestamp for the filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `TaskPlanner_Backup_${timestamp}.json`;

            // On Android, write to a temporary file first
            if (Platform.OS === 'android') {
                const filePath = `${FileSystem.cacheDirectory}${fileName}`;
                await FileSystem.writeAsStringAsync(filePath, data);

                // Share the file
                const shareResult = await Share.share({
                    title: 'Task Planner Data Export',
                    url: filePath
                });

                if (shareResult.action === Share.sharedAction) {
                    Alert.alert("Success", "Your data has been successfully exported!");
                }
            }
            // On iOS, share content directly
            else {
                const shareResult = await Share.share({
                    title: 'Task Planner Data Export',
                    message: data
                });

                if (shareResult.action === Share.sharedAction) {
                    Alert.alert("Success", "Your data has been successfully exported!");
                }
            }
        } catch (error) {
            console.error('Export error:', error);
            Alert.alert(
                "Export Failed",
                "There was a problem exporting your data. Please try again."
            );
        }
    };
    const handleImportData = async () => {
        try {
            // Open document picker to select a JSON file
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
                copyToCacheDirectory: true
            });

            if (result.type === 'success') {
                // Read the file content
                const fileContent = await FileSystem.readAsStringAsync(result.uri);
                const success = await importData(fileContent);

                if (success) {
                    Alert.alert(
                        "Import Successful",
                        "Your data has been successfully imported. The app will refresh to show the imported data."
                    );

                    // Here you could potentially trigger a refresh of your main screen data
                } else {
                    Alert.alert(
                        "Import Failed",
                        "There was a problem with the file format. Please ensure you're using a valid TaskPlanner backup file."
                    );
                }
            }
        } catch (error) {
            Alert.alert(
                "Import Failed",
                "There was a problem importing your data. Please try again."
            );
        }
    };

    const handleClearAllTasks = () => {
        Alert.alert(
            "Clear All Tasks",
            "Are you sure you want to delete all tasks? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete All",
                    style: "destructive",
                    onPress: async () => {
                        const success = await clearAllTasks();
                        if (success) {
                            Alert.alert("Success", "All tasks have been deleted.");
                            // You could trigger a refresh of your main screen here
                        } else {
                            Alert.alert("Error", "Failed to delete tasks. Please try again.");
                        }
                    }
                }
            ]
        );
    };

    const handlePrivacyPolicy = () => {
        Linking.openURL('https://yourapp.com/privacy-policy');
    };

    const handleTermsOfService = () => {
        Linking.openURL('https://yourapp.com/terms-of-service');
    };

    const handleSendFeedback = () => {
        Linking.openURL('mailto:support@yourapp.com?subject=TaskPlanner%20Feedback');
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
                <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Theme Section */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
                    <View style={styles.sectionContent}>
                        <Text style={[styles.settingLabel, { color: colors.text }]}>Theme</Text>
                    </View>
                    <View style={styles.themeSwitcherContainer}>
                        <ThemeSwitcher />
                    </View>
                </View>

                {/* Notifications Section */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
                    <View style={styles.toggleRow}>
                        <View style={styles.toggleInfo}>
                            <Ionicons name="notifications-outline" size={22} color={colors.primary} style={styles.settingIcon} />
                            <Text style={[styles.settingLabel, { color: colors.text }]}>Enable Notifications</Text>
                        </View>
                        <Switch
                            value={settings.notificationsEnabled}
                            onValueChange={(value) => updateSetting('notificationsEnabled', value)}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.notificationsEnabled ? colors.card : colors.textSecondary}
                            ios_backgroundColor={colors.border}
                        />
                    </View>

                    <View style={styles.toggleRow}>
                        <View style={styles.toggleInfo}>
                            <Ionicons name="volume-medium-outline" size={22} color={colors.primary} style={styles.settingIcon} />
                            <Text style={[styles.settingLabel, { color: colors.text }]}>Sound Effects</Text>
                        </View>
                        <Switch
                            value={settings.soundEnabled}
                            onValueChange={(value) => updateSetting('soundEnabled', value)}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.soundEnabled ? colors.card : colors.textSecondary}
                            ios_backgroundColor={colors.border}
                        />
                    </View>
                </View>

                {/* Preferences Section */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>
                    <View style={styles.toggleRow}>
                        <View style={styles.toggleInfo}>
                            <Ionicons name="trash-outline" size={22} color={colors.primary} style={styles.settingIcon} />
                            <Text style={[styles.settingLabel, { color: colors.text }]}>Confirm Before Delete</Text>
                        </View>
                        <Switch
                            value={settings.confirmDeleteEnabled}
                            onValueChange={(value) => updateSetting('confirmDeleteEnabled', value)}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.confirmDeleteEnabled ? colors.card : colors.textSecondary}
                            ios_backgroundColor={colors.border}
                        />
                    </View>

                    <View style={styles.toggleRow}>
                        <View style={styles.toggleInfo}>
                            <Ionicons name="archive-outline" size={22} color={colors.primary} style={styles.settingIcon} />
                            <Text style={[styles.settingLabel, { color: colors.text }]}>Auto-Archive Completed Tasks</Text>
                        </View>
                        <Switch
                            value={settings.autoArchiveEnabled}
                            onValueChange={(value) => updateSetting('autoArchiveEnabled', value)}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.autoArchiveEnabled ? colors.card : colors.textSecondary}
                            ios_backgroundColor={colors.border}
                        />
                    </View>
                </View>

                {/* Data Management Section */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Management</Text>
                    <TouchableOpacity
                        style={[styles.settingButton, { backgroundColor: colors.surface }]}
                        onPress={handleViewAllTasks}
                    >
                        <Ionicons name="list-outline" size={22} color={colors.primary} style={styles.settingIcon} />
                        <Text style={[styles.settingButtonText, { color: colors.text }]}>View All Tasks</Text>
                        <Ionicons name="chevron-forward" size={18} color={colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.settingButton, { backgroundColor: colors.surface, marginTop: 8 }]}
                        onPress={handleExportData}
                    >
                        <Ionicons name="download-outline" size={22} color={colors.primary} style={styles.settingIcon} />
                        <Text style={[styles.settingButtonText, { color: colors.text }]}>Export Data</Text>
                        <Ionicons name="chevron-forward" size={18} color={colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.settingButton, { backgroundColor: colors.surface, marginTop: 8 }]}
                        onPress={handleImportData}
                    >
                        <Ionicons name="cloud-upload-outline" size={22} color={colors.primary} style={styles.settingIcon} />
                        <Text style={[styles.settingButtonText, { color: colors.text }]}>Import Data</Text>
                        <Ionicons name="chevron-forward" size={18} color={colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.settingButton, { backgroundColor: isDark ? '#421b1b' : '#ffebeb', marginTop: 8 }]}
                        onPress={handleClearAllTasks}
                    >
                        <Ionicons name="trash-bin-outline" size={22} color={isDark ? '#ff6b6b' : '#d63031'} style={styles.settingIcon} />
                        <Text style={[styles.settingButtonText, { color: isDark ? '#ff6b6b' : '#d63031' }]}>Clear All Tasks</Text>
                        <Ionicons name="chevron-forward" size={18} color={isDark ? '#ff6b6b' : '#d63031'} />
                    </TouchableOpacity>
                </View>

                {/* App Info Section */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
                    <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: colors.text }]}>Version</Text>
                        <Text style={[styles.infoValue, { color: colors.textSecondary }]}>1.0.0</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: colors.text }]}>Last Updated</Text>
                        <Text style={[styles.infoValue, { color: colors.textSecondary }]}>2025-04-03</Text>
                    </View>
                    <TouchableOpacity style={styles.infoButton} onPress={handlePrivacyPolicy}>
                        <Text style={[styles.infoButtonText, { color: colors.primary }]}>Privacy Policy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.infoButton} onPress={handleTermsOfService}>
                        <Text style={[styles.infoButtonText, { color: colors.primary }]}>Terms of Service</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.infoButton} onPress={handleSendFeedback}>
                        <Text style={[styles.infoButtonText, { color: colors.primary }]}>Send Feedback</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
    scrollView: {
        flex: 1,
        paddingBottom: 20,
    },
    section: {
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    sectionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    themeSwitcherContainer: {
        marginTop: 6,
    },
    settingLabel: {
        fontSize: 16,
    },
    settingButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    settingIcon: {
        marginRight: 12,
    },
    settingButtonText: {
        fontSize: 16,
        flex: 1,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
    },
    toggleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    infoLabel: {
        fontSize: 16,
    },
    infoValue: {
        fontSize: 16,
    },
    infoButton: {
        paddingVertical: 10,
    },
    infoButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
});

export default SettingsScreen;