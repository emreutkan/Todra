import React from 'react';
import {StyleSheet, TextInput, View} from 'react-native';
import {SIZES } from '../../theme';
import FormSection from './FormSection';
import {useTheme} from "../../context/ThemeContext";

interface TaskDescriptionProps {
    value: string;
    onChangeText: (text: string) => void;
}

const TaskDescription: React.FC<TaskDescriptionProps> = ({ value, onChangeText }) => {

    const { colors } = useTheme();
    const styles = StyleSheet.create({
        textArea: {
            backgroundColor: colors.card,
            borderRadius: SIZES.base,
            padding: SIZES.medium,
            color: colors.text,
            fontSize: SIZES.font,
            minHeight: 120,
            borderWidth: 1,
            borderColor: colors.border,
        },
    });
    return (
        <View style={{marginTop: SIZES.large}}>
        <FormSection title="Description (Optional)" >
            <TextInput
                style={styles.textArea}
                value={value}
                onChangeText={onChangeText}
                placeholder="Add details about your task"
                placeholderTextColor={colors.text + '80'}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
            />
        </FormSection>
        </View>
    );
};



export default TaskDescription;