import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Dimensions
} from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, SIZES } from '../../theme';

const { width } = Dimensions.get('window');

interface DateSliderProps {
    fadeAnim: Animated.Value;
    dateRange: Date[];
    currentDate: Date;
    today: Date;
    selectedMonth: string;
    onDateChange: (date: Date) => void;
}

const DateSlider: React.FC<DateSliderProps> = ({
                                                   fadeAnim,
                                                   dateRange,
                                                   currentDate,
                                                   today,
                                                   selectedMonth,
                                                   onDateChange
                                               }) => {
    const dateScrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        // Auto-scroll to today's date at initial render (in the next frame)
        setTimeout(() => {
            // Find the index of today's date
            const todayIndex = dateRange.findIndex(date =>
                date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth()
            );

            if (dateScrollRef.current && todayIndex !== -1) {
                // Calculate position to center the date
                const scrollToX = todayIndex * 50 - width / 2 + 25;
                dateScrollRef.current.scrollTo({ x: Math.max(0, scrollToX), animated: true });
            }
        }, 100);
    }, [dateRange, today]);

    return (
        <Animated.View
            style={[
                styles.dateSliderContainer,
                { opacity: fadeAnim }
            ]}
        >
            <BlurView intensity={15} tint="dark" style={styles.blurContainer}>
                <Text style={styles.monthText}>
                    {selectedMonth} {currentDate.getFullYear()}
                </Text>
                <ScrollView
                    ref={dateScrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dateScrollContent}
                    snapToInterval={50} // Will snap to date buttons
                >
                    {dateRange.map((date, index) => {
                        const isSelected = date.getDate() === currentDate.getDate() &&
                            date.getMonth() === currentDate.getMonth();
                        const isToday = date.getDate() === today.getDate() &&
                            date.getMonth() === today.getMonth() &&
                            date.getFullYear() === today.getFullYear();

                        return (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.dateButton,
                                    isSelected && styles.selectedDateButton,
                                    isToday && !isSelected && styles.todayDateButton
                                ]}
                                onPress={() => onDateChange(date)}
                            >
                                <Text
                                    style={[
                                        styles.dateText,
                                        isSelected && styles.selectedDateText,
                                        isToday && !isSelected && styles.todayDateText
                                    ]}
                                >
                                    {date.getDate()}
                                </Text>
                                <Text
                                    style={[
                                        styles.dayText,
                                        isSelected && styles.selectedDateText,
                                        isToday && !isSelected && styles.todayDateText
                                    ]}
                                >
                                    {date.toLocaleString('default', { weekday: 'short' }).substr(0, 3)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </BlurView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    dateSliderContainer: {
        paddingVertical: 5,
        backgroundColor: COLORS.card + '50',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border + '30',
        height: 90,
    },
    blurContainer: {
        paddingVertical: 5,
        overflow: 'hidden',
        paddingHorizontal: 15,
        height: '100%',
    },
    monthText: {
        color: COLORS.text,
        fontSize: SIZES.medium,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 5,
    },
    dateScrollContent: {
        paddingVertical: 3,
        paddingHorizontal: 5,
    },
    dateButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 50,
        borderRadius: 20,
        marginHorizontal: 5,
        backgroundColor: COLORS.card,
        opacity: 0.7,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    selectedDateButton: {
        backgroundColor: COLORS.primary,
        transform: [{ scale: 1.05 }],
        opacity: 1,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 3,
        elevation: 5,
    },
    todayDateButton: {
        borderWidth: 1,
        borderColor: COLORS.primary,
        opacity: 0.9,
    },
    dateText: {
        color: COLORS.text,
        fontSize: SIZES.medium,
        fontWeight: '600',
    },
    selectedDateText: {
        color: COLORS.background,
        fontWeight: 'bold',
    },
    todayDateText: {
        color: COLORS.primary,
    },
    dayText: {
        color: COLORS.text + '90',
        fontSize: SIZES.small - 1,
        marginTop: 2,
    },
});

export default DateSlider;