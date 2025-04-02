import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

type HeaderProps = {
    fadeAnim: Animated.Value;
    onCategoryFilterChange: (category: string | null) => void;
    activeCategory: string | null;
    onThemeToggle: () => void;
};

const Header: React.FC<HeaderProps> = ({
                                           fadeAnim,

                                           onCategoryFilterChange,
                                           activeCategory,
                                           onThemeToggle,
                                       }) => {
    const { colors } = useTheme();

    return (
        <Animated.View
            style={[
                styles.header,
                {
                    opacity: fadeAnim,
                    backgroundColor: colors.card,
                    borderColor: colors.border
                }
            ]}
        >
            <Text style={[styles.title, { color: colors.text }]}>Task Planner</Text>

            <View style={styles.controls}>

                <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: colors.surface }]}
                    onPress={onThemeToggle}
                >
                    <Ionicons
                        name="color-palette-outline"
                        size={22}
                        color={colors.primary}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.iconButton,
                        {
                            backgroundColor: activeCategory
                                ? colors.primary
                                : colors.surface
                        }
                    ]}
                    onPress={() => onCategoryFilterChange(activeCategory ? null : 'all')}
                >
                    <Ionicons
                        name="apps"
                        size={22}
                        color={activeCategory ? colors.onPrimary : colors.primary}
                    />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 15,

        borderWidth: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
});

export default Header;