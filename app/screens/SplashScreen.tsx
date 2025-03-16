import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import { COLORS } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { StatusBar } from 'expo-status-bar';

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const SplashScreen = () => {
    const navigation = useNavigation<SplashScreenNavigationProp>();
    const spinValue = new Animated.Value(0);

    useEffect(() => {
        // Start rotation animation
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
            })
        ).start();

        // Simulate loading data and navigate to Home after 2.5 seconds
        const timer = setTimeout(() => {
            navigation.replace('Home');
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    // Interpolate spin value to rotation
    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <Animated.View
                style={[
                    styles.logo,
                    { transform: [{ rotate: spin }] }
                ]}
            >
                <Text style={styles.logoText}>TP</Text>
            </Animated.View>
            <Text style={styles.appName}>Task Planner</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    logoText: {
        color: COLORS.background,
        fontSize: 36,
        fontWeight: 'bold',
    },
    appName: {
        color: COLORS.text,
        fontSize: 24,
        fontWeight: 'bold',
    },
});

export default SplashScreen;