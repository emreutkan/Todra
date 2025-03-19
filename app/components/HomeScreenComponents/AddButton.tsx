import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface AddButtonProps {
    onPress: () => void;
    label?: string;
    showShadow?: boolean;
}

const AddButton: React.FC<AddButtonProps> = ({
                                                 onPress,
                                                 label = "Add New Task",
                                                 showShadow = true
                                             }) => {
    const { colors, theme } = useTheme();

    // Define gradient colors based on the theme
    const gradientColors = theme === 'orange'
        ? [colors.primary, '#FF6B00']
        : theme === 'purple'
            ? [colors.primary, '#8E44AD']
            : [colors.primary, colors.primary + 'CC'];

    return (
        <View style={[
            styles.container,
            showShadow && [styles.shadow, { shadowColor: colors.primary }]
        ]}>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={onPress}
                accessibilityLabel={label}
                accessibilityRole="button"
                style={styles.buttonWrapper}
            >
                <LinearGradient
                    colors={gradientColors}
                    style={styles.gradientButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Ionicons name="add" size={24} color={colors.onPrimary} />
                    <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
                        {label}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        paddingTop: 10,
        backgroundColor: 'transparent',
        zIndex: 100,
    },
    shadow: {
        ...Platform.select({
            ios: {
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 10,
            }
        }),
    },
    buttonWrapper: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        width: '100%',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    }
});

export default AddButton;