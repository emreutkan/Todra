import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { COLORS, SIZES } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import CategoryFilterChips from './CategoryFilterChips';

interface HeaderProps {
    fadeAnim: Animated.Value;
    onFilterTypeChange: () => void;
    filterType: 'createdAt' | 'dueDate';
    onCategoryFilterChange: (category: string | null) => void;
    activeCategory: string | null;
}

const Header: React.FC<HeaderProps> = ({
                                           fadeAnim,
                                           onFilterTypeChange,
                                           filterType,
                                           onCategoryFilterChange,
                                           activeCategory
                                       }) => {
    const greetingMessage = React.useMemo(() => {
        const currentHour = new Date().getHours();
        if (currentHour < 12) {
            return 'Good Morning';
        } else if (currentHour < 18) {
            return 'Good Afternoon';
        } else {
            return 'Good Evening';
        }
    }, []);

    return (
        <Animated.View
            style={[
                styles.header,
                { opacity: fadeAnim }
            ]}
        >
            <View style={styles.headerTop}>
                <View>
                    <Text style={styles.greeting}>{greetingMessage}</Text>
                    <Text style={styles.title}>Your Tasks</Text>
                </View>

                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={onFilterTypeChange}
                >
                    <Ionicons
                        name={filterType === 'dueDate' ? 'calendar' : 'create'}
                        size={22}
                        color={COLORS.primary}
                    />
                    <Text style={styles.filterText}>
                        {filterType === 'dueDate' ? 'Due Date' : 'Created Date'}
                    </Text>
                </TouchableOpacity>
            </View>

            <CategoryFilterChips
                onSelectCategory={onCategoryFilterChange}
                selectedCategory={activeCategory}
            />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    greeting: {
        fontSize: SIZES.medium,
        color: COLORS.text + 'CC',
        marginBottom: 5,
    },
    title: {
        fontSize: SIZES.extraLarge,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    filterText: {
        marginLeft: 6,
        color: COLORS.primary,
        fontWeight: '500',
    }
});

export default Header;