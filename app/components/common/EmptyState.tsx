import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SIZES } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface EmptyStateProps {
    type: 'loading' | 'no-data' | 'error';
    message: string;
    iconName?: string;
    subMessage?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
                                                   type,
                                                   message,
                                                   iconName,
                                                   subMessage
                                               }) => {
    const { colors } = useTheme();

    return (
        <View style={styles.container}>
            {type === 'loading' ? (
                <ActivityIndicator size="large" color={colors.primary} />
            ) : (
                <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
                    <Ionicons
                        name={
                            iconName ||
                            (type === 'error' ? 'alert-circle' : 'calendar-clear-outline')
                        }
                        size={50}
                        color={colors.primary + '80'}
                    />
                </View>
            )}

            <Text style={[styles.message, { color: colors.text }]}>
                {message}
            </Text>

            {(type === 'no-data' || subMessage) && (
                <Text style={[styles.subMessage, { color: colors.textSecondary }]}>
                    {subMessage || "Tap the + button to create a task"}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    message: {
        fontSize: SIZES.medium,
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: 8,
    },
    subMessage: {
        fontSize: SIZES.font,
        textAlign: 'center',
    }
});

export default EmptyState;