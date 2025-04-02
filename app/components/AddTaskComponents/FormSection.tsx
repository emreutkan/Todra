import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SIZES } from '../../theme';
import {useTheme} from "../../context/ThemeContext";

interface FormSectionProps {
    title: string;
    children: React.ReactNode;
    optional?: boolean;
}

const FormSection: React.FC<FormSectionProps> = ({
                                                     title,
                                                     children,
                                                     optional = false
                                                 }) => {

    const { colors } = useTheme();
    const styles = StyleSheet.create({
        formGroup: {
            marginBottom: SIZES.large,
        },
        labelContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: SIZES.small,
        },
        label: {
            color: colors.text,
            fontSize: SIZES.medium,
            fontWeight: '600',
        },
        optionalText: {
            color: colors.text + '80',
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
                <Text style={styles.label}>{title}</Text>
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