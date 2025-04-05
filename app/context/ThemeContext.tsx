import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkOrangeTheme, darkPurpleTheme, lightGrayTheme } from '../theme';
import {THEME_STORAGE_KEY} from "../constants/StorageKeys";

// Define theme types
export type ThemeType = 'darkOrange' | 'darkPurple' | 'lightGray';

// Context type definition
type ThemeContextType = {
    theme: ThemeType;
    colors: typeof darkOrangeTheme;
    isDark: boolean;
    setTheme: (theme: ThemeType) => void;
};

// Default theme
const DEFAULT_THEME: ThemeType = 'darkOrange';

// Create the context
const ThemeContext = createContext<ThemeContextType>({
    theme: DEFAULT_THEME,
    colors: darkOrangeTheme,
    isDark: true,
    setTheme: () => {},
});

// Storage key for persisting theme preference

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    // Get system color scheme
    const systemColorScheme = useColorScheme();
    const [theme, setThemeState] = useState<ThemeType>(DEFAULT_THEME);

    // Get the appropriate theme colors based on the selected theme
    const getThemeColors = (themeType: ThemeType) => {
        switch (themeType) {
            case 'darkOrange':
                return darkOrangeTheme;
            case 'darkPurple':
                return darkPurpleTheme;
            case 'lightGray':
                return lightGrayTheme;
            default:
                return darkOrangeTheme;
        }
    };

    // Load saved theme on initial render
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (savedTheme) {
                    setThemeState(savedTheme as ThemeType);
                } else {
                    // Use system preference if no saved theme
                    setThemeState(
                        systemColorScheme === 'dark' ? 'darkOrange' : 'lightGray'
                    );
                }
            } catch (error) {
                console.error('Failed to load theme:', error);
            }
        };

        loadTheme();
    }, []);

    // Set theme and save to storage
    const setTheme = async (newTheme: ThemeType) => {
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
            setThemeState(newTheme);
        } catch (error) {
            console.error('Failed to save theme:', error);
        }
    };

    // Get colors for current theme
    const colors = getThemeColors(theme);

    // Is the current theme dark?
    const isDark = theme === 'darkOrange' || theme === 'darkPurple';

    return (
        <ThemeContext.Provider value={{ theme, colors, isDark, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);