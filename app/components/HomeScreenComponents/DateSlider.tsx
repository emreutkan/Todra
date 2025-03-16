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
import { COLORS, SIZES } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const DAY_ITEM_WIDTH = 70;
const ITEM_SPACING = 8;

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
                    _isSelected && styles.selectedDateItem
                ]}
                onPress={() => onDateChange(date)}
                activeOpacity={0.7}
            >
                {isFirstDayOfMonth && (
                    <View style={styles.monthBadge}>
                        <Text style={styles.monthBadgeText}>{monthAbbr}</Text>
                    </View>
                )}

                <Text style={[
                    styles.dayName,
                    _isSelected && styles.selectedDayName
                ]}>
                    {date.toLocaleDateString(undefined, { weekday: 'short' })}
                </Text>

                <View style={[
                    styles.dateCircle,
                    _isToday && styles.todayCircle,
                    _isSelected && styles.selectedCircle
                ]}>
                    <Text style={[
                        styles.dateNumber,
                        _isToday && !_isSelected && styles.todayText,
                        _isSelected && styles.selectedDateNumber
                    ]}>
                        {date.getDate()}
                    </Text>
                </View>

                {_isToday && !_isSelected && (
                    <View style={styles.todayDot} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <Animated.View
            style={[
                styles.container,
                { opacity: fadeAnim }
            ]}
        >
            <View style={styles.header}>
                <View style={styles.monthDisplay}>
                    <Text style={styles.monthText}>{selectedMonth}</Text>
                    <Ionicons
                        name={filterType === 'dueDate' ? 'hourglass-outline' : 'create-outline'}
                        size={16}
                        color={COLORS.text + '80'}
                        style={{ marginLeft: 8 }}
                    />
                </View>

                <TouchableOpacity
                    style={styles.todayButton}
                    onPress={() => {
                        if (todayIndex !== -1) {
                            onDateChange(today);

                            // Need to delay a bit to let the state update
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
                    <Ionicons name="today-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.todayButtonText}>Today</Text>
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
        backgroundColor: COLORS.card,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
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
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    monthDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    monthText: {
        fontSize: SIZES.medium,
        fontWeight: '600',
        color: COLORS.text,
    },
    todayButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    todayButtonText: {
        fontSize: SIZES.font - 1,
        fontWeight: '600',
        color: COLORS.primary,
        marginLeft: 4,
    },
    listContent: {
        paddingHorizontal: width / 2 - DAY_ITEM_WIDTH / 2,
        paddingBottom: 4,
    },
    dateItem: {
        width: DAY_ITEM_WIDTH,
        height: 80,
        marginHorizontal: ITEM_SPACING / 2,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: SIZES.base,
        backgroundColor: 'transparent',
        paddingVertical: 8,
        position: 'relative',
    },
    selectedDateItem: {
        backgroundColor: COLORS.primary + '10',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    dayName: {
        fontSize: 13,
        marginBottom: 6,
        color: COLORS.text + 'CC',
        fontWeight: '500',
    },
    selectedDayName: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    dateCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    todayCircle: {
        borderWidth: 1,
        borderColor: COLORS.primary,
        backgroundColor: COLORS.card,
    },
    selectedCircle: {
        backgroundColor: COLORS.primary,
        borderWidth: 0,
    },
    dateNumber: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.text,
    },
    todayText: {
        color: COLORS.primary,
        fontWeight: '700',
    },
    selectedDateNumber: {
        color: COLORS.background,
        fontWeight: '700',
    },
    todayDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.primary,
        marginTop: 3,
    },
    monthBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: COLORS.primary + '20',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderTopRightRadius: SIZES.base,
    },
    monthBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.primary,
    }
});

export default DateSlider;