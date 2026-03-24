import React, { ReactNode, createContext, useContext } from "react";
import { useColorScheme } from "react-native";
import {
  darkOledTheme,
  darkPremiumTheme,
  lightWarmTheme,
  ThemeColors,
} from "../theme";
import { useSettings } from "./SettingsContext";

type ThemeContextType = {
  colors: ThemeColors;
  isDark: boolean;
  /** True when dark mode uses true-black OLED palette */
  isOledBlack: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  colors: lightWarmTheme,
  isDark: false,
  isOledBlack: false,
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { settings } = useSettings();
  const systemScheme = useColorScheme();
  const systemPrefersDark = systemScheme === "dark";

  const isDark = settings.darkModeEnabled ?? systemPrefersDark;
  const isOledBlack = isDark && !!settings.darkUseOledBlack;
  const colors = !isDark
    ? lightWarmTheme
    : isOledBlack
      ? darkOledTheme
      : darkPremiumTheme;

  return (
    <ThemeContext.Provider value={{ colors, isDark, isOledBlack }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
