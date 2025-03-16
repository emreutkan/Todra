import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { COLORS } from '../../theme';

type EmptyStateType = 'loading' | 'no-data' | 'error';

interface EmptyStateProps {
    type: EmptyStateType;
    message: string;
    imageSource?: any;  // Optional image to display
}

const EmptyState: React.FC<EmptyStateProps> = ({ type, message, imageSource }) => {
    return (
        <View style={styles.container}>
            {type === 'loading' ? (
                <ActivityIndicator size="large" color={COLORS.primary} />
            ) : imageSource ? (
                <Image
                    source={imageSource}
                    style={styles.image}
                    resizeMode="contain"
                />
            ) : (
                <View style={styles.iconContainer}>
                    {type === 'no-data' && (
                        <Text style={styles.emoji}>📝</Text>
                    )}
                    {type === 'error' && (
                        <Text style={styles.emoji}>⚠️</Text>
                    )}
                </View>
            )}
            <Text style={styles.message}>{message}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    iconContainer: {
        marginBottom: 16,
    },
    emoji: {
        fontSize: 50,
    },
    image: {
        width: 120,
        height: 120,
        marginBottom: 16,
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        color: '#707070',
        marginTop: 16,
    },
});

export default EmptyState;