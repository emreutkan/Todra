import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../theme';

interface AddButtonProps {
    onPress: () => void;
}

const AddButton: React.FC<AddButtonProps> = ({ onPress }) => {
    return (
        <TouchableOpacity
            style={styles.addButton}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={[COLORS.primary, '#FF6B00']}
                style={styles.addButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Text style={styles.addButtonText}>+</Text>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    addButton: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 8,
        zIndex: 100,
    },
    addButtonGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonText: {
        color: COLORS.background,
        fontSize: 32,
        fontWeight: 'bold',
    },
});

export default AddButton;