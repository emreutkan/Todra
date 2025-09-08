// Define a Category type
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault?: boolean;
}

export const CATEGORIES_STORAGE_KEY = "user_categories";

// Default categories that come with the app
export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "personal",
    name: "Personal",
    icon: "person-outline",
    color: "#3498db",
    isDefault: true,
  },
  {
    id: "work",
    name: "Work",
    icon: "briefcase-outline",
    color: "#e74c3c",
    isDefault: true,
  },
  {
    id: "shopping",
    name: "Shopping",
    icon: "cart-outline",
    color: "#27ae60",
    isDefault: true,
  },
  {
    id: "health",
    name: "Health",
    icon: "fitness-outline",
    color: "#9b59b6",
    isDefault: true,
  },
  {
    id: "education",
    name: "Education",
    icon: "school-outline",
    color: "#f39c12",
    isDefault: true,
  },
];

// Available icons for categories
export const AVAILABLE_ICONS = [
  "person-outline",
  "briefcase-outline",
  "cart-outline",
  "fitness-outline",
  "school-outline",
  "home-outline",
  "airplane-outline",
  "restaurant-outline",
  "car-outline",
  "planet-outline",
  "paw-outline",
  "game-controller-outline",
  "musical-notes-outline",
  "book-outline",
  "globe-outline",
  "heart-outline",
  "basketball-outline",
  "beer-outline",
  "bicycle-outline",
  "gift-outline",
];

// Available colors for categories
export const AVAILABLE_COLORS = [
  "#3498db",
  "#e74c3c",
  "#27ae60",
  "#9b59b6",
  "#f39c12",
  "#1abc9c",
  "#e67e22",
  "#2980b9",
  "#8e44ad",
  "#d35400",
  "#16a085",
  "#c0392b",
  "#2c3e50",
  "#f1c40f",
  "#7f8c8d",
];

