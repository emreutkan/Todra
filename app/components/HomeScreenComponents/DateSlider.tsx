import * as Haptics from "expo-haptics";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated as RNAnimated,
  Dimensions,
  Easing,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing as ReanimatedEasing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { HOME_GUTTER, SIZES, ThemeColors } from "../../theme";
import { typography } from "../../typography";
import AnimatedTodayButton from "../common/AnimatedTodayButton";
import DateTimeModal from "../common/DateTimeModal";

const WINDOW_WIDTH = Dimensions.get("window").width;
const FALLBACK_TRACK_W = WINDOW_WIDTH;
const VISIBLE_ITEMS = 5;
const ITEM_SPACING = 6;
/** Nudge calendar chrome slightly into the status region (px). */
const HEADER_BLEED_INTO_SAFE = 8;

interface DateDayCellProps {
  date: Date;
  dayItemWidth: number;
  isToday: boolean;
  isSelected: boolean;
  isFirstDayOfMonth: boolean;
  monthAbbr: string;
  weekdayShort: string;
  colors: ThemeColors;
  reducedMotion: boolean;
  onSelect: (d: Date) => void;
  formatA11y: (d: Date) => string;
}

const DateDayCell = memo(function DateDayCell({
  date,
  dayItemWidth,
  isToday: _isToday,
  isSelected: _isSelected,
  isFirstDayOfMonth,
  monthAbbr,
  weekdayShort,
  colors,
  reducedMotion,
  onSelect,
  formatA11y,
}: DateDayCellProps) {
  const scale = useSharedValue(_isSelected ? 1.04 : 1);

  useEffect(() => {
    if (reducedMotion) {
      scale.value = _isSelected ? 1.02 : 1;
      return;
    }
    scale.value = withTiming(_isSelected ? 1.06 : 1, {
      duration: 240,
      easing: ReanimatedEasing.out(ReanimatedEasing.cubic),
    });
  }, [_isSelected, reducedMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(date);
  }, [date, onSelect]);

  return (
    <TouchableOpacity
      accessible
      accessibilityRole="button"
      accessibilityLabel={formatA11y(date)}
      accessibilityState={{ selected: _isSelected }}
      accessibilityHint={`Select ${formatA11y(date)} as the current date`}
      style={[styles.dateItemOuter, { width: dayItemWidth }]}
      onPress={handlePress}
      activeOpacity={0.85}>
      <Animated.View
        style={[
          styles.dateItem,
          _isSelected && { backgroundColor: colors.primary },
          !reducedMotion && animatedStyle,
        ]}>
        {isFirstDayOfMonth ? (
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
        ) : null}

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
      </Animated.View>
    </TouchableOpacity>
  );
});

interface DateSliderProps {
  dateRange: Date[];
  currentDate: Date;
  today: Date;
  selectedMonth: string;
  onDateChange: (date: Date) => void;
  /** Top safe inset from `useSafeAreaInsets().top` — pulls header slightly into the status area when set. */
  safeAreaTopInset?: number;
}

const DateSlider: React.FC<DateSliderProps> = ({
  dateRange,
  currentDate,
  today,
  selectedMonth,
  onDateChange,
  safeAreaTopInset = 0,
}) => {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const flatListRef = useRef<FlatList>(null);
  const [initialized, setInitialized] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [trackWidth, setTrackWidth] = useState(0);
  const monthOpacity = useRef(new RNAnimated.Value(1)).current;
  const monthLabelHasAnimated = useRef(false);

  const topPadding = useMemo(() => {
    const inset = safeAreaTopInset > 0 ? safeAreaTopInset : SIZES.medium + 12;
    const fromSafe = Math.max(inset - HEADER_BLEED_INTO_SAFE, 12);
    return fromSafe + SIZES.small;
  }, [safeAreaTopInset]);

  const effectiveTrackW =
    trackWidth > 0 ? trackWidth : FALLBACK_TRACK_W;
  const dayItemWidth = useMemo(
    () =>
      (effectiveTrackW - ITEM_SPACING * (VISIBLE_ITEMS + 1)) / VISIBLE_ITEMS,
    [effectiveTrackW]
  );

  const listHorizontalPad = useMemo(() => {
    const used =
      VISIBLE_ITEMS * dayItemWidth + (VISIBLE_ITEMS + 1) * ITEM_SPACING;
    return Math.max(0, (effectiveTrackW - used) / 2);
  }, [effectiveTrackW, dayItemWidth]);

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

  const isCurrentDateToday = useMemo(() => {
    return (
      currentDate.getDate() === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  }, [currentDate, today]);

  useEffect(() => {
    if (flatListRef.current && currentDateIndex !== -1) {
      setTimeout(
        () => {
          flatListRef.current?.scrollToIndex({
            index: currentDateIndex,
            animated: !initialized,
            viewPosition: 0.5,
          });

          if (!initialized) {
            setInitialized(true);
          }
        },
        initialized ? 10 : 300
      );
    }
  }, [currentDateIndex, dayItemWidth, initialized]);

  useEffect(() => {
    if (!monthLabelHasAnimated.current) {
      monthLabelHasAnimated.current = true;
      return;
    }
    if (reducedMotion) {
      monthOpacity.setValue(1);
      return;
    }
    monthOpacity.setValue(0.72);
    RNAnimated.timing(monthOpacity, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [selectedMonth, reducedMotion, monthOpacity]);

  const isToday = useCallback(
    (date: Date) =>
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear(),
    [today]
  );

  const isSelected = useCallback(
    (date: Date) =>
      date.getDate() === currentDate.getDate() &&
      date.getMonth() === currentDate.getMonth() &&
      date.getFullYear() === currentDate.getFullYear(),
    [currentDate]
  );

  const formatDateForAccessibility = useCallback((date: Date) => {
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const handleScrollToIndexFailed = useCallback(() => {
    setTimeout(() => {
      if (flatListRef.current && currentDateIndex >= 0) {
        const stride = dayItemWidth + ITEM_SPACING;
        flatListRef.current.scrollToOffset({
          offset:
            listHorizontalPad +
            currentDateIndex * stride -
            (effectiveTrackW - dayItemWidth) / 2,
          animated: true,
        });
      }
    }, 100);
  }, [
    currentDateIndex,
    dayItemWidth,
    effectiveTrackW,
    listHorizontalPad,
  ]);

  const handleDatePickerConfirm = (selectedDate: Date) => {
    onDateChange(selectedDate);
    setIsDatePickerVisible(false);
  };

  const handleMonthPress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsDatePickerVisible(true);
  }, []);

  const renderDateItem = useCallback(
    ({ item: date }: { item: Date }) => {
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
        <DateDayCell
          date={date}
          dayItemWidth={dayItemWidth}
          isToday={_isToday}
          isSelected={_isSelected}
          isFirstDayOfMonth={isFirstDayOfMonth}
          monthAbbr={monthAbbr}
          weekdayShort={weekdayShort}
          colors={colors}
          reducedMotion={reducedMotion}
          onSelect={onDateChange}
          formatA11y={formatDateForAccessibility}
        />
      );
    },
    [
      dayItemWidth,
      colors,
      reducedMotion,
      onDateChange,
      formatDateForAccessibility,
      isToday,
      isSelected,
    ]
  );

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
          paddingTop: topPadding,
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
          accessible
          accessibilityRole="button"
          accessibilityLabel={`Select date for ${selectedMonth}`}
          accessibilityHint="Opens date picker to select a different month and year">
          <RNAnimated.Text
            style={[
              typography.titleMedium,
              { color: colors.primary, opacity: monthOpacity },
            ]}
            numberOfLines={1}>
            {selectedMonth}
          </RNAnimated.Text>
        </TouchableOpacity>
        <View style={styles.todaySlot} pointerEvents="box-none">
          {!isCurrentDateToday ? (
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
          ) : null}
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={dateRange}
        keyExtractor={(_item, index) => `date-${index}`}
        renderItem={renderDateItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.dateListContent,
          { paddingHorizontal: listHorizontalPad },
        ]}
        decelerationRate="fast"
        snapToInterval={dayItemWidth + ITEM_SPACING}
        snapToAlignment="center"
        onScrollToIndexFailed={handleScrollToIndexFailed}
        getItemLayout={(_data, index) => ({
          length: dayItemWidth + ITEM_SPACING,
          offset:
            listHorizontalPad + (dayItemWidth + ITEM_SPACING) * index,
          index,
        })}
        initialNumToRender={VISIBLE_ITEMS * 2}
      />

      <DateTimeModal
        visible={isDatePickerVisible}
        mode="date"
        value={currentDate}
        onConfirm={handleDatePickerConfirm}
        onCancel={() => setIsDatePickerVisible(false)}
        title="Select Date"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: SIZES.small,
    marginBottom: SIZES.small,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: HOME_GUTTER,
    marginBottom: SIZES.small,
    minHeight: 38,
  },
  todaySlot: {
    width: 84,
    minHeight: 34,
    marginLeft: SIZES.small,
    alignItems: "stretch",
    justifyContent: "center",
  },
  dateListContent: {
    paddingBottom: 0,
  },
  monthDisplay: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    justifyContent: "flex-start",
  },
  dateItemOuter: {
    marginHorizontal: ITEM_SPACING / 2,
  },
  dateItem: {
    minHeight: 60,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: SIZES.base,
    backgroundColor: "transparent",
    width: "100%",
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
