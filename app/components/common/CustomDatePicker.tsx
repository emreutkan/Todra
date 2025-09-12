import React, { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface CustomDatePickerProps {
  value: Date;
  mode: "date" | "time";
  onDateChange: (date: Date) => void;
  minimumDate?: Date;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  mode,
  onDateChange,
  minimumDate,
}) => {
  const { colors } = useTheme();
  const [tempDate, setTempDate] = useState(value);

  const handleDateChange = (newDate: Date) => {
    setTempDate(newDate);
    onDateChange(newDate);
  };

  // iOS-style wheel shared column
  const ITEM_HEIGHT = 40;
  const VISIBLE = 5;
  const WHEEL_PAD = (ITEM_HEIGHT * (VISIBLE - 1)) / 2;

  const Wheel = <T extends unknown>({
    data,
    index,
    onChange,
    format,
    width = 110,
  }: {
    data: T[];
    index: number;
    onChange: (i: number) => void;
    format: (v: T) => string;
    width?: number;
  }) => {
    const listRef = useRef<FlatList>(null);
    const [hoverIndex, setHoverIndex] = useState(index);

    useEffect(() => {
      try {
        listRef.current?.scrollToOffset({
          offset: index * ITEM_HEIGHT,
          animated: false,
        });
      } catch {}
      setHoverIndex(index);
    }, [index, data.length]);

    const snap = (e: any) => {
      const y = e.nativeEvent.contentOffset.y || 0;
      const i = Math.max(
        0,
        Math.min(data.length - 1, Math.round(y / ITEM_HEIGHT))
      );
      listRef.current?.scrollToOffset({
        offset: i * ITEM_HEIGHT,
        animated: true,
      });
      if (i !== index) onChange(i);
      setHoverIndex(i);
    };

    const handleScroll = (e: any) => {
      const y = e.nativeEvent.contentOffset.y || 0;
      const i = Math.max(
        0,
        Math.min(data.length - 1, Math.round(y / ITEM_HEIGHT))
      );
      if (i !== hoverIndex) setHoverIndex(i);
    };

    return (
      <View
        style={[
          styles.wheelColumn,
          { width, backgroundColor: colors.card, borderColor: colors.border },
        ]}>
        <View
          pointerEvents="none"
          style={[
            styles.selection,
            {
              borderColor: colors.primary + "66",
              backgroundColor: colors.primary + "0D",
            },
          ]}
        />
        <FlatList
          ref={listRef}
          data={data}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item, index: i }) => {
            const selected = i === hoverIndex;
            const distance = Math.abs(i - hoverIndex);
            const opacity = distance === 0 ? 1 : distance === 1 ? 0.75 : 0.45;
            return (
              <View
                style={[
                  styles.wheelItem,
                  {
                    backgroundColor: selected
                      ? colors.primary + "10"
                      : colors.card,
                  },
                ]}>
                <Text
                  style={[
                    styles.itemText,
                    { color: selected ? colors.primary : colors.text, opacity },
                  ]}>
                  {format(item)}
                </Text>
              </View>
            );
          }}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={snap}
          contentContainerStyle={{ paddingVertical: WHEEL_PAD }}
          getItemLayout={(_, i) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * i,
            index: i,
          })}
        />
      </View>
    );
  };

  if (mode === "time") {
    let hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
    hours = hours.concat(hours).concat(hours).concat(hours);
    const step = 1;
    let minutes = useMemo(
      () => Array.from({ length: 60 / step }, (_, i) => i * step),
      []
    );
    minutes = minutes.concat(minutes).concat(minutes).concat(minutes);
    const hourIndex = tempDate.getHours();
    const minuteIndex = Math.round(tempDate.getMinutes() / step);

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.row}>
          <Wheel
            data={hours}
            index={hourIndex}
            onChange={(i) => {
              const d = new Date(tempDate);
              d.setHours(hours[i]);
              handleDateChange(d);
            }}
            format={(v) => String(v).padStart(2, "0")}
          />
          <View style={styles.separator}>
            <Text style={[styles.separatorText, { color: colors.text }]}>
              :
            </Text>
          </View>
          <Wheel
            data={minutes}
            index={minuteIndex}
            onChange={(i) => {
              const d = new Date(tempDate);
              d.setMinutes(minutes[i]);
              handleDateChange(d);
            }}
            format={(v) => String(v).padStart(2, "0")}
          />
        </View>
      </View>
    );
  }

  // Date picker (Month / Day / Year wheels)
  let monthNames = useMemo(
    () => [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    []
  );
  monthNames = monthNames
    .concat(monthNames)
    .concat(monthNames)
    .concat(monthNames);

  const selectedYear = tempDate.getFullYear();
  const selectedMonth = tempDate.getMonth();
  const selectedDay = tempDate.getDate();

  const minYear = useMemo(
    () => (minimumDate ? minimumDate.getFullYear() : selectedYear - 50),
    [minimumDate, selectedYear]
  );
  const maxYear = minYear + 100;
  const years = useMemo(
    () => Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i),
    [minYear, maxYear]
  );

  const daysInMonth = useMemo(
    () => new Date(selectedYear, selectedMonth + 1, 0).getDate(),
    [selectedYear, selectedMonth]
  );
  const days = useMemo(() => {
    const dayArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    return dayArray.concat(dayArray).concat(dayArray).concat(dayArray);
  }, [daysInMonth]);

  const yearIndex = years.findIndex((y) => y === selectedYear);
  const monthIndex = selectedMonth;
  const dayIndex = Math.min(selectedDay, daysInMonth) - 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.row}>
        <Wheel
          data={monthNames}
          index={monthIndex}
          onChange={(i) => {
            const d = new Date(tempDate);
            d.setMonth(i);
            const max = new Date(
              d.getFullYear(),
              d.getMonth() + 1,
              0
            ).getDate();
            if (d.getDate() > max) d.setDate(max);
            handleDateChange(d);
          }}
          format={(m) => String(m)}
        />

        <Wheel
          data={days}
          index={dayIndex}
          onChange={(i) => {
            const d = new Date(tempDate);
            d.setDate(days[i]);
            handleDateChange(d);
          }}
          format={(n) => String(n).padStart(2, "0")}
        />

        <Wheel
          data={years}
          index={yearIndex}
          onChange={(i) => {
            const d = new Date(tempDate);
            d.setFullYear(years[i]);
            const max = new Date(
              d.getFullYear(),
              d.getMonth() + 1,
              0
            ).getDate();
            if (d.getDate() > max) d.setDate(max);
            handleDateChange(d);
          }}
          format={(y) => String(y)}
          width={120}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 250,
    borderRadius: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "stretch",
    flex: 1,
  },
  wheelColumn: {
    width: 110,
    marginHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  selection: {
    // position: "absolute",
    top: "49.2%", // DO NOT CHANGE THIS
    left: 0,
    right: 0,
    height: 44,
    marginTop: -18, // DO NOT CHANGE THIS
    borderWidth: 1,
    borderRadius: 8,
    zIndex: 100,
  },
  wheelItem: {
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  separator: {
    justifyContent: "center",
    alignItems: "center",
    width: 24,
    height: 250,
  },
  separatorText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  itemText: {
    fontSize: 18,
    fontWeight: "500",
  },
});

export default CustomDatePicker;
