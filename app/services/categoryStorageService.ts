import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import {
  CATEGORIES_STORAGE_KEY,
  Category,
  DEFAULT_CATEGORIES,
} from "../constants/CategoryConstants";

export const categoryStorageService = {
  // Load categories from storage or use defaults
  loadCategories: async (): Promise<Category[]> => {
    try {
      const storedCategories = await AsyncStorage.getItem(
        CATEGORIES_STORAGE_KEY
      );
      if (storedCategories) {
        return JSON.parse(storedCategories);
      } else {
        // First time - use default categories
        await AsyncStorage.setItem(
          CATEGORIES_STORAGE_KEY,
          JSON.stringify(DEFAULT_CATEGORIES)
        );
        return DEFAULT_CATEGORIES;
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      return DEFAULT_CATEGORIES;
    }
  },

  // Save categories to storage
  saveCategories: async (categories: Category[]): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(
        CATEGORIES_STORAGE_KEY,
        JSON.stringify(categories)
      );
      return true;
    } catch (error) {
      console.error("Error saving categories:", error);
      Alert.alert("Error", "Failed to save categories");
      return false;
    }
  },

  // Add a new category
  addCategory: async (
    categories: Category[],
    newCategory: Category
  ): Promise<Category[]> => {
    const updatedCategories = [...categories, newCategory];
    const success = await categoryStorageService.saveCategories(
      updatedCategories
    );
    return success ? updatedCategories : categories;
  },

  // Update an existing category
  updateCategory: async (
    categories: Category[],
    updatedCategory: Category
  ): Promise<Category[]> => {
    const updatedCategories = categories.map((cat) =>
      cat.id === updatedCategory.id ? updatedCategory : cat
    );
    const success = await categoryStorageService.saveCategories(
      updatedCategories
    );
    return success ? updatedCategories : categories;
  },

  // Delete a category
  deleteCategory: async (
    categories: Category[],
    categoryId: string
  ): Promise<Category[]> => {
    const updatedCategories = categories.filter((cat) => cat.id !== categoryId);
    const success = await categoryStorageService.saveCategories(
      updatedCategories
    );
    return success ? updatedCategories : categories;
  },
};

