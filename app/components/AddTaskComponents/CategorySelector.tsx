import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { COLORS, SIZES } from '../../theme';
import FormSection from './FormSection';
import { Ionicons } from '@expo/vector-icons';

interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
}

interface CategorySelectorProps {
    selectedCategory: string;
    onSelectCategory: (categoryId: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
                                                               selectedCategory,
                                                               onSelectCategory
                                                           }) => {
    // Sample category data - in a real app, you might fetch this from a service
    const categories: Category[] = [
        { id: 'personal', name: 'Personal', icon: 'person-outline', color: '#3498db' },
        { id: 'work', name: 'Work', icon: 'briefcase-outline', color: '#e74c3c' },
        { id: 'shopping', name: 'Shopping', icon: 'cart-outline', color: '#27ae60' },
        { id: 'health', name: 'Health', icon: 'fitness-outline', color: '#9b59b6' },
        { id: 'education', name: 'Education', icon: 'school-outline', color: '#f39c12' }
    ];

    return (
        <FormSection title="Category">
            <FlatList
                data={categories}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.categoryItem,
                            selectedCategory === item.id && styles.selectedCategory,
                            { borderColor: selectedCategory === item.id ? item.color : COLORS.border }
                        ]}
                        onPress={() => onSelectCategory(item.id)}
                    >
                        <View
                            style={[
                                styles.iconContainer,
                                { backgroundColor: item.color + '20' }
                            ]}
                        >
                            <Ionicons name={item.icon as any} size={22} color={item.color} />
                        </View>
                        <Text style={styles.categoryName}>{item.name}</Text>

                        {selectedCategory === item.id && (
                            <View style={[styles.checkmark, { backgroundColor: item.color }]}>
                                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                            </View>
                        )}
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.categoriesList}
            />
        </FormSection>
    );
};

const styles = StyleSheet.create({
    categoriesList: {
        paddingVertical: SIZES.small / 2,
    },
    categoryItem: {
        width: 100,
        height: 90,
        borderRadius: SIZES.base,
        borderWidth: 1,
        marginRight: SIZES.small,
        padding: SIZES.small,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.card,
    },
    selectedCategory: {
        backgroundColor: COLORS.card,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SIZES.small / 2,
    },
    categoryName: {
        color: COLORS.text,
        fontSize: SIZES.font - 2,
        textAlign: 'center',
    },
    checkmark: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default CategorySelector;