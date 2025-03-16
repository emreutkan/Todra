import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

interface CategoryFilterChipsProps {
    onSelectCategory: (category: string | null) => void;
    selectedCategory: string | null;
}

interface CategoryOption {
    id: string;
    name: string;
    icon: string;
    color: string;
}

const CategoryFilterChips: React.FC<CategoryFilterChipsProps> = ({
                                                                     onSelectCategory,
                                                                     selectedCategory
                                                                 }) => {
    // Sample categories - in a real app, these would come from storage or context
    const categories: CategoryOption[] = [
        { id: 'personal', name: 'Personal', icon: 'person-outline', color: '#3498db' },
        { id: 'work', name: 'Work', icon: 'briefcase-outline', color: '#e74c3c' },
        { id: 'shopping', name: 'Shopping', icon: 'cart-outline', color: '#27ae60' },
        { id: 'health', name: 'Health', icon: 'fitness-outline', color: '#9b59b6' },
        { id: 'education', name: 'Education', icon: 'school-outline', color: '#f39c12' }
    ];

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
        >
            {/* "All" filter chip */}
            <TouchableOpacity
                style={[
                    styles.chip,
                    selectedCategory === null && styles.selectedChip
                ]}
                onPress={() => onSelectCategory(null)}
            >
                <Ionicons
                    name="apps-outline"
                    size={16}
                    color={selectedCategory === null ? COLORS.background : COLORS.text}
                />
                <Text
                    style={[
                        styles.chipText,
                        selectedCategory === null && styles.selectedChipText
                    ]}
                >
                    All
                </Text>
            </TouchableOpacity>

            {/* Category filter chips */}
            {categories.map(category => (
                <TouchableOpacity
                    key={category.id}
                    style={[
                        styles.chip,
                        selectedCategory === category.id && styles.selectedChip,
                        selectedCategory === category.id && { backgroundColor: category.color }
                    ]}
                    onPress={() => onSelectCategory(category.id)}
                >
                    <Ionicons
                        name={category.icon as any}
                        size={16}
                        color={selectedCategory === category.id ? COLORS.background : category.color}
                    />
                    <Text
                        style={[
                            styles.chipText,
                            { color: selectedCategory === category.id ? COLORS.background : COLORS.text }
                        ]}
                    >
                        {category.name}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 0,
        flexShrink: 0,
        marginBottom: 10,
    },
    contentContainer: {
        paddingRight: 20,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    selectedChip: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    chipText: {
        color: COLORS.text,
        marginLeft: 5,
        fontWeight: '500',
        fontSize: SIZES.font - 2,
    },
    selectedChipText: {
        color: COLORS.background,
    }
});

export default CategoryFilterChips;