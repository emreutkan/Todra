import React, { ReactNode, createContext, useContext } from "react";
import { useColorScheme } from "react-native";
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
  const systemScheme = useColorScheme();
  const systemPrefersDark = systemScheme === "dark";

  // Choose theme: user toggle overrides system; if toggle absent, use system; fallback to light
  const isDark = settings.darkModeEnabled ?? systemPrefersDark;
  const colors = isDark ? darkTheme : lightGrayTheme;

  return (
    <ThemeContext.Provider value={{ colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
