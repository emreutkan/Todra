import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeType } from '../../context/ThemeContext';

type ThemeOption = {
    key: ThemeType;
    label: string;
    icon: string;
};

const ThemeSwitcher: React.FC = () => {
    const { theme, setTheme, colors } = useTheme();

    const themeOptions: ThemeOption[] = [
        {
            key: 'darkOrange',
            label: 'Dark + Orange',
            icon: 'bonfire-outline'
        },
        {
            key: 'darkPurple',
            label: 'Dark + Purple',
            icon: 'color-palette-outline'
        },
        {
            key: 'lightGray',
            label: 'Light + Gray',
            icon: 'sunny-outline'
        }
    ];

    return (
        <View style={styles.themeSelectorContainer}>
            <View style={[styles.segmentedControl, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {themeOptions.map((option, index) => (
                    <TouchableOpacity
                        key={option.key}
                        style={[
                            styles.segmentedOption,
                            {
                                backgroundColor: option.key === theme ? colors.primary : 'transparent',
                                borderRightWidth: index < themeOptions.length - 1 ? 1 : 0,
                                borderRightColor: colors.border,
                            }
                        ]}
                        onPress={() => setTheme(option.key)}
                    >
                        <Ionicons
                            name={option.icon as any}
                            size={20}
                            color={option.key === theme ? colors.onPrimary : colors.textSecondary}
                            style={styles.optionIcon}
                        />
                        <Text
                            style={[
                                styles.optionText,
                                { color: option.key === theme ? colors.onPrimary : colors.text }
                            ]}
                        >
                            {option.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    themeSelectorContainer: {
        width: '100%',
    },
    segmentedControl: {
        flexDirection: 'row',
        borderRadius: 8,
        borderWidth: 1,
        overflow: 'hidden',
    },
    segmentedOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    optionIcon: {
        marginRight: 6,
    },
    optionText: {
        fontSize: 12,
        fontWeight: '500',
    }
});

export default ThemeSwitcher;