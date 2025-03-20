import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './app/context/ThemeContext';
import { COLORS } from './app/theme';

// Import screens
import SplashScreen from './app/screens/SplashScreen';
import WelcomeSliderScreen from './app/screens/WelcomeSliderScreen';
import HomeScreen from './app/screens/HomeScreen';
import AddTaskScreen from './app/screens/AddTaskScreen';
import TaskDetailsScreen from './app/screens/TaskDetailsScreen';

// Import types
import { RootStackParamList } from './app/types';

// Create stack navigator
const Stack = createNativeStackNavigator<RootStackParamList>();

function AppContent() {
    // Use the theme context
    const { colors, isDark } = useTheme();

    // This will be set to true once the app has loaded
    const [isReady, setIsReady] = useState(false);

    // Create custom theme for NavigationContainer based on the current mode
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

    // Simulate loading resources
    useEffect(() => {
        const prepareApp = async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 1000));
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
                    contentStyle: { backgroundColor: colors.background || COLORS.background },
                    animation: 'fade',
                }}
            >
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="WelcomeSlider" component={WelcomeSliderScreen} />
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="AddTask" component={AddTaskScreen} />
                <Stack.Screen name="EditTask" component={AddTaskScreen} initialParams={{ taskId: '' }} />
                <Stack.Screen name="TaskDetails" component={TaskDetailsScreen} initialParams={{ taskId: '' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
}
