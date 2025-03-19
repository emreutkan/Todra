import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SIZES } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Category } from '../AddTaskComponents/CategorySelector'; // Import the Category type
import { useTheme } from '../../context/ThemeContext';

interface CategoryFilterChipsProps {
    onSelectCategory: (category: string | null) => void;
    selectedCategory: string | null;
}

const CATEGORIES_STORAGE_KEY = 'user_categories';

// Default categories as fallback
const DEFAULT_CATEGORIES: Category[] = [
    { id: 'personal', name: 'Personal', icon: 'person-outline', color: '#3498db', isDefault: true },
    { id: 'work', name: 'Work', icon: 'briefcase-outline', color: '#e74c3c', isDefault: true },
    { id: 'shopping', name: 'Shopping', icon: 'cart-outline', color: '#27ae60', isDefault: true },
    { id: 'health', name: 'Health', icon: 'fitness-outline', color: '#9b59b6', isDefault: true },
    { id: 'education', name: 'Education', icon: 'school-outline', color: '#f39c12', isDefault: true }
];

const CategoryFilterChips: React.FC<CategoryFilterChipsProps> = ({
                                                                     onSelectCategory,
                                                                     selectedCategory
                                                                 }) => {
    const { colors } = useTheme();
    const [categories, setCategories] = useState<Category[]>([]);

    // Load categories from storage when component mounts
    useEffect(() => {
        loadCategories();
    }, []);

    // Load categories when the component is focused
    useEffect(() => {
        // Listen for when the app comes back to the foreground
        const intervalId = setInterval(() => {
            loadCategories();
        }, 2000); // Check for updates every 2 seconds

        return () => clearInterval(intervalId);
    }, []);

    // Load categories from AsyncStorage
    const loadCategories = async () => {
        try {
            const storedCategories = await AsyncStorage.getItem(CATEGORIES_STORAGE_KEY);

            if (storedCategories) {
                setCategories(JSON.parse(storedCategories));
            } else {
                setCategories(DEFAULT_CATEGORIES);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            setCategories(DEFAULT_CATEGORIES);
        }
    };

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
                    {
                        backgroundColor: colors.card,
                        borderColor: colors.border
                    },
                    selectedCategory === null && [
                        styles.selectedChip,
                        { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]
                ]}
                onPress={() => onSelectCategory(null)}
                accessible={true}
                accessibilityLabel="All categories"
                accessibilityRole="button"
                accessibilityState={{ selected: selectedCategory === null }}
            >
                <Ionicons
                    name="apps-outline"
                    size={16}
                    color={selectedCategory === null ? colors.onPrimary : colors.text}
                />
                <Text
                    style={[
                        styles.chipText,
                        { color: colors.text },
                        selectedCategory === null && { color: colors.onPrimary }
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
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border
                        },
                        selectedCategory === category.id && [
                            styles.selectedChip,
                            { backgroundColor: category.color, borderColor: category.color }
                        ]
                    ]}
                    onPress={() => onSelectCategory(category.id)}
                    accessible={true}
                    accessibilityLabel={`${category.name} category`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedCategory === category.id }}
                >
                    <Ionicons
                        name={category.icon as any}
                        size={16}
                        color={selectedCategory === category.id ? colors.background : category.color}
                    />
                    <Text
                        style={[
                            styles.chipText,
                            { color: selectedCategory === category.id ? colors.background : colors.text }
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
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
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        maxWidth: 130, // Limit the width to prevent very long category names
    },
    selectedChip: {
        // Colors applied inline with theme
    },
    chipText: {
        marginLeft: 5,
        fontWeight: '500',
        fontSize: SIZES.font - 2,
        flexShrink: 1, // Allow the text to shrink if needed
    }
});

export default CategoryFilterChips;