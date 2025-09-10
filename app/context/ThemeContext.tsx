import React, { ReactNode, createContext, useContext } from "react";
import { darkTheme, lightGrayTheme } from "../theme";
import { useSettings } from "./SettingsContext";

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
  const { settings } = useSettings();
  const isDark = !!settings.darkModeEnabled;
  const colors = isDark ? darkTheme : lightGrayTheme;

  return (
    <ThemeContext.Provider value={{ colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
