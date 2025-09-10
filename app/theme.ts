// --- Light + Gray Theme (Default) ---
export const lightGrayTheme = {
  primary: "#383838", // Gray for primary elements
  secondary: "#383838", // Darker gray for secondary elements
  accent: "#383838", // Lighter gray for accent
  background: "#ffffff", // Light background
  card: "#FFFFFF", // White for cards
  surface: "#FFFFFF", // Surface color for elements
  text: "#212121", // Dark text
  textSecondary: "#757575", // Secondary text color
  border: "#E0E0E0", // Light borders
  notification: "#757575", // Gray notifications
  success: "#4CAF50", // Green for success
  error: "#F44336", // Red for error
  warning: "#FFC107", // Yellow for warning
  info: "#2196F3", // Blue for info
  inputBackground: "#F9F9F9", // Background for input fields
  divider: "#EEEEEE", // Divider color
  disabled: "#BDBDBD", // Disabled state color
  onPrimary: "#FFFFFF", // Text on primary color
};

// --- Dark Theme ---
export const darkTheme = {
  primary: "#E6E6E6",
  secondary: "#C0C0C0",
  accent: "#E6E6E6",
  background: "#000000",
  card: "#0A0A0A",
  surface: "#141414",
  text: "#FFFFFF",
  textSecondary: "#BDBDBD",
  border: "#1F1F1F",
  notification: "#BDBDBD",
  success: "#E0E0E0",
  error: "#8A8A8A",
  warning: "#B0B0B0",
  info: "#CCCCCC",
  inputBackground: "#0D0D0D",
  divider: "#1A1A1A",
  disabled: "#555555",
  onPrimary: "#000000",
};

// For backward compatibility with existing code
export const COLORS = lightGrayTheme;

export const PRIORITY_COLORS = {
  low: "#2196F3", // Blue
  normal: "#FFC107", // Yellow
  high: "#F44336", // Red
};

export const FONTS = {
  regular: {
    fontFamily: "System",
    fontWeight: "400" as const,
  },
  medium: {
    fontFamily: "System",
    fontWeight: "500" as const,
  },
  bold: {
    fontFamily: "System",
    fontWeight: "700" as const,
  },
};

export const SIZES = {
  base: 8,
  small: 12,
  font: 14,
  medium: 16,
  large: 18,
  extraLarge: 24,
};
