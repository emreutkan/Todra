import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import {
  AVAILABLE_COLORS,
  AVAILABLE_ICONS,
  Category,
} from "../constants/CategoryConstants";
import { categoryStorageService } from "../services/categoryStorageService";

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Load categories when hook initializes
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const loadedCategories = await categoryStorageService.loadCategories();
      setCategories(loadedCategories);
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addCategory = useCallback(
    async (categoryData: Omit<Category, "id">) => {
      // Validate category name
      if (!categoryData.name.trim()) {
        Alert.alert("Error", "Please enter a category name");
        return false;
      }

      // Check if category name already exists
      if (
        categories.some(
          (cat) =>
            cat.name.toLowerCase() === categoryData.name.trim().toLowerCase()
        )
      ) {
        Alert.alert("Error", "A category with this name already exists");
        return false;
      }

      const newCategory: Category = {
        id: `custom-${Date.now()}`,
        name: categoryData.name.trim(),
        icon: categoryData.icon,
        color: categoryData.color,
      };

      const updatedCategories = await categoryStorageService.addCategory(
        categories,
        newCategory
      );
      setCategories(updatedCategories);
      return true;
    },
    [categories]
  );

  const updateCategory = useCallback(
    async (categoryId: string, updates: Partial<Category>) => {
      const category = categories.find((cat) => cat.id === categoryId);
      if (!category) return false;

      // Validate category name if provided
      if (updates.name !== undefined) {
        if (!updates.name.trim()) {
          Alert.alert("Error", "Please enter a category name");
          return false;
        }

        // Check if category name already exists (excluding the current category)
        if (
          categories.some(
            (cat) =>
              cat.id !== categoryId &&
              cat.name.toLowerCase() === updates.name!.trim().toLowerCase()
          )
        ) {
          Alert.alert("Error", "A category with this name already exists");
          return false;
        }
      }

      const updatedCategory: Category = {
        ...category,
        ...updates,
        name: updates.name?.trim() || category.name,
      };

      const updatedCategories = await categoryStorageService.updateCategory(
        categories,
        updatedCategory
      );
      setCategories(updatedCategories);
      return true;
    },
    [categories]
  );

  const deleteCategory = useCallback(
    async (categoryId: string) => {
      const category = categories.find((cat) => cat.id === categoryId);
      if (!category) return false;

      if (category.isDefault) {
        Alert.alert("Cannot Delete", "Default categories cannot be deleted");
        return false;
      }

      const updatedCategories = await categoryStorageService.deleteCategory(
        categories,
        categoryId
      );
      setCategories(updatedCategories);
      return true;
    },
    [categories]
  );

  const canEditCategory = useCallback((category: Category) => {
    return !category.isDefault;
  }, []);

  const canDeleteCategory = useCallback((category: Category) => {
    return !category.isDefault;
  }, []);

  return {
    categories,
    loading,
    loadCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    canEditCategory,
    canDeleteCategory,
    availableIcons: AVAILABLE_ICONS,
    availableColors: AVAILABLE_COLORS,
  };
};
