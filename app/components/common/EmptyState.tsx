import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SIZES } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
    type: 'loading' | 'no-data' | 'error';
    message: string;
    iconName?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
                                                   type,
                                                   message,
                                                   iconName
                                               }) => {
    return (
        <View style={styles.container}>
            {type === 'loading' ? (
                <ActivityIndicator size="large" color={COLORS.primary} />
            ) : (
                <View style={styles.iconContainer}>
                    <Ionicons
                        name={
                            iconName ||
                            (type === 'error' ? 'alert-circle' : 'calendar-clear-outline')
                        }
                        size={50}
                        color={COLORS.primary + '80'}
                    />
                </View>
            )}

            <Text style={styles.message}>{message}</Text>

            {type === 'no-data' && (
                <Text style={styles.subMessage}>
                    Tap the + button to create a task
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
        backgroundColor: COLORS.card,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    message: {
        fontSize: SIZES.medium,
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    subMessage: {
        fontSize: SIZES.font,
        color: COLORS.text + '90',
        textAlign: 'center',
    }
});

export default EmptyState;