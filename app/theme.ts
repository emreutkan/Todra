export const COLORS = {
    primary: '#FF8C00',     // Orange for buttons
    background: '#121212',  // Dark background
    card: '#1E1E1E',        // Slightly lighter dark for cards
    text: '#FFFFFF',        // White text
    border: '#2C2C2C',      // Dark borders
    notification: '#FF8C00',
    success: '#4CAF50',     // Green for success
    error: '#F44336',       // Red for error
    warning: '#FFC107',     // Yellow for warning
    info: '#2196F3',        // Blue for info
};

export const PRIORITY_COLORS = {
    normal: COLORS.info,
    high: COLORS.warning,
    crucial: COLORS.error,
    optional: '#9C27B0',    // Purple for optional
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