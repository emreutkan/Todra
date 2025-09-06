import React, { ReactNode, createContext, useContext } from "react";
import { lightGrayTheme } from "../theme";

// Context type definition
type ThemeContextType = {
  colors: typeof lightGrayTheme;
  isDark: boolean;
};

// Create the context
const ThemeContext = createContext<ThemeContextType>({
  colors: lightGrayTheme,
  isDark: false,
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Always use light gray theme
  const colors = lightGrayTheme;
  const isDark = false; // Light theme is never dark

  return (
    <ThemeContext.Provider value={{ colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
