import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Dimensions,
    Animated,
    Platform
} from 'react-native';
import { SIZES } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const DAY_ITEM_WIDTH = 60; // Reduced from 70
const ITEM_SPACING = 6;  // Reduced from 8

interface DateSliderProps {
    fadeAnim: Animated.Value;
    dateRange: Date[];
    currentDate: Date;
    today: Date;
    selectedMonth: string;
    onDateChange: (date: Date) => void;
    filterType?: 'createdAt' | 'dueDate';
}

const DateSlider: React.FC<DateSliderProps> = ({
                                                   fadeAnim,
                                                   dateRange,
                                                   currentDate,
                                                   today,
                                                   selectedMonth,
                                                   onDateChange,
                                                   filterType = 'dueDate'
                                               }) => {
    const { colors } = useTheme();
    const flatListRef = useRef<FlatList>(null);
    const [initialized, setInitialized] = useState(false);

    // Find current date index in the date range
    const currentDateIndex = useMemo(() => {
        return dateRange.findIndex(date =>
            date.getDate() === currentDate.getDate() &&
            date.getMonth() === currentDate.getMonth() &&
            date.getFullYear() === currentDate.getFullYear()
        );
    }, [dateRange, currentDate]);

    // Find today's index in the date range
    const todayIndex = useMemo(() => {
        return dateRange.findIndex(date =>
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    }, [dateRange, today]);

    // Scroll to the current date when component mounts or when currentDate changes
    useEffect(() => {
        if (flatListRef.current && currentDateIndex !== -1) {
            // Add a delay to ensure the FlatList is properly rendered
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                    index: currentDateIndex,
                    animated: !initialized,
                    viewPosition: 0.5 // Center the selected date
                });

                if (!initialized) {
                    setInitialized(true);
                }
            }, initialized ? 10 : 300);
        }
    }, [currentDateIndex]);

    // Check if a date is today
    const isToday = (date: Date) => {
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    // Check if a date is selected
    const isSelected = (date: Date) => {
        return date.getDate() === currentDate.getDate() &&
            date.getMonth() === currentDate.getMonth() &&
            date.getFullYear() === currentDate.getFullYear();
    };

    // Format date for accessibility
    const formatDateForAccessibility = (date: Date) => {
        return date.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Handle scroll failure (e.g., if the index is out of bounds)
    const handleScrollToIndexFailed = () => {
        // Try again with a timeout
        setTimeout(() => {
            if (flatListRef.current && currentDateIndex >= 0) {
                flatListRef.current.scrollToOffset({
                    offset: currentDateIndex * (DAY_ITEM_WIDTH + ITEM_SPACING),
                    animated: true
                });
            }
        }, 100);
    };

    // Render each date item
    const renderDateItem = ({ item: date, index }: { item: Date, index: number }) => {
        const _isToday = isToday(date);
        const _isSelected = isSelected(date);
        const isFirstDayOfMonth = date.getDate() === 1;

        // Get month abbreviation for first day of month
        const monthAbbr = isFirstDayOfMonth
            ? date.toLocaleDateString(undefined, { month: 'short' })
            : '';

        return (
            <TouchableOpacity
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={formatDateForAccessibility(date)}
                accessibilityState={{ selected: _isSelected }}
                accessibilityHint={`Select ${formatDateForAccessibility(date)} as the current date`}
                style={[
                    styles.dateItem,
                    _isSelected && [styles.selectedDateItem, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]
                ]}
                onPress={() => onDateChange(date)}
                activeOpacity={0.7}
            >
                {isFirstDayOfMonth && (
                    <View style={[styles.monthBadge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.monthBadgeText, { color: colors.primary }]}>{monthAbbr}</Text>
                    </View>
                )}

                <Text style={[
                    styles.dayName,
                    { color: colors.text + 'CC' },
                    _isSelected && [styles.selectedDayName, { color: colors.primary }]
                ]}>
                    {date.toLocaleDateString(undefined, { weekday: 'short' }).substring(0, 2)}
                </Text>

                <View style={[
                    styles.dateCircle,
                    _isToday && [styles.todayCircle, { borderColor: colors.primary, backgroundColor: colors.card }],
                    _isSelected && [styles.selectedCircle, { backgroundColor: colors.primary }]
                ]}>
                    <Text style={[
                        styles.dateNumber,
                        { color: colors.text },
                        _isToday && !_isSelected && [styles.todayText, { color: colors.primary }],
                        _isSelected && [styles.selectedDateNumber, { color: colors.background }]
                    ]}>
                        {date.getDate()}
                    </Text>
                </View>

                {_isToday && !_isSelected && (
                    <View style={[styles.todayDot, { backgroundColor: colors.primary }]} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: fadeAnim,
                    backgroundColor: colors.card,
                    borderBottomColor: colors.border
                }
            ]}
        >
            <View style={styles.header}>
                <View style={styles.monthDisplay}>
                    <Text style={[styles.monthText, { color: colors.text }]}>{selectedMonth}</Text>
                    <Ionicons
                        name={filterType === 'dueDate' ? 'hourglass-outline' : 'create-outline'}
                        size={14}
                        color={colors.textSecondary}
                        style={{ marginLeft: 6 }}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.todayButton, { backgroundColor: colors.primary + '15' }]}
                    onPress={() => {
                        if (todayIndex !== -1) {
                            onDateChange(today);
                            setTimeout(() => {
                                flatListRef.current?.scrollToIndex({
                                    index: todayIndex,
                                    animated: true,
                                    viewPosition: 0.5
                                });
                            }, 10);
                        }
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Go to today"
                    accessibilityHint="Selects today's date in the calendar"
                >
                    <Ionicons name="today-outline" size={14} color={colors.primary} />
                    <Text style={[styles.todayButtonText, { color: colors.primary }]}>Today</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={dateRange}
                keyExtractor={(item, index) => `date-${index}`}
                renderItem={renderDateItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                decelerationRate="fast"
                snapToInterval={DAY_ITEM_WIDTH + ITEM_SPACING}
                snapToAlignment="center"
                onScrollToIndexFailed={handleScrollToIndexFailed}
                getItemLayout={(data, index) => ({
                    length: DAY_ITEM_WIDTH + ITEM_SPACING,
                    offset: (DAY_ITEM_WIDTH + ITEM_SPACING) * index,
                    index
                })}
                initialNumToRender={10}
                maxToRenderPerBatch={15}
                windowSize={21} // ~10 items in each direction
            />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 10, // Reduced from 12
        borderBottomWidth: 1,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            }
        })
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16, // Reduced from 20
        marginBottom: 8, // Reduced from 12
    },
    monthDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    monthText: {
        fontSize: SIZES.small + 1,
        fontWeight: '600',
    },
    todayButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 14,
    },
    todayButtonText: {
        fontSize: SIZES.small - 1,
        fontWeight: '600',
        marginLeft: 4,
    },
    listContent: {
        paddingHorizontal: width / 2 - DAY_ITEM_WIDTH / 2,
        paddingBottom: 2,
    },
    dateItem: {
        width: DAY_ITEM_WIDTH,
        height: 70, // Reduced from 80
        marginHorizontal: ITEM_SPACING / 2,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: SIZES.base,
        backgroundColor: 'transparent',
        paddingVertical: 6, // Reduced from 8
        position: 'relative',
    },
    selectedDateItem: {
        borderWidth: 1,
    },
    dayName: {
        fontSize: 12, // Reduced from 13
        marginBottom: 4, // Reduced from 6
        fontWeight: '500',
    },
    selectedDayName: {
        fontWeight: '600',
    },
    dateCircle: {
        width: 32, // Reduced from 36
        height: 32, // Reduced from 36
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    todayCircle: {
        borderWidth: 1,
    },
    selectedCircle: {
        borderWidth: 0,
    },
    dateNumber: {
        fontSize: 15, // Reduced from 17
        fontWeight: '600',
    },
    todayText: {
        fontWeight: '700',
    },
    selectedDateNumber: {
        fontWeight: '700',
    },
    todayDot: {
        width: 3, // Reduced from 4
        height: 3, // Reduced from 4
        borderRadius: 1.5,
        marginTop: 2,
    },
    monthBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        paddingHorizontal: 4, // Reduced from 6
        paddingVertical: 1, // Reduced from 2
        borderRadius: 4,
        borderTopRightRadius: SIZES.base,
    },
    monthBadgeText: {
        fontSize: 9, // Reduced from 10
        fontWeight: '600',
    }
});

export default DateSlider;