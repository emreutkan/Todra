// --- Dark + Orange Theme ---
export const darkOrangeTheme = {
    primary: '#FF8C00',      // Orange for primary elements
    secondary: '#FF8C00',    // Orange for secondary elements
    accent: '#FFD700',       // Gold for accent
    background: '#121212',   // Dark background
    card: '#1E1E1E',         // Slightly lighter dark for cards
    surface: '#242424',      // Surface color for elements
    text: '#FFFFFF',         // White text
    textSecondary: '#AAAAAA',// Secondary text color
    border: '#2C2C2C',       // Dark borders
    notification: '#FF8C00', // Orange notifications
    success: '#4CAF50',      // Green for success
    error: '#F44336',        // Red for error
    warning: '#FFC107',      // Yellow for warning
    info: '#2196F3',         // Blue for info
    inputBackground: '#2C2C2C', // Background for input fields
    divider: '#3A3A3A',      // Divider color
    disabled: '#666666',     // Disabled state color
    onPrimary: '#000000',    // Text on primary color
};

// --- Dark + Purple Theme ---
export const darkPurpleTheme = {
    primary: '#9C27B0',      // Purple for primary elements
    secondary: '#7B1FA2',    // Darker purple for secondary elements
    accent: '#E040FB',       // Lighter purple for accent
    background: '#121212',   // Dark background
    card: '#1E1E1E',         // Slightly lighter dark for cards
    surface: '#242424',      // Surface color for elements
    text: '#FFFFFF',         // White text
    textSecondary: '#AAAAAA',// Secondary text color
    border: '#2C2C2C',       // Dark borders
    notification: '#9C27B0', // Purple notifications
    success: '#4CAF50',      // Green for success
    error: '#F44336',        // Red for error
    warning: '#FFC107',      // Yellow for warning
    info: '#2196F3',         // Blue for info
    inputBackground: '#2C2C2C', // Background for input fields
    divider: '#3A3A3A',      // Divider color
    disabled: '#666666',     // Disabled state color
    onPrimary: '#FFFFFF',    // Text on primary color
};

// --- Light + Gray Theme ---
export const lightGrayTheme = {
    primary: '#757575',      // Gray for primary elements
    secondary: '#616161',    // Darker gray for secondary elements
    accent: '#9E9E9E',       // Lighter gray for accent
    background: '#F5F5F5',   // Light background
    card: '#FFFFFF',         // White for cards
    surface: '#FFFFFF',      // Surface color for elements
    text: '#212121',         // Dark text
    textSecondary: '#757575',// Secondary text color
    border: '#E0E0E0',       // Light borders
    notification: '#757575', // Gray notifications
    success: '#4CAF50',      // Green for success
    error: '#F44336',        // Red for error
    warning: '#FFC107',      // Yellow for warning
    info: '#2196F3',         // Blue for info
    inputBackground: '#F9F9F9', // Background for input fields
    divider: '#EEEEEE',      // Divider color
    disabled: '#BDBDBD',     // Disabled state color
    onPrimary: '#FFFFFF',    // Text on primary color
};

// For backward compatibility with existing code
export const COLORS = darkOrangeTheme;

export const PRIORITY_COLORS = {
    normal: '#2196F3',    // Blue
    high: '#FFC107',      // Yellow
    crucial: '#F44336',   // Red
    optional: '#9C27B0',  // Purple
};

export const FONTS = {
    regular: {
        fontFamily: 'System',
        fontWeight: '400' as const,
    },
    medium: {
        fontFamily: 'System',
        fontWeight: '500' as const,
    },
    bold: {
        fontFamily: 'System',
        fontWeight: '700' as const,
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