import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
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
        <View style={[styles.container, { backgroundColor: colors.card }]}>
            <Text style={[styles.title, { color: colors.text }]}>Theme</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.optionsContainer}
            >
                {themeOptions.map((option) => (
                    <TouchableOpacity
                        key={option.key}
                        style={[
                            styles.themeOption,
                            {
                                backgroundColor: option.key === theme
                                    ? colors.primary
                                    : colors.surface,
                                borderColor: colors.border,
                            }
                        ]}
                        onPress={() => setTheme(option.key)}
                    >
                        <Ionicons
                            name={option.icon as any}
                            size={24}
                            color={option.key === theme ? colors.onPrimary : colors.textSecondary}
                        />
                        <Text style={[
                            styles.themeLabel,
                            { color: option.key === theme
                                    ? colors.onPrimary
                                    : colors.text
                            }
                        ]}>
                            {option.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 20,
        marginVertical: 10,
        padding: 15,
        borderRadius: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    optionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    themeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        padding: 8,
        marginRight: 12,
        borderWidth: 1,
    },
    themeLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 8,
    }
});

export default ThemeSwitcher;