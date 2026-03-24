import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { RADII } from "../../theme";

interface FilterButtonProps {
  onPress: () => void;
  label?: string;
  showShadow?: boolean;
  /** Number of active category + priority filters (excludes date). */
  activeFilterCount?: number;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  onPress,
  label = "Filter tasks",
  showShadow = true,
  activeFilterCount = 0,
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const hasFilters = activeFilterCount > 0;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 1.06,
      duration: 140,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.fab,
        {
          backgroundColor: colors.card,
          borderColor: hasFilters ? colors.primary : colors.border,
          borderWidth: hasFilters ? 1.5 : 1,
        },
        showShadow && [styles.shadow, { shadowColor: colors.shadowColor }],
        { transform: [{ scale: scaleAnim }] },
      ]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={
          hasFilters
            ? `${label}, ${activeFilterCount} active`
            : label
        }
        accessibilityRole="button"
        accessibilityState={{ expanded: false }}
        style={styles.touchable}>
        <Ionicons
          name="funnel-outline"
          size={22}
          color={hasFilters ? colors.primary : colors.text}
        />
      </TouchableOpacity>
      {hasFilters ? (
        <View
          style={[styles.badge, { backgroundColor: colors.primary }]}
          accessibilityElementsHidden
          importantForAccessibility="no">
          <Text style={[styles.badgeText, { color: colors.onPrimary }]}>
            {activeFilterCount > 9 ? "9+" : String(activeFilterCount)}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fab: {
    width: 56,
    height: 56,
    borderRadius: RADII.fab,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  touchable: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: RADII.fab,
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
});

export default FilterButton;
