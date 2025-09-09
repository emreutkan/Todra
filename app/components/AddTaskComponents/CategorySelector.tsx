import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Category } from "../../constants/CategoryConstants";
import { useTheme } from "../../context/ThemeContext";
import { useCategories } from "../../hooks/useCategories";
import { useCategoryModal } from "../../hooks/useCategoryModal";
import FormSection from "./FormSection";

interface CategorySelectorProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const { colors } = useTheme();

  const {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    canEditCategory,
    canDeleteCategory,
    availableIcons,
    availableColors,
  } = useCategories();

  const {
    isModalVisible,
    isEditMode,
    editingCategory,
    newCategoryName,
    setNewCategoryName,
    selectedIcon,
    setSelectedIcon,
    selectedColor,
    setSelectedColor,
    isConfirmDeleteModalVisible,
    categoryToDelete,
    openAddModal,
    openEditModal,
    closeModal,
    openDeleteConfirmation,
    closeDeleteConfirmation,
    getFormData,
  } = useCategoryModal();

  const handleAddCategory = async () => {
    const formData = getFormData();
    const success = await addCategory(formData);

    if (success) {
      // Find the newly created category and select it
      const newCategory = categories.find(
        (cat) =>
          cat.name === formData.name &&
          cat.icon === formData.icon &&
          cat.color === formData.color
      );
      if (newCategory) {
        onSelectCategory(newCategory.id);
      }
      closeModal();
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    const formData = getFormData();
    const success = await updateCategory(editingCategory.id, formData);

    if (success) {
      closeModal();
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    // If this was the selected category, select the first available one
    if (selectedCategory === categoryToDelete.id) {
      const firstAvailableCategory = categories.find(
        (c) => c.id !== categoryToDelete.id
      );
      if (firstAvailableCategory) {
        onSelectCategory(firstAvailableCategory.id);
      }
    }

    await deleteCategory(categoryToDelete.id);
    closeDeleteConfirmation();
  };

  const handleCategoryLongPress = (category: Category) => {
    if (!canEditCategory(category) && !canDeleteCategory(category)) {
      return;
    }

    const options = [];

    if (canEditCategory(category)) {
      options.push({ text: "Edit", onPress: () => openEditModal(category) });
    }

    if (canDeleteCategory(category)) {
      options.push({
        text: "Delete",
        style: "destructive" as const,
        onPress: () => openDeleteConfirmation(category),
      });
    }

    if (options.length > 0) {
      Alert.alert(
        "Category Options",
        `What would you like to do with "${category.name}"?`,
        [{ text: "Cancel", style: "cancel" }, ...options]
      );
    }
  };

  if (loading) {
    return (
      <FormSection title="Category">
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading categories...
          </Text>
        </View>
      </FormSection>
    );
  }

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
                backgroundColor:
                  selectedCategory === item.id
                    ? item.color + "15"
                    : colors.card,
                borderColor:
                  selectedCategory === item.id ? item.color : colors.border,
              },
            ]}
            onPress={() => onSelectCategory(item.id)}
            onLongPress={() => handleCategoryLongPress(item)}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: item.color + "20" },
              ]}>
              <Ionicons name={item.icon as any} size={22} color={item.color} />
            </View>
            <Text
              style={[
                styles.categoryName,
                {
                  color:
                    selectedCategory === item.id ? item.color : colors.text,
                },
              ]}
              numberOfLines={1}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          <TouchableOpacity
            style={[
              styles.addCategoryButton,
              {
                backgroundColor: colors.background,
                borderColor: colors.primary + "40",
              },
            ]}
            onPress={openAddModal}>
            <View
              style={[
                styles.addIconContainer,
                { backgroundColor: colors.primary + "15" },
              ]}>
              <Ionicons name="add" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.addCategoryText, { color: colors.primary }]}>
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
        onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}>
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: colors.border },
              ]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isEditMode ? "Edit Category" : "Add New Category"}
              </Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
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
                    color: colors.text,
                  },
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
                data={availableIcons}
                keyExtractor={(item) => item}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.iconList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.iconOption,
                      {
                        backgroundColor:
                          selectedIcon === item
                            ? selectedColor + "20"
                            : colors.card,
                        borderColor:
                          selectedIcon === item ? selectedColor : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedIcon(item)}>
                    <Ionicons
                      name={item as any}
                      size={22}
                      color={
                        selectedIcon === item ? selectedColor : colors.text
                      }
                    />
                  </TouchableOpacity>
                )}
              />

              {/* Color Selection */}
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Select Color
              </Text>
              <View style={styles.colorList}>
                {availableColors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.selectedColorOption,
                    ]}
                    onPress={() => setSelectedColor(color)}>
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
              <View
                style={[
                  styles.previewContainer,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}>
                <View
                  style={[
                    styles.previewCategory,
                    {
                      backgroundColor: selectedColor + "15",
                      borderColor: selectedColor,
                    },
                  ]}>
                  <View
                    style={[
                      styles.previewIcon,
                      { backgroundColor: selectedColor + "20" },
                    ]}>
                    <Ionicons
                      name={selectedIcon as any}
                      size={24}
                      color={selectedColor}
                    />
                  </View>
                  <Text style={[styles.previewName, { color: selectedColor }]}>
                    {newCategoryName || "Category Name"}
                  </Text>
                </View>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.primary },
                  !newCategoryName.trim() && { opacity: 0.6 },
                ]}
                onPress={isEditMode ? handleUpdateCategory : handleAddCategory}
                disabled={!newCategoryName.trim()}>
                <Text style={styles.actionButtonText}>
                  {isEditMode ? "Update Category" : "Add Category"}
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
        onRequestClose={closeDeleteConfirmation}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.confirmContainer,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
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

            <Text
              style={[styles.confirmSubtext, { color: colors.textSecondary }]}>
              Tasks in this category will not be deleted, but they will be moved
              to the default category.
            </Text>

            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  styles.cancelButton,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={closeDeleteConfirmation}>
                <Text style={[styles.cancelText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  styles.deleteButton,
                  { backgroundColor: colors.error },
                ]}
                onPress={handleDeleteCategory}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </FormSection>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  categoryList: {
    paddingVertical: 8,
    paddingRight: 8,
  },
  categoryItem: {
    width: 100,
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    position: "relative",
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  addCategoryButton: {
    width: 100,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  addIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  addCategoryText: {
    fontSize: 14,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    maxHeight: "80%",
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
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
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 1,
  },
  colorList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedColorOption: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  previewContainer: {
    alignItems: "center",
    marginBottom: 24,
    paddingVertical: 20,
    borderWidth: 1,
    borderRadius: 12,
  },
  previewCategory: {
    width: 110,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1.5,
  },
  previewIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  previewName: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmContainer: {
    width: "90%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
  },
  confirmHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 8,
  },
  confirmText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 12,
  },
  confirmSubtext: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  confirmButton: {
    paddingVertical: 14,
    borderRadius: 12,
    width: "48%",
    alignItems: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  deleteButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  cancelText: {
    fontWeight: "600",
    fontSize: 16,
  },
  deleteText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default CategorySelector;
