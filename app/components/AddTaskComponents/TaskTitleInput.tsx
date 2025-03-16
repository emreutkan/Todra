import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { COLORS, SIZES } from '../../theme';
import FormSection from './FormSection';

interface TaskTitleInputProps {
    value: string;
    onChangeText: (text: string) => void;
}

const TaskTitleInput: React.FC<TaskTitleInputProps> = ({ value, onChangeText }) => {
    return (
        <FormSection title="Task Name">
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                placeholder="What do you need to do?"
                placeholderTextColor={COLORS.text + '80'}
                autoCapitalize="sentences"
                autoFocus
                returnKeyType="next"
            />
        </FormSection>
    );
};

const styles = StyleSheet.create({
    input: {
        backgroundColor: COLORS.card,
        borderRadius: SIZES.base,
        padding: SIZES.medium,
        color: COLORS.text,
        fontSize: SIZES.medium,
        borderWidth: 1,
        borderColor: COLORS.border,
    }
});

export default TaskTitleInput;