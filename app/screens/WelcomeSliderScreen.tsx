import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, FlatList, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SIZES } from '../theme';
import { RootStackParamList } from '../types';

type WelcomeSliderNavigationProp = NativeStackNavigationProp<RootStackParamList, 'WelcomeSlider'>;

const { width, height } = Dimensions.get('window');

// Key for AsyncStorage
const FIRST_LAUNCH_KEY = 'APP_FIRST_LAUNCH';

// Slide data
const slides = [
    {
        id: '1',
        title: 'Welcome to Task Planner',
        description: 'Your personal assistant for organizing daily tasks and boosting productivity.',
    },
    {
        id: '2',
        title: 'Organize Your Tasks',
        description: 'Create, categorize, and prioritize your tasks with ease.',
    },
    {
        id: '3',
        title: 'Track Dependencies',
        description: 'Set up task relationships and track what needs to be done first.',
    },
    {
        id: '4',
        title: 'Ready to Start',
        description: 'Let\'s begin organizing your life!',
    },
];

const WelcomeSliderScreen = () => {
    const navigation = useNavigation<WelcomeSliderNavigationProp>();
    const [currentIndex, setCurrentIndex] = useState(0);
    const slidesRef = useRef<FlatList>(null);

    // Function to mark app as launched - this ensures it never shows again
    const markAppAsLaunched = async () => {
        try {
            await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true');
        } catch (error) {
            console.error('Error saving first launch status:', error);
        }
    };

    // Function to handle skip
    const handleSkip = async () => {
        await markAppAsLaunched();
        navigation.replace('Home');
    };

    // Function to handle next
    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
            setCurrentIndex(currentIndex + 1);
        } else {
            handleGetStarted();
        }
    };

    // Function to handle get started
    const handleGetStarted = async () => {
        await markAppAsLaunched();
        navigation.replace('Home');
    };

    // Render slide item
    const renderItem = ({ item }: { item: typeof slides[0] }) => {
        return (
            <View style={styles.slide}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
            </View>
        );
    };

    // Render pagination dots
    const renderPagination = () => {
        return (
            <View style={styles.paginationContainer}>
                {slides.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            { backgroundColor: index === currentIndex ? COLORS.primary : 'rgba(255, 255, 255, 0.3)' }
                        ]}
                    />
                ))}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <View style={styles.skipContainer}>
                {currentIndex < slides.length - 1 && (
                    <TouchableOpacity onPress={handleSkip}>
                        <Text style={styles.skipText}>Skip</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={slides}
                renderItem={renderItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                bounces={false}
                keyExtractor={(item) => item.id}
                onScroll={(event) => {
                    const slideIndex = Math.round(
                        event.nativeEvent.contentOffset.x / width
                    );
                    if (slideIndex !== currentIndex) {
                        setCurrentIndex(slideIndex);
                    }
                }}
                ref={slidesRef}
                scrollEventThrottle={16}
            />

            {renderPagination()}

            <View style={styles.bottomContainer}>
                {currentIndex === slides.length - 1 ? (
                    <TouchableOpacity style={styles.buttonContainer} onPress={handleGetStarted}>
                        <Text style={styles.buttonText}>Get Started</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.buttonContainer} onPress={handleNext}>
                        <Text style={styles.buttonText}>Next</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    skipContainer: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 1,
    },
    skipText: {
        color: COLORS.text,
        fontSize: SIZES.medium,
        opacity: 0.7,
    },
    slide: {
        width,
        height,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    image: {
        width: width * 0.7,
        height: height * 0.4,
        resizeMode: 'contain',
        marginBottom: 30,
    },
    title: {
        fontSize: SIZES.extraLarge + 4,
        color: COLORS.text,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    description: {
        fontSize: SIZES.medium,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        lineHeight: 24,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 30,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginHorizontal: 5,
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 50,
        width: '100%',
        paddingHorizontal: 30,
    },
    buttonContainer: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: SIZES.medium,
        color: COLORS.background,
        fontWeight: 'bold',
    },
});

export default WelcomeSliderScreen;