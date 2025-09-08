import { useCallback, useState } from "react";
import {
  AVAILABLE_COLORS,
  AVAILABLE_ICONS,
  Category,
} from "../constants/CategoryConstants";

export const useCategoryModal = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(AVAILABLE_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0]);

  // Delete confirmation modal state
  const [isConfirmDeleteModalVisible, setIsConfirmDeleteModalVisible] =
    useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );

  const openAddModal = useCallback(() => {
    resetModalFields();
    setIsEditMode(false);
    setEditingCategory(null);
    setIsModalVisible(true);
  }, []);

  const openEditModal = useCallback((category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setSelectedIcon(category.icon);
    setSelectedColor(category.color);
    setIsEditMode(true);
    setIsModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
    resetModalFields();
  }, []);

  const resetModalFields = useCallback(() => {
    setNewCategoryName("");
    setSelectedIcon(AVAILABLE_ICONS[0]);
    setSelectedColor(AVAILABLE_COLORS[0]);
    setIsEditMode(false);
    setEditingCategory(null);
  }, []);

  const openDeleteConfirmation = useCallback((category: Category) => {
    setCategoryToDelete(category);
    setIsConfirmDeleteModalVisible(true);
  }, []);

  const closeDeleteConfirmation = useCallback(() => {
    setIsConfirmDeleteModalVisible(false);
    setCategoryToDelete(null);
  }, []);

  const getFormData = useCallback(() => {
    return {
      name: newCategoryName,
      icon: selectedIcon,
      color: selectedColor,
    };
  }, [newCategoryName, selectedIcon, selectedColor]);

  return {
    // Modal visibility
    isModalVisible,
    isEditMode,
    editingCategory,

    // Form state
    newCategoryName,
    setNewCategoryName,
    selectedIcon,
    setSelectedIcon,
    selectedColor,
    setSelectedColor,

    // Delete confirmation
    isConfirmDeleteModalVisible,
    categoryToDelete,

    // Actions
    openAddModal,
    openEditModal,
    closeModal,
    resetModalFields,
    openDeleteConfirmation,
    closeDeleteConfirmation,
    getFormData,
  };
};

