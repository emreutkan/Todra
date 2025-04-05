import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TaskPriority } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { SIZES, PRIORITY_COLORS } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

interface PriorityIndicatorProps {
    priority: TaskPriority;
    size?: 'small' | 'medium' | 'large';
    showLabel?: boolean;
    style?: any;
}

const PriorityIndicator: React.FC<PriorityIndicatorProps> = ({
                                                                 priority,
                                                                 size = 'medium',
                                                                 showLabel = false,
                                                                 style
                                                             }) => {
    const { colors } = useTheme();

    const getIconName = () => {
        switch (priority) {
            case 'high':
                return 'alert-circle';
            case 'normal':
                return 'radio-button-on';
            case 'low':
                return 'remove-circle';
            default:
                return 'radio-button-on';
        }
    };

    const getSize = () => {
        switch (size) {
            case 'small': return 16;
            case 'large': return 24;
            default: return 20;
        }
    };

    const getLabel = () => {
        switch (priority) {
            case 'high':
                return 'High Priority';
            case 'normal':
                return 'Normal Priority';
            case 'low':
                return 'Low Priority';
            default:
                return 'Normal Priority';
        }
    };

    const styles = StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        label: {
            marginLeft: 4,
            fontSize: size === 'small' ? SIZES.small : SIZES.font,
            fontWeight: '600',
            color: PRIORITY_COLORS[priority],
        }
    });

    return (
        <View style={[styles.container, style]}>
            <Ionicons
                name={getIconName()}
                size={getSize()}
                color={PRIORITY_COLORS[priority]}
            />
            {showLabel && (
                <Text style={styles.label}>{getLabel()}</Text>
            )}
        </View>
    );
};

export default PriorityIndicator;