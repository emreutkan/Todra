import { Ionicons } from "@expo/vector-icons";
import {
  Fraunces_400Regular,
  Fraunces_600SemiBold,
} from "@expo-google-fonts/fraunces";
import {
  NunitoSans_400Regular,
  NunitoSans_500Medium,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
} from "@expo-google-fonts/nunito-sans";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { applyGlobalTypography } from "./app/bootstrapTypography";
import { SettingsProvider } from "./app/context/SettingsContext";
import { ThemeProvider, useTheme } from "./app/context/ThemeContext";
import { ToastProvider } from "./app/context/ToastContext";

import AddTaskScreen from "./app/screens/AddTaskScreen";
import AllTasksScreen from "./app/screens/AllTasksScreen";
import HomeScreen from "./app/screens/HomeScreen";
import SettingsScreen from "./app/screens/SettingsScreen";
import SplashScreen from "./app/screens/SplashScreen";
import TaskDetailsScreen from "./app/screens/TaskDetailsScreen";

import * as Notifications from "expo-notifications";
import ArchivedTasksScreen from "./app/screens/ArchivedTasksScreen";
import { notificationService } from "./app/services/notificationService";
import { RootStackParamList } from "./app/types";

const FONT_LOADING_BACKGROUND = "#F7F3EE";
const FONT_LOADING_SPINNER = "#8B7355";

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppContent() {
  const { colors, isDark } = useTheme();

  const MyTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  useEffect(() => {
    (async () => {
      try {
        await notificationService.init();
        await notificationService.requestPermissions();
      } catch (error) {
        console.warn("Notification init failed", error);
      }
    })();
  }, []);

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }, []);

  return (
    <NavigationContainer theme={MyTheme}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
          animation: "fade",
        }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
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
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    Fraunces_400Regular,
    Fraunces_600SemiBold,
    NunitoSans_400Regular,
    NunitoSans_500Medium,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      applyGlobalTypography();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: FONT_LOADING_BACKGROUND,
        }}>
        <ActivityIndicator size="large" color={FONT_LOADING_SPINNER} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <ThemeProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </ThemeProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
