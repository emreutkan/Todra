import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SIZES } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import {useTheme} from "../../context/ThemeContext";

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
    const { colors } = useTheme();


    const styles = StyleSheet.create({
        footer: {
            flexDirection: 'row',
            padding: SIZES.medium,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: Platform.OS === 'ios' ? colors.card : colors.background,
        },
        cancelButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: SIZES.medium,
            paddingHorizontal: SIZES.large,
            borderRadius: SIZES.base,
            borderWidth: 1,
            borderColor: colors.primary,
            marginRight: SIZES.small,
        },
        saveButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primary,
            paddingVertical: SIZES.medium,
            paddingHorizontal: SIZES.large,
            borderRadius: SIZES.base,
        },
        saveButtonDisabled: {
            backgroundColor: colors.primary + '80',
        },
        cancelButtonText: {
            color: colors.primary,
            fontWeight: '600',
            marginLeft: SIZES.small / 2,
        },
        saveButtonText: {
            color: colors.background,
            fontWeight: '600',
            marginRight: SIZES.small / 2,
        },
    });

    return (
        <View style={styles.footer}>
            <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
                activeOpacity={0.7}
            >
                <Ionicons name="close-circle-outline" size={20} color={colors.primary} />
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
                <Ionicons name="checkmark-circle" size={20} color={colors.background} />
            </TouchableOpacity>
        </View>
    );

};

export default ActionFooter;