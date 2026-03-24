import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { SIZES } from "../../theme";
import { typography } from "../../typography";
import AnimatedTodayButton from "../common/AnimatedTodayButton";
import DateTimeModal from "../common/DateTimeModal";

const WINDOW_WIDTH = Dimensions.get("window").width;
/** Full-width strip; measured width used once laid out. */
const FALLBACK_TRACK_W = WINDOW_WIDTH;
const VISIBLE_ITEMS = 5;
const ITEM_SPACING = 6;

interface DateSliderProps {
  dateRange: Date[];
  currentDate: Date;
  today: Date;
  selectedMonth: string;
  onDateChange: (date: Date) => void;
}

const DateSlider: React.FC<DateSliderProps> = ({
  dateRange,
  currentDate,
  today,
  selectedMonth,
  onDateChange,
}) => {
  const { colors } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [initialized, setInitialized] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [trackWidth, setTrackWidth] = useState(0);

  const effectiveTrackW =
    trackWidth > 0 ? trackWidth : FALLBACK_TRACK_W;
  const dayItemWidth = useMemo(
    () =>
      (effectiveTrackW - ITEM_SPACING * (VISIBLE_ITEMS + 1)) / VISIBLE_ITEMS,
    [effectiveTrackW]
  );

  // Find current date index in the date range
  const currentDateIndex = useMemo(() => {
    return dateRange.findIndex(
      (date) =>
        date.getDate() === currentDate.getDate() &&
        date.getMonth() === currentDate.getMonth() &&
        date.getFullYear() === currentDate.getFullYear()
    );
  }, [dateRange, currentDate]);

  const todayIndex = useMemo(() => {
    return dateRange.findIndex(
      (date) =>
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
  }, [dateRange, today]);

  // Check if current selected date is today
  const isCurrentDateToday = useMemo(() => {
    return (
      currentDate.getDate() === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  }, [currentDate, today]);

  // Scroll to the current date when component mounts or when currentDate changes
  useEffect(() => {
    if (flatListRef.current && currentDateIndex !== -1) {
      // Add a delay to ensure the FlatList is properly rendered
      setTimeout(
        () => {
          flatListRef.current?.scrollToIndex({
            index: currentDateIndex,
            animated: !initialized,
            viewPosition: 0.5, // Center the selected date
          });

          if (!initialized) {
            setInitialized(true);
          }
        },
        initialized ? 10 : 300
      );
    }
  }, [currentDateIndex, dayItemWidth, initialized]);

  // Check if a date is today
  const isToday = (date: Date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Check if a date is selected
  const isSelected = (date: Date) => {
    return (
      date.getDate() === currentDate.getDate() &&
      date.getMonth() === currentDate.getMonth() &&
      date.getFullYear() === currentDate.getFullYear()
    );
  };

  // Format date for accessibility
  const formatDateForAccessibility = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Handle scroll failure (e.g., if the index is out of bounds)
  const handleScrollToIndexFailed = () => {
    // Try again with a timeout
    setTimeout(() => {
      if (flatListRef.current && currentDateIndex >= 0) {
        flatListRef.current.scrollToOffset({
          offset:
            currentDateIndex * (dayItemWidth + ITEM_SPACING) -
            (effectiveTrackW - dayItemWidth) / 2,
          animated: true,
        });
      }
    }, 100);
  };

  // Handle date picker modal
  const handleDatePickerConfirm = (selectedDate: Date) => {
    onDateChange(selectedDate);
    setIsDatePickerVisible(false);
  };

  const handleDatePickerCancel = () => {
    setIsDatePickerVisible(false);
  };

  const handleMonthPress = () => {
    setIsDatePickerVisible(true);
  };

  // Render each date item
  const renderDateItem = ({ item: date }: { item: Date; index: number }) => {
    const _isToday = isToday(date);
    const _isSelected = isSelected(date);
    const isFirstDayOfMonth = date.getDate() === 1;

    const monthAbbr = isFirstDayOfMonth
      ? date.toLocaleDateString(undefined, { month: "short" })
      : "";
    const weekdayShort = date
      .toLocaleDateString(undefined, { weekday: "short" })
      .replace(/\.$/, "");

    return (
      <TouchableOpacity
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={formatDateForAccessibility(date)}
        accessibilityState={{ selected: _isSelected }}
        accessibilityHint={`Select ${formatDateForAccessibility(
          date
        )} as the current date`}
        style={[
          styles.dateItem,
          { width: dayItemWidth },
          _isSelected && [{ backgroundColor: colors.primary }],
        ]}
        onPress={() => onDateChange(date)}
        activeOpacity={0.7}>
        {isFirstDayOfMonth && (
          <View style={styles.monthBadgeRow} pointerEvents="none">
            <View
              style={[
                styles.monthBadge,
                {
                  backgroundColor: _isSelected
                    ? colors.primary + "70"
                    : colors.primary + "20",
                },
              ]}>
              <Text
                style={[
                  styles.monthBadgeText,
                  { color: _isSelected ? colors.onPrimary : colors.primary },
                ]}>
                {monthAbbr}
              </Text>
            </View>
          </View>
        )}

        <View
          style={[
            styles.dateCellInner,
            isFirstDayOfMonth && styles.dateCellInnerWithBadge,
          ]}>
          <Text
            style={[
              styles.dayName,
              {
                color: _isSelected ? colors.onPrimary : colors.textSecondary,
              },
            ]}>
            {weekdayShort.slice(0, 3)}
          </Text>

          <Text
            style={[
              styles.dateNumber,
              {
                color: _isSelected ? colors.onPrimary : colors.text,
              },
              _isToday &&
                !_isSelected && [styles.todayText, { color: colors.primary }],
            ]}
            maxFontSizeMultiplier={1.45}>
            {date.getDate()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && Math.abs(w - trackWidth) > 1) {
          setTrackWidth(w);
        }
      }}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
        },
        Platform.select({
          ios: {
            shadowColor: colors.shadowColor,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 2,
          },
          android: {
            elevation: 2,
          },
        }),
      ]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.monthDisplay}
          onPress={handleMonthPress}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Select date for ${selectedMonth}`}
          accessibilityHint="Opens date picker to select a different month and year">
          <Text
            style={[typography.titleMedium, { color: colors.primary }]}>
            {selectedMonth}
          </Text>
        </TouchableOpacity>
        {!isCurrentDateToday && (
          <AnimatedTodayButton
            onPress={() => {
              if (todayIndex !== -1) {
                onDateChange(today);
                setTimeout(() => {
                  flatListRef.current?.scrollToIndex({
                    index: todayIndex,
                    animated: true,
                    viewPosition: 0.5,
                  });
                }, 10);
              }
            }}
            text="Today"
          />
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={dateRange}
        keyExtractor={(_item, index) => `date-${index}`}
        renderItem={renderDateItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateListContent}
        decelerationRate="fast"
        snapToInterval={dayItemWidth + ITEM_SPACING}
        snapToAlignment="center"
        onScrollToIndexFailed={handleScrollToIndexFailed}
        getItemLayout={(_data, index) => ({
          length: dayItemWidth + ITEM_SPACING,
          offset: (dayItemWidth + ITEM_SPACING) * index,
          index,
        })}
        initialNumToRender={VISIBLE_ITEMS * 2}
      />

      <DateTimeModal
        visible={isDatePickerVisible}
        mode="date"
        value={currentDate}
        onConfirm={handleDatePickerConfirm}
        onCancel={handleDatePickerCancel}
        title="Select Date"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: SIZES.medium,
    paddingBottom: SIZES.small,
    marginBottom: SIZES.small,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SIZES.medium,
    marginBottom: SIZES.small,
  },
  dateListContent: {
    paddingHorizontal: SIZES.small,
    paddingBottom: 0,
  },
  monthDisplay: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateItem: {
    minHeight: 60,
    paddingVertical: 4,
    marginHorizontal: ITEM_SPACING / 2,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: SIZES.base,
    backgroundColor: "transparent",
  },
  dateCellInner: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  dateCellInnerWithBadge: {
    paddingTop: 14,
  },

  dayName: {
    ...typography.bodySmallSemiBold,
    marginBottom: 4,
    width: "100%",
    textAlign: "center",
    ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
  },
  dateNumber: {
    ...typography.headline,
    width: "100%",
    textAlign: "center",
    ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
  },
  todayText: {
    ...typography.headlineBold,
  },

  monthBadgeRow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1,
  },
  monthBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  monthBadgeText: {
    ...typography.captionSemiBold,
  },
});

export default DateSlider;
