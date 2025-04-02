import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    ScrollView
} from 'react-native';
import { SIZES } from '../../theme';
import FormSection from './FormSection';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTheme} from "../../context/ThemeContext";

// Define a Category type
export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    isDefault?: boolean;
}

interface CategorySelectorProps {
    selectedCategory: string;
    onSelectCategory: (categoryId: string) => void;
}

const CATEGORIES_STORAGE_KEY = 'user_categories';

// Default categories that come with the app
const DEFAULT_CATEGORIES: Category[] = [
    { id: 'personal', name: 'Personal', icon: 'person-outline', color: '#3498db', isDefault: true },
    { id: 'work', name: 'Work', icon: 'briefcase-outline', color: '#e74c3c', isDefault: true },
    { id: 'shopping', name: 'Shopping', icon: 'cart-outline', color: '#27ae60', isDefault: true },
    { id: 'health', name: 'Health', icon: 'fitness-outline', color: '#9b59b6', isDefault: true },
    { id: 'education', name: 'Education', icon: 'school-outline', color: '#f39c12', isDefault: true }
];

// Available icons for categories
const AVAILABLE_ICONS = [
    'person-outline', 'briefcase-outline', 'cart-outline', 'fitness-outline',
    'school-outline', 'home-outline', 'airplane-outline', 'restaurant-outline',
    'car-outline', 'planet-outline', 'paw-outline', 'game-controller-outline',
    'musical-notes-outline', 'book-outline', 'globe-outline', 'heart-outline',
    'basketball-outline', 'beer-outline', 'bicycle-outline', 'gift-outline'
];

// Available colors for categories
const AVAILABLE_colors = [
    '#3498db', '#e74c3c', '#27ae60', '#9b59b6', '#f39c12',
    '#1abc9c', '#e67e22', '#2980b9', '#8e44ad', '#d35400',
    '#16a085', '#c0392b', '#2c3e50', '#f1c40f', '#7f8c8d'
];

const CategorySelector: React.FC<CategorySelectorProps> = ({
                                                               selectedCategory,
                                                               onSelectCategory
                                                           }) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState(AVAILABLE_ICONS[0]);
    const [selectedColor, setSelectedColor] = useState(AVAILABLE_colors[0]);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [isConfirmDeleteModalVisible, setIsConfirmDeleteModalVisible] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
    const { colors } = useTheme();



    const styles = StyleSheet.create({
        categoriesContainer: {
            paddingVertical: 8,
            paddingRight: 20,
        },
        categoryItem: {
            width: 90,
            padding: 8,
            borderRadius: SIZES.small,
            marginRight: 12,
            alignItems: 'center',
            backgroundColor: colors.card,
            borderWidth: 1,
            position: 'relative',
        },
        selectedCategory: {
            borderWidth: 4,

        },
        iconContainer: {
            width: 46,
            height: 46,
            borderRadius: 23,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 6,
        },
        categoryName: {
            fontSize: SIZES.font - 2,
            color: colors.text,
            textAlign: 'center',
            fontWeight: '500',
        },
        checkmark: {
            position: 'absolute',
            top: -6,
            right: -6,
            width: 18,
            height: 18,
            borderRadius: 9,
            justifyContent: 'center',
            alignItems: 'center',
        },
        addCategoryButton: {
            width: 90,
            padding: 8,
            borderRadius: SIZES.small,
            alignItems: 'center',
            backgroundColor: colors.primary + '10',
            borderWidth: 1,
            borderColor: colors.primary + '30',
            borderStyle: 'dashed',
        },
        addIconContainer: {
            width: 46,
            height: 46,
            borderRadius: 23,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 6,
            backgroundColor: colors.primary + '15',
        },
        addCategoryText: {
            fontSize: SIZES.font - 2,
            color: colors.primary,
            fontWeight: '500',
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        modalContainer: {
            width: '100%',
            backgroundColor: colors.background,
            borderRadius: SIZES.medium,
            overflow: 'hidden',
            maxHeight: '80%',
        },
        modalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 15,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        modalTitle: {
            fontSize: SIZES.large,
            fontWeight: '600',
            color: colors.text,
        },
        closeButton: {
            padding: 4,
        },
        modalContent: {
            padding: 20,
        },    input: {
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: SIZES.base,
            paddingHorizontal: 15,
            paddingVertical: 10,
            fontSize: SIZES.font,
            color: colors.text,
            marginBottom: 20,
        },
        inputLabel: {
            fontSize: SIZES.font,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 8,
        },
        iconSelectorContainer: {
            flexDirection: 'row',
            flexWrap: 'nowrap',
            marginBottom: 20,
            paddingBottom: 5,
        },
        iconOption: {
            width: 44,
            height: 44,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 22,
            marginRight: 10,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
        },
        colorSelectorContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginBottom: 20,
        },
        colorOption: {
            width: 36,
            height: 36,
            borderRadius: 18,
            marginRight: 12,
            marginBottom: 12,
            justifyContent: 'center',
            alignItems: 'center',
        },
        selectedColorOption: {
            borderWidth: 2,
            borderColor: '#ffffff',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 1.5,
            elevation: 2,
        },
        previewContainer: {
            alignItems: 'center',
            marginBottom: 25,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: SIZES.base,
            backgroundColor: colors.background,
        },
        saveButton: {
            backgroundColor: colors.primary,
            paddingVertical: 12,
            borderRadius: SIZES.base,
            alignItems: 'center',
            justifyContent: 'center',
        },
        disabledButton: {
            backgroundColor: colors.primary + '80',
        },
        saveButtonText: {
            color: '#fff',
            fontSize: SIZES.font,
            fontWeight: '600',
        },
        deleteModalContainer: {
            width: '90%',
            backgroundColor: colors.background,
            borderRadius: SIZES.medium,
            padding: 20,
            alignItems: 'center',
        },
        deleteModalHeader: {
            alignItems: 'center',
            marginBottom: 15,
        },
        deleteModalTitle: {
            fontSize: SIZES.large,
            fontWeight: '600',
            color: colors.text,
            marginTop: 10,
        },
        deleteModalText: {
            fontSize: SIZES.font,
            color: colors.text,
            textAlign: 'center',
            marginBottom: 10,
        },
        deleteModalSubtext: {
            fontSize: SIZES.font - 2,
            color: colors.text + '99',
            textAlign: 'center',
            marginBottom: 20,
        },
        deleteModalButtons: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: 10,
        },
        deleteModalButton: {
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: SIZES.base,
            width: '48%',
            alignItems: 'center',
        },
        cancelButton: {
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
        },
        deleteButton: {
            backgroundColor: '#ff6b6b',
        },
        cancelButtonText: {
            color: colors.text,
            fontWeight: '600',
            fontSize: SIZES.font,
        },
        deleteButtonText: {
            color: '#fff',
            fontWeight: '600',
            fontSize: SIZES.font,
        },
    });
    // Load categories when component mounts
    useEffect(() => {
        loadCategories();
    }, []);

    // Load categories from storage or use defaults
    const loadCategories = async () => {
        try {
            const storedCategories = await AsyncStorage.getItem(CATEGORIES_STORAGE_KEY);

            if (storedCategories) {
                setCategories(JSON.parse(storedCategories));
            } else {
                // First time - use default categories
                setCategories(DEFAULT_CATEGORIES);
                await AsyncStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            setCategories(DEFAULT_CATEGORIES);
        }
    };

    // Save categories to storage
    const saveCategories = async (updatedCategories: Category[]) => {
        try {
            await AsyncStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updatedCategories));
            setCategories(updatedCategories);
        } catch (error) {
            console.error('Error saving categories:', error);
            Alert.alert('Error', 'Failed to save categories');
        }
    };

    // Add new category
    const handleAddCategory = () => {
        if (!newCategoryName.trim()) {
            Alert.alert('Error', 'Please enter a category name');
            return;
        }

        // Check if category name already exists
        if (categories.some(cat => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
            Alert.alert('Error', 'A category with this name already exists');
            return;
        }

        const newCategory: Category = {
            id: `custom-${Date.now()}`,
            name: newCategoryName.trim(),
            icon: selectedIcon,
            color: selectedColor
        };

        const updatedCategories = [...categories, newCategory];
        saveCategories(updatedCategories);

        // Select the new category
        onSelectCategory(newCategory.id);

        // Reset and close modal
        resetModalFields();
        setIsModalVisible(false);
    };

    // Update existing category
    const handleUpdateCategory = () => {
        if (!editingCategory) return;

        if (!newCategoryName.trim()) {
            Alert.alert('Error', 'Please enter a category name');
            return;
        }

        // Check if category name already exists (excluding the current category)
        if (categories.some(cat =>
            cat.id !== editingCategory.id &&
            cat.name.toLowerCase() === newCategoryName.trim().toLowerCase()
        )) {
            Alert.alert('Error', 'A category with this name already exists');
            return;
        }

        const updatedCategories = categories.map(cat =>
            cat.id === editingCategory.id
                ? {
                    ...cat,
                    name: newCategoryName.trim(),
                    icon: selectedIcon,
                    color: selectedColor
                }
                : cat
        );

        saveCategories(updatedCategories);

        // Reset and close modal
        resetModalFields();
        setIsModalVisible(false);
    };
    // Delete category
    const handleDeleteCategory = () => {
        if (!categoryToDelete) return;

        // If this was the selected category, select the first available one
        if (selectedCategory === categoryToDelete.id) {
            const firstAvailableCategory = categories.find(c => c.id !== categoryToDelete.id);
            if (firstAvailableCategory) {
                onSelectCategory(firstAvailableCategory.id);
            }
        }

        const updatedCategories = categories.filter(cat => cat.id !== categoryToDelete.id);
        saveCategories(updatedCategories);

        setIsConfirmDeleteModalVisible(false);
        setCategoryToDelete(null);
    };

    // Start editing a category
    const startEditCategory = (category: Category) => {
        if (category.isDefault) {
            Alert.alert('Cannot Edit', 'Default categories cannot be edited');
            return;
        }

        setEditingCategory(category);
        setNewCategoryName(category.name);
        setSelectedIcon(category.icon);
        setSelectedColor(category.color);
        setIsEditMode(true);
        setIsModalVisible(true);
    };

    // Confirm category deletion
    const confirmDeleteCategory = (category: Category) => {
        if (category.isDefault) {
            Alert.alert('Cannot Delete', 'Default categories cannot be deleted');
            return;
        }

        setCategoryToDelete(category);
        setIsConfirmDeleteModalVisible(true);
    };

    // Reset modal fields
    const resetModalFields = () => {
        setNewCategoryName('');
        setSelectedIcon(AVAILABLE_ICONS[0]);
        setSelectedColor(AVAILABLE_colors[0]);
        setIsEditMode(false);
        setEditingCategory(null);
    };

    // Open add category modal
    const openAddCategoryModal = () => {
        resetModalFields();
        setIsModalVisible(true);
    };

    return (
        <FormSection title="Category">
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesContainer}
            >
                {categories.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={[
                            styles.categoryItem,
                            selectedCategory === item.id && styles.selectedCategory,
                            { borderColor: selectedCategory === item.id ? item.color : colors.border }
                        ]}
                        onPress={() => onSelectCategory(item.id)}
                        onLongPress={() => {
                            if (!item.isDefault) {
                                Alert.alert(
                                    'Category Options',
                                    `What would you like to do with "${item.name}"?`,
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        { text: 'Edit', onPress: () => startEditCategory(item) },
                                        { text: 'Delete', style: 'destructive', onPress: () => confirmDeleteCategory(item) }
                                    ]
                                );
                            }
                        }}
                    >
                        <View
                            style={[
                                styles.iconContainer,
                                // { backgroundColor: item.color + '20' }
                            ]}
                        >
                            <Ionicons name={item.icon as any} size={28} color={item.color} />
                        </View>
                        <Text style={styles.categoryName}>{item.name}</Text>

                        {/*{selectedCategory === item.id && (*/}
                        {/*    <View style={[styles.checkmark, { backgroundColor: item.color }]}>*/}
                        {/*        <Ionicons name="checkmark" size={12} color="#FFFFFF" />*/}
                        {/*    </View>*/}
                        {/*)}*/}
                    </TouchableOpacity>
                ))}

                {/* Add Category Button */}
                <TouchableOpacity
                    style={styles.addCategoryButton}
                    onPress={openAddCategoryModal}
                >
                    <View style={styles.addIconContainer}>
                        <Ionicons name="add" size={24} color={colors.primary} />
                    </View>
                    <Text style={styles.addCategoryText}>Add New</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Add/Edit Category Modal */}
            <Modal
                visible={isModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {isEditMode ? 'Edit Category' : 'Add New Category'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setIsModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalContent}>
                            {/* Category Name Input */}
                            <Text style={styles.inputLabel}>Category Name</Text>
                            <TextInput
                                style={styles.input}
                                value={newCategoryName}
                                onChangeText={setNewCategoryName}
                                placeholder="Enter category name"
                                placeholderTextColor={colors.text + '80'}
                                maxLength={20}
                            />

                            {/* Icon Selection */}
                            <Text style={styles.inputLabel}>Select Icon</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.iconSelectorContainer}
                            >
                                {AVAILABLE_ICONS.map((icon) => (
                                    <TouchableOpacity
                                        key={icon}
                                        style={[
                                            styles.iconOption,
                                            selectedIcon === icon && {
                                                backgroundColor: selectedColor + '30',
                                                borderColor: selectedColor
                                            }
                                        ]}
                                        onPress={() => setSelectedIcon(icon)}
                                    >
                                        <Ionicons
                                            name={icon as any}
                                            size={24}
                                            color={selectedIcon === icon ? selectedColor : colors.text}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Color Selection */}
                            <Text style={styles.inputLabel}>Select Color</Text>
                            <View style={styles.colorSelectorContainer}>
                                {AVAILABLE_colors.map((color) => (
                                    <TouchableOpacity
                                        key={color}
                                        style={[
                                            styles.colorOption,
                                            { backgroundColor: color },
                                            selectedColor === color && styles.selectedColorOption
                                        ]}
                                        onPress={() => setSelectedColor(color)}
                                    >
                                        {selectedColor === color && (
                                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Preview */}
                            <Text style={styles.inputLabel}>Preview</Text>
                            <View style={styles.previewContainer}>
                                <View
                                    style={[
                                        styles.categoryItem,
                                        { width: 100, borderColor: selectedColor,  }
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.iconContainer,
                                            { backgroundColor: selectedColor + '20' }
                                        ]}
                                    >
                                        <Ionicons name={selectedIcon as any} size={22} color={selectedColor} />
                                    </View>
                                    <Text style={styles.categoryName} numberOfLines={1} ellipsizeMode="tail">
                                        {newCategoryName || 'Category Name'}
                                    </Text>
                                </View>
                            </View>

                            {/* Action Button */}
                            <TouchableOpacity
                                style={[styles.saveButton, !newCategoryName.trim() && styles.disabledButton]}
                                onPress={isEditMode ? handleUpdateCategory : handleAddCategory}
                                disabled={!newCategoryName.trim()}
                            >
                                <Text style={styles.saveButtonText}>
                                    {isEditMode ? 'Update Category' : 'Add Category'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Confirm Delete Modal */}
            <Modal
                visible={isConfirmDeleteModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsConfirmDeleteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.deleteModalContainer}>
                        <View style={styles.deleteModalHeader}>
                            <Ionicons name="warning" size={40} color="#ff6b6b" />
                            <Text style={styles.deleteModalTitle}>Delete Category</Text>
                        </View>

                        <Text style={styles.deleteModalText}>
                            Are you sure you want to delete "{categoryToDelete?.name}"? This action cannot be undone.
                        </Text>

                        <Text style={styles.deleteModalSubtext}>
                            Tasks in this category will not be deleted, but they will be moved to the default category.
                        </Text>

                        <View style={styles.deleteModalButtons}>
                            <TouchableOpacity
                                style={[styles.deleteModalButton, styles.cancelButton]}
                                onPress={() => {
                                    setIsConfirmDeleteModalVisible(false);
                                    setCategoryToDelete(null);
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.deleteModalButton, styles.deleteButton]}
                                onPress={handleDeleteCategory}
                            >
                                <Text style={styles.deleteButtonText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </FormSection>
    );
};


export default CategorySelector;