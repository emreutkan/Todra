import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    ScrollView,
    FlatList,
    Alert
} from 'react-native';
import { SIZES } from '../../theme';
import FormSection from './FormSection';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';

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
const AVAILABLE_COLORS = [
    '#3498db', '#e74c3c', '#27ae60', '#9b59b6', '#f39c12',
    '#1abc9c', '#e67e22', '#2980b9', '#8e44ad', '#d35400',
    '#16a085', '#c0392b', '#2c3e50', '#f1c40f', '#7f8c8d'
];

const CategorySelector: React.FC<CategorySelectorProps> = ({
                                                               selectedCategory,
                                                               onSelectCategory
                                                           }) => {
    const { colors } = useTheme();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState(AVAILABLE_ICONS[0]);
    const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0]);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [isConfirmDeleteModalVisible, setIsConfirmDeleteModalVisible] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

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

    // Handle adding a new category
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
        setSelectedColor(AVAILABLE_COLORS[0]);
        setIsEditMode(false);
        setEditingCategory(null);
    };

    return (
        <FormSection title="Category">
            <FlatList
                horizontal
                data={categories}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryList}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.categoryItem,
                            {
                                backgroundColor: selectedCategory === item.id ?
                                    item.color + '15' : colors.card,
                                borderColor: selectedCategory === item.id ?
                                    item.color : colors.border
                            }
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
                        <View style={[
                            styles.iconContainer,
                            { backgroundColor: item.color + '20' }
                        ]}>
                            <Ionicons name={item.icon as any} size={22} color={item.color} />
                        </View>
                        <Text
                            style={[
                                styles.categoryName,
                                {
                                    color: selectedCategory === item.id ?
                                        item.color : colors.text
                                }
                            ]}
                            numberOfLines={1}
                        >
                            {item.name}
                        </Text>

                        {selectedCategory === item.id && (
                            <View style={[
                                styles.checkmark,
                                { backgroundColor: item.color }
                            ]}>
                                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                            </View>
                        )}
                    </TouchableOpacity>
                )}
                ListFooterComponent={
                    <TouchableOpacity
                        style={[
                            styles.addCategoryButton,
                            {
                                backgroundColor: colors.background,
                                borderColor: colors.primary + '40'
                            }
                        ]}
                        onPress={() => {
                            resetModalFields();
                            setIsModalVisible(true);
                        }}
                    >
                        <View style={[
                            styles.addIconContainer,
                            { backgroundColor: colors.primary + '15' }
                        ]}>
                            <Ionicons name="add" size={24} color={colors.primary} />
                        </View>
                        <Text style={[
                            styles.addCategoryText,
                            { color: colors.primary }
                        ]}>
                            Add New
                        </Text>
                    </TouchableOpacity>
                }
            />

            {/* Add/Edit Category Modal */}
            <Modal
                visible={isModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[
                        styles.modalContainer,
                        {
                            backgroundColor: colors.background,
                            borderColor: colors.border
                        }
                    ]}>
                        <View style={[
                            styles.modalHeader,
                            { borderBottomColor: colors.border }
                        ]}>
                            <Text style={[
                                styles.modalTitle,
                                { color: colors.text }
                            ]}>
                                {isEditMode ? 'Edit Category' : 'Add New Category'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setIsModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent}>
                            {/* Category Name Input */}
                            <Text style={[styles.inputLabel, { color: colors.text }]}>
                                Category Name
                            </Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: colors.card,
                                        borderColor: colors.border,
                                        color: colors.text
                                    }
                                ]}
                                value={newCategoryName}
                                onChangeText={setNewCategoryName}
                                placeholder="Enter category name"
                                placeholderTextColor={colors.textSecondary}
                                maxLength={20}
                            />

                            {/* Icon Selection */}
                            <Text style={[styles.inputLabel, { color: colors.text }]}>
                                Select Icon
                            </Text>
                            <FlatList
                                horizontal
                                data={AVAILABLE_ICONS}
                                keyExtractor={(item) => item}
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.iconList}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.iconOption,
                                            {
                                                backgroundColor: selectedIcon === item ?
                                                    selectedColor + '20' : colors.card,
                                                borderColor: selectedIcon === item ?
                                                    selectedColor : colors.border
                                            }
                                        ]}
                                        onPress={() => setSelectedIcon(item)}
                                    >
                                        <Ionicons
                                            name={item as any}
                                            size={22}
                                            color={selectedIcon === item ? selectedColor : colors.text}
                                        />
                                    </TouchableOpacity>
                                )}
                            />

                            {/* Color Selection */}
                            <Text style={[styles.inputLabel, { color: colors.text }]}>
                                Select Color
                            </Text>
                            <View style={styles.colorList}>
                                {AVAILABLE_COLORS.map((color) => (
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
                            <Text style={[styles.inputLabel, { color: colors.text }]}>
                                Preview
                            </Text>
                            <View style={[
                                styles.previewContainer,
                                {
                                    backgroundColor: colors.card,
                                    borderColor: colors.border
                                }
                            ]}>
                                <View style={[
                                    styles.previewCategory,
                                    {
                                        backgroundColor: selectedColor + '15',
                                        borderColor: selectedColor
                                    }
                                ]}>
                                    <View style={[
                                        styles.previewIcon,
                                        { backgroundColor: selectedColor + '20' }
                                    ]}>
                                        <Ionicons name={selectedIcon as any} size={24} color={selectedColor} />
                                    </View>
                                    <Text style={[
                                        styles.previewName,
                                        { color: selectedColor }
                                    ]}>
                                        {newCategoryName || 'Category Name'}
                                    </Text>
                                </View>
                            </View>

                            {/* Action Button */}
                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    { backgroundColor: colors.primary },
                                    !newCategoryName.trim() && { opacity: 0.6 }
                                ]}
                                onPress={isEditMode ? handleUpdateCategory : handleAddCategory}
                                disabled={!newCategoryName.trim()}
                            >
                                <Text style={styles.actionButtonText}>
                                    {isEditMode ? 'Update Category' : 'Add Category'}
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
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
                    <View style={[
                        styles.confirmContainer,
                        {
                            backgroundColor: colors.background,
                            borderColor: colors.border
                        }
                    ]}>
                        <View style={styles.confirmHeader}>
                            <Ionicons name="warning" size={40} color={colors.error} />
                            <Text style={[styles.confirmTitle, { color: colors.text }]}>
                                Delete Category
                            </Text>
                        </View>

                        <Text style={[styles.confirmText, { color: colors.text }]}>
                            Are you sure you want to delete "{categoryToDelete?.name}"?
                        </Text>

                        <Text style={[styles.confirmSubtext, { color: colors.textSecondary }]}>
                            Tasks in this category will not be deleted, but they will be moved to the default category.
                        </Text>

                        <View style={styles.confirmButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.confirmButton,
                                    styles.cancelButton,
                                    {
                                        backgroundColor: colors.card,
                                        borderColor: colors.border
                                    }
                                ]}
                                onPress={() => {
                                    setIsConfirmDeleteModalVisible(false);
                                    setCategoryToDelete(null);
                                }}
                            >
                                <Text style={[styles.cancelText, { color: colors.text }]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.confirmButton,
                                    styles.deleteButton,
                                    { backgroundColor: colors.error }
                                ]}
                                onPress={handleDeleteCategory}
                            >
                                <Text style={styles.deleteText}>
                                    Delete
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </FormSection>
    );
};

const styles = StyleSheet.create({
    categoryList: {
        paddingVertical: 8,
        paddingRight: 8,
    },
    categoryItem: {
        width: 100,
        padding: 12,
        borderRadius: 12,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        position: 'relative',
    },
    iconContainer: {
        width: 46,
        height: 46,
        borderRadius: 23,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
    checkmark: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addCategoryButton: {
        width: 100,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1.5,
        borderStyle: 'dashed',
    },
    addIconContainer: {
        width: 46,
        height: 46,
        borderRadius: 23,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    addCategoryText: {
        fontSize: 14,
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
        borderRadius: 16,
        overflow: 'hidden',
        maxHeight: '80%',
        borderWidth: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 4,
    },
    modalContent: {
        padding: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 20,
    },
    iconList: {
        paddingVertical: 10,
        marginBottom: 20,
    },
    iconOption: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
        marginRight: 12,
        borderWidth: 1,
    },
    colorList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    colorOption: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        marginBottom: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedColorOption: {
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 4,
    },
    previewContainer: {
        alignItems: 'center',
        marginBottom: 24,
        paddingVertical: 20,
        borderWidth: 1,
        borderRadius: 12,
    },
    previewCategory: {
        width: 110,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1.5,
    },
    previewIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    previewName: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
    actionButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 4,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    confirmContainer: {
        width: '90%',
        borderRadius: 16,
        borderWidth: 1,
        padding: 24,
        alignItems: 'center',
    },
    confirmHeader: {
        alignItems: 'center',
        marginBottom: 16,
    },
    confirmTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 8,
    },
    confirmText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 12,
    },
    confirmSubtext: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    confirmButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    confirmButton: {
        paddingVertical: 14,
        borderRadius: 12,
        width: '48%',
        alignItems: 'center',
    },
    cancelButton: {
        borderWidth: 1,
    },
    deleteButton: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 4,
    },
    cancelText: {
        fontWeight: '600',
        fontSize: 16,
    },
    deleteText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
});

export default CategorySelector;