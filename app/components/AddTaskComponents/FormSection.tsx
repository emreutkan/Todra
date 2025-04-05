import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SIZES } from '../../theme';
import { useTheme } from "../../context/ThemeContext";

interface FormSectionProps {
    title: string;
    children: React.ReactNode;
    optional?: boolean;
    subtitle?: string;
}

const FormSection: React.FC<FormSectionProps> = ({
                                                     title,
                                                     children,
                                                     optional = false,
                                                     subtitle
                                                 }) => {
    const { colors } = useTheme();

    const styles = StyleSheet.create({
        formGroup: {
            marginBottom: SIZES.extraLarge,
            backgroundColor: colors.background,
            borderRadius: 12,
        },
        labelContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: SIZES.small,
        },
        labelContent: {
            flex: 1,
        },
        label: {
            color: colors.text,
            fontSize: SIZES.medium,
            fontWeight: '700',
        },
        subtitle: {
            color: colors.textSecondary,
            fontSize: SIZES.font - 1,
            marginTop: 2,
        },
        optionalText: {
            color: colors.textSecondary,
            fontSize: SIZES.font - 2,
            marginLeft: SIZES.small,
            fontStyle: 'italic',
        },
        content: {
            width: '100%',
        }
    });

    return (
        <View style={styles.formGroup}>
            <View style={styles.labelContainer}>
                <View style={styles.labelContent}>
                    <Text style={styles.label}>{title}</Text>
                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>
                {optional && (
                    <Text style={styles.optionalText}>Optional</Text>
                )}
            </View>
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

export default FormSection;