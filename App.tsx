import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { SettingsProvider } from "./app/context/SettingsContext";
import { ThemeProvider, useTheme } from "./app/context/ThemeContext";
import { COLORS } from "./app/theme";

// Import screens
import AddTaskScreen from "./app/screens/AddTaskScreen";
import AllTasksScreen from "./app/screens/AllTasksScreen"; // New import
import HomeScreen from "./app/screens/HomeScreen";
import SettingsScreen from "./app/screens/SettingsScreen"; // New import
import SplashScreen from "./app/screens/SplashScreen";
import TaskDetailsScreen from "./app/screens/TaskDetailsScreen";
import WelcomeSliderScreen from "./app/screens/WelcomeSliderScreen";

import ArchivedTasksScreen from "./app/screens/ArchivedTasksScreen";
import { RootStackParamList } from "./app/types";

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppContent() {
  const { colors, isDark } = useTheme();

  const [isReady, setIsReady] = useState(false);

  const MyTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background || COLORS.background,
      card: colors.card || COLORS.card,
      text: colors.text || COLORS.text,
      border: colors.border || COLORS.border,
      primary: colors.primary || COLORS.primary,
    },
  };

  useEffect(() => {
    const prepareApp = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsReady(true);
      } catch (e) {
        console.warn(e);
      }
    };

    prepareApp();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <NavigationContainer theme={MyTheme}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background || COLORS.background,
          },
          animation: "fade",
        }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="WelcomeSlider" component={WelcomeSliderScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="AddTask" component={AddTaskScreen} />
        <Stack.Screen
          name="EditTask"
          component={AddTaskScreen}
          initialParams={{ taskId: "" }}
        />
        <Stack.Screen
          name="TaskDetails"
          component={TaskDetailsScreen}
          initialParams={{ taskId: "" }}
        />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="AllTasks" component={AllTasksScreen} />
        <Stack.Screen name="ArchivedTasks" component={ArchivedTasksScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </ThemeProvider>
  );
}
