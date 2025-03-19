import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './app/context/ThemeContext';

// Import screens
import SplashScreen from './app/screens/SplashScreen';
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
            background: colors.background,
            card: colors.card,
            text: colors.text,
            border: colors.border,
            primary: colors.primary,
        },
    };

    // Simulate loading resources
    useEffect(() => {
        // This could be a place to load fonts or other resources
        const prepareApp = async () => {
            try {
                // Simulate some loading time
                await new Promise(resolve => setTimeout(resolve, 1000));
                setIsReady(true);
            } catch (e) {
                console.warn(e);
            }
        };

        prepareApp();
    }, []);

    if (!isReady) {
        // Show nothing while the app is preparing
        return null;
    }

    return (
        <NavigationContainer theme={MyTheme}>
            <StatusBar style={isDark ? "light" : "dark"} />
            <Stack.Navigator
                initialRouteName="Splash"
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.background },
                    animation: 'fade',
                }}
            >
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="AddTask" component={AddTaskScreen} />
                <Stack.Screen
                    name="EditTask"
                    component={AddTaskScreen}
                    initialParams={{ taskId: '' }}
                />
                <Stack.Screen
                    name="TaskDetails"
                    component={TaskDetailsScreen}
                    initialParams={{ taskId: '' }}
                />
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