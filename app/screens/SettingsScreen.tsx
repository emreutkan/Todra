import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../types';
import ThemeSwitcher from '../components/common/ThemeSwitcher';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

const SettingsScreen: React.FC = () => {
    const navigation = useNavigation<SettingsScreenNavigationProp>();
    const { colors, isDark } = useTheme();

    const handleBackPress = () => {
        navigation.goBack();
    };

    const handleViewAllTasks = () => {
        navigation.navigate('AllTasks');
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

            <ScrollView style={styles.scrollView}>
                {/* Theme Section */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
                    <View style={styles.sectionContent}>
                        <Text style={[styles.settingLabel, { color: colors.text }]}>Theme</Text>
                        <ThemeSwitcher />
                    </View>
                </View>

                {/* Data Management Section */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Management</Text>
                    <TouchableOpacity
                        style={[styles.settingButton, { backgroundColor: colors.surface }]}
                        onPress={handleViewAllTasks}
                    >
                        <Ionicons name="list-outline" size={24} color={colors.primary} style={styles.settingIcon} />
                        <Text style={[styles.settingButtonText, { color: colors.text }]}>View All Tasks</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.text} />
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
});

export default SettingsScreen;