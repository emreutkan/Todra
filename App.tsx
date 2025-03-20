import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
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

// Create custom theme for NavigationContainer
const MyTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        background: COLORS.background,
        card: COLORS.card,
        text: COLORS.text,
        border: COLORS.border,
        primary: COLORS.primary,
    },
};

export default function App() {
    // This will be set to true once the app has loaded
    const [isReady, setIsReady] = useState(false);

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
            <StatusBar style="light" />
            <Stack.Navigator
                initialRouteName="Splash"
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: COLORS.background },
                    animation: 'fade',
                }}
            >
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="WelcomeSlider" component={WelcomeSliderScreen} />
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="AddTask" component={AddTaskScreen} />
                <Stack.Screen
                    name="EditTask"
                    component={AddTaskScreen} // We'll reuse AddTaskScreen for editing
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