import { Ionicons } from "@expo/vector-icons";
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

const { width } = Dimensions.get("window");
const VISIBLE_ITEMS = 5;
const ITEM_SPACING = 6;
const DAY_ITEM_WIDTH =
  (width - ITEM_SPACING * (VISIBLE_ITEMS + 1)) / VISIBLE_ITEMS;

interface DateSliderProps {
  dateRange: Date[];
  currentDate: Date;
  today: Date;
  selectedMonth: string;
  onDateChange: (date: Date) => void;
  filterType?: "createdAt" | "dueDate";
}

const DateSlider: React.FC<DateSliderProps> = ({
  dateRange,
  currentDate,
  today,
  selectedMonth,
  onDateChange,
  filterType = "dueDate",
}) => {
  const { colors } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [initialized, setInitialized] = useState(false);

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
  }, [currentDateIndex]);

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
            currentDateIndex * (DAY_ITEM_WIDTH + ITEM_SPACING) -
            (width - DAY_ITEM_WIDTH) / 2,
          animated: true,
        });
      }
    }, 100);
  };

  // Render each date item
  const renderDateItem = ({
    item: date,
    index,
  }: {
    item: Date;
    index: number;
  }) => {
    const _isToday = isToday(date);
    const _isSelected = isSelected(date);
    const isFirstDayOfMonth = date.getDate() === 1;

    const monthAbbr = isFirstDayOfMonth
      ? date.toLocaleDateString(undefined, { month: "short" })
      : "";

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
          { width: DAY_ITEM_WIDTH },
          _isSelected && [{ backgroundColor: colors.primary }],
        ]}
        onPress={() => onDateChange(date)}
        activeOpacity={0.7}>
        {isFirstDayOfMonth && (
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
                { color: _isSelected ? colors.background : colors.primary },
              ]}>
              {monthAbbr}
            </Text>
          </View>
        )}

        <Text
          style={[
            styles.dayName,
            { color: _isSelected ? colors.background : colors.text + "CC" },
          ]}>
          {date
            .toLocaleDateString(undefined, { weekday: "short" })
            .substring(0, 2)}
        </Text>

        <Text
          style={[
            styles.dateNumber,
            { color: _isSelected ? colors.background : colors.text },
            _isToday &&
              !_isSelected && [styles.todayText, { color: colors.primary }],
          ]}>
          {date.getDate()}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
        },
      ]}>
      <View style={styles.header}>
        <View style={styles.monthDisplay}>
          <Text style={[styles.monthText, { color: colors.text }]}>
            {selectedMonth}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.todayButton,
            { backgroundColor: colors.primary + "15" },
          ]}
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
          accessibilityRole="button"
          accessibilityLabel="Go to today"
          accessibilityHint="Selects today's date in the calendar">
          <Ionicons name="today-outline" size={14} color={colors.primary} />
          <Text style={[styles.todayButtonText, { color: colors.primary }]}>
            Today
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={dateRange}
        keyExtractor={(item, index) => `date-${index}`}
        renderItem={renderDateItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={DAY_ITEM_WIDTH + ITEM_SPACING}
        snapToAlignment="center"
        onScrollToIndexFailed={handleScrollToIndexFailed}
        getItemLayout={(data, index) => ({
          length: DAY_ITEM_WIDTH + ITEM_SPACING,
          offset: (DAY_ITEM_WIDTH + ITEM_SPACING) * index,
          index,
        })}
        initialNumToRender={VISIBLE_ITEMS * 2}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 6,
  },
  monthDisplay: {
    flexDirection: "row",
    alignItems: "center",
  },
  monthText: {
    fontSize: SIZES.small + 1,
    fontWeight: "600",
  },
  todayButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  todayButtonText: {
    fontSize: SIZES.small - 1,
    fontWeight: "600",
    marginLeft: 4,
  },

  dateItem: {
    height: 70,
    marginHorizontal: ITEM_SPACING / 2,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: SIZES.base,
    backgroundColor: "transparent",
  },

  dayName: {
    fontSize: 16,
    marginBottom: 12,
    fontWeight: "500",
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: "600",
  },
  todayText: {
    fontWeight: "700",
  },

  monthBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderTopRightRadius: SIZES.base,
  },
  monthBadgeText: {
    fontSize: 9,
    fontWeight: "600",
  },
});

export default DateSlider;
