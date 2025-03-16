import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { COLORS, SIZES } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

interface ActionFooterProps {
    onCancel: () => void;
    onSave: () => void;
    saveEnabled: boolean;
}

const ActionFooter: React.FC<ActionFooterProps> = ({
                                                       onCancel,
                                                       onSave,
                                                       saveEnabled
                                                   }) => {
    return (
        <View style={styles.footer}>
            <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
                activeOpacity={0.7}
            >
                <Ionicons name="close-circle-outline" size={20} color={COLORS.primary} />
                <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.saveButton,
                    !saveEnabled && styles.saveButtonDisabled
                ]}
                onPress={onSave}
                disabled={!saveEnabled}
                activeOpacity={0.7}
            >
                <Text style={styles.saveButtonText}>Save Task</Text>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.background} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    footer: {
        flexDirection: 'row',
        padding: SIZES.medium,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: Platform.OS === 'ios' ? COLORS.card : COLORS.background,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SIZES.medium,
        paddingHorizontal: SIZES.large,
        borderRadius: SIZES.base,
        borderWidth: 1,
        borderColor: COLORS.primary,
        marginRight: SIZES.small,
    },
    saveButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: SIZES.medium,
        paddingHorizontal: SIZES.large,
        borderRadius: SIZES.base,
    },
    saveButtonDisabled: {
        backgroundColor: COLORS.primary + '80',
    },
    cancelButtonText: {
        color: COLORS.primary,
        fontWeight: '600',
        marginLeft: SIZES.small / 2,
    },
    saveButtonText: {
        color: COLORS.background,
        fontWeight: '600',
        marginRight: SIZES.small / 2,
    },
});

export default ActionFooter;