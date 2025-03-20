import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

type HeaderProps = {
    fadeAnim: Animated.Value;
    onFilterTypeChange: () => void;
    filterType: 'createdAt' | 'dueDate';
    onCategoryFilterChange: (category: string | null) => void;
    activeCategory: string | null;
    onThemeToggle: () => void; // New prop for theme toggling
};

const Header: React.FC<HeaderProps> = ({
                                           fadeAnim,
                                           onFilterTypeChange,
                                           filterType,
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
                {/* Date filter toggle button */}
                <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: colors.surface }]}
                    onPress={onFilterTypeChange}
                >
                    <Ionicons
                        name={filterType === 'dueDate' ? 'calendar' : 'time'}
                        size={22}
                        color={colors.primary}
                    />
                </TouchableOpacity>

                {/* Theme toggle button */}
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

                {/* Category filter button */}
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
        paddingHorizontal: 20,
        paddingVertical: 15,
        // marginHorizontal: 20,
        // marginBottom: 10,
        // borderRadius: 12,
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