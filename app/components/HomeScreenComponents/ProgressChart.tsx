import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

interface ProgressChartProps {
    completed: number;
    remaining: number;
    colors: {
        primary: string;
        success: string;
        text: string;
        background: string;
        surface: string;
        border: string;
        [key: string]: string;
    };
    size?: number;
}

const ProgressChart: React.FC<ProgressChartProps> = ({
                                                         completed,
                                                         remaining,
                                                         colors,
                                                         size = 80
                                                     }) => {
    const circumference = 2 * Math.PI * (size / 2 - 8);
    const totalTasks = completed + remaining;

    // Animation values
    const animatedCompleted = React.useRef(new Animated.Value(0)).current;
    const animatedRemaining = React.useRef(new Animated.Value(0)).current;

    // Calculated completion percentage
    const completedPercentage = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

    // Stroke dashoffset calculations
    const completedOffset = animatedCompleted.interpolate({
        inputRange: [0, 100],
        outputRange: [circumference, 0]
    });

    const remainingOffset = animatedRemaining.interpolate({
        inputRange: [0, 100],
        outputRange: [circumference, 0]
    });

    useEffect(() => {
        // Animate the progress
        Animated.parallel([
            Animated.timing(animatedCompleted, {
                toValue: completedPercentage,
                duration: 1000,
                useNativeDriver: true
            }),
            Animated.timing(animatedRemaining, {
                toValue: 100 - completedPercentage,
                duration: 1000,
                useNativeDriver: true
            })
        ]).start();
    }, [completed, remaining]);

    // Circle components
    const AnimatedCircle = Animated.createAnimatedComponent(Circle);

    return (
        <View style={styles.container}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
                    {/* Background Circle */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={size / 2 - 8}
                        strokeWidth={4}
                        stroke={colors.surface}
                        fill="transparent"
                    />

                    {/* Remaining Tasks */}
                    <AnimatedCircle
                        cx={size / 2}
                        cy={size / 2}
                        r={size / 2 - 8}
                        strokeWidth={4}
                        stroke={colors.primary}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={remainingOffset}
                        strokeLinecap="round"
                    />

                    {/* Completed Tasks */}
                    <AnimatedCircle
                        cx={size / 2}
                        cy={size / 2}
                        r={size / 2 - 8}
                        strokeWidth={4}
                        stroke={colors.success}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={completedOffset}
                        strokeLinecap="round"
                    />
                </G>
            </Svg>

            <View style={styles.textContainer}>
                <Text style={[styles.percentageText, { color: colors.text }]}>
                    {`${completedPercentage}%`}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    percentageText: {
        fontSize: 16,
        fontWeight: 'bold',
    }
});

export default ProgressChart;