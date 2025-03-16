import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated, Easing, Platform } from 'react-native';
import { COLORS } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { StatusBar } from 'expo-status-bar';

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const SplashScreen = () => {
    const navigation = useNavigation<SplashScreenNavigationProp>();

    // Use useRef for animations to prevent recreation on re-render
    const spinValue = useRef(new Animated.Value(0)).current;
    const scaleValue = useRef(new Animated.Value(0.3)).current;
    const opacityValue = useRef(new Animated.Value(0)).current;
    const textOpacityValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Create combined animations for a more polished look
        const spinAnimation = Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 1500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        // Entrance animations
        const entryAnimations = Animated.sequence([
            // First scale up and fade in logo
            Animated.parallel([
                Animated.timing(scaleValue, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.elastic(1.2),
                    useNativeDriver: true,
                }),
                Animated.timing(opacityValue, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                })
            ]),
            // Then fade in the text
            Animated.timing(textOpacityValue, {
                toValue: 1,
                duration: 400,
                delay: 200,
                useNativeDriver: true,
            })
        ]);

        // Start both animations
        spinAnimation.start();
        entryAnimations.start();

        // Check if there's stored data or user preferences
        // This could be expanded to check authentication status, etc.
        const checkInitialSetup = async () => {
            try {
                // You could add actual data loading logic here
                const loadingDelay = Platform.OS === 'ios' ? 2200 : 1800; // iOS animations are smoother, so allow more time

                // Simulate loading data and navigate to Home
                const timer = setTimeout(() => {
                    navigation.replace('Home');
                }, loadingDelay);

                return () => clearTimeout(timer);
            } catch (error) {
                console.error('Error during app initialization:', error);
                // Navigate anyway, but could show an error screen instead
                navigation.replace('Home');
            }
        };

        checkInitialSetup();

        // Cleanup function
        return () => {
            spinAnimation.stop();
            // No need to manually clear the animation sequences as they're naturally completed
        };
    }, [navigation, spinValue, scaleValue, opacityValue, textOpacityValue]);

    // Interpolate spin value to rotation
    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    // Create shadow based on platform
    const logoShadow = Platform.select({
        ios: {
            shadowColor: COLORS.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.8,
            shadowRadius: 8,
        },
        android: {
            elevation: 12,
        },
    });

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.content}>
                <Animated.View
                    style={[
                        styles.logoContainer,
                        logoShadow,
                        {
                            opacity: opacityValue,
                            transform: [
                                { rotate: spin },
                                { scale: scaleValue }
                            ]
                        }
                    ]}
                >
                    <View style={styles.logo}>
                        <Text style={styles.logoText}>TP</Text>
                    </View>
                </Animated.View>

                <Animated.View style={{ opacity: textOpacityValue }}>
                    <Text style={styles.appName}>Task Planner</Text>
                    <Text style={styles.tagline}>Organize your day efficiently</Text>
                </Animated.View>
            </View>

            <Animated.Text
                style={[
                    styles.versionText,
                    { opacity: textOpacityValue }
                ]}
            >
                Version 1.0.0
            </Animated.Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 40,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        marginBottom: 25,
        borderRadius: 60,
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    logo: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    logoText: {
        color: COLORS.background,
        fontSize: 38,
        fontWeight: 'bold',
    },
    appName: {
        color: COLORS.text,
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 6,
    },
    tagline: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 16,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    versionText: {
        position: 'absolute',
        bottom: 20,
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
    },
});

export default SplashScreen;