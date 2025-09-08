import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { Category } from "../constants/CategoryConstants";
import { STORAGE_KEYS } from "../constants/StorageKeys";

export const useHomeCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  // Load categories from AsyncStorage
  const loadCategories = useCallback(async () => {
    try {
      const storedCategories = await AsyncStorage.getItem(
        STORAGE_KEYS.CATEGORIES
      );
      if (storedCategories) {
        const parsedCategories: Category[] = JSON.parse(storedCategories);
        setCategories(parsedCategories);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  }, []);

  // Load categories when component mounts
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    categories,
    loadCategories,
  };
};
