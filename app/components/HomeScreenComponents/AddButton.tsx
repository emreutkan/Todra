import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../theme';

interface AddButtonProps {
    onPress: () => void;
    size?: number;
    label?: string;
    showShadow?: boolean;
}

const AddButton: React.FC<AddButtonProps> = ({
                                                 onPress,
                                                 size = 60,
                                                 label,
                                                 showShadow = true
                                             }) => {
    return (
        <TouchableOpacity
            style={[
                styles.addButton,
                { width: size, height: size, borderRadius: size / 2 },
                showShadow && styles.shadow
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <LinearGradient
                colors={[COLORS.primary, '#FF6B00']}
                style={[
                    styles.addButtonGradient,
                    { borderRadius: size / 2 }
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Text style={styles.addButtonText}>+</Text>
            </LinearGradient>

            {label && (
                <View style={styles.labelContainer}>
                    <Text style={styles.labelText}>{label}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    addButton: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        zIndex: 100,
    },
    shadow: {
        ...Platform.select({
            ios: {
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.5,
                shadowRadius: 8,
            },
            android: {
                elevation: 10,
            }
        }),
    },
    addButtonGradient: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonText: {
        color: COLORS.background,
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: -2, // Small adjustment to vertically center the plus sign
    },
    labelContainer: {
        position: 'absolute',
        top: -30,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
    },
    labelText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    }
});

export default AddButton;