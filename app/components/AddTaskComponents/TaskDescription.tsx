import React from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { COLORS, SIZES } from '../../theme';
import FormSection from './FormSection';

interface TaskDescriptionProps {
    value: string;
    onChangeText: (text: string) => void;
}

const TaskDescription: React.FC<TaskDescriptionProps> = ({ value, onChangeText }) => {
    return (
        <FormSection title="Description (Optional)">
            <TextInput
                style={styles.textArea}
                value={value}
                onChangeText={onChangeText}
                placeholder="Add details about your task"
                placeholderTextColor={COLORS.text + '80'}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
            />
        </FormSection>
    );
};

const styles = StyleSheet.create({
    textArea: {
        backgroundColor: COLORS.card,
        borderRadius: SIZES.base,
        padding: SIZES.medium,
        color: COLORS.text,
        fontSize: SIZES.font,
        minHeight: 120,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
});

export default TaskDescription;