import { BlurView } from "expo-blur";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { SIZES } from "../../theme";
import { typography } from "../../typography";
import { TaskPriority } from "../../types";

interface FilterPopupProps {
  visible: boolean;
  categories: string[];
  activeCategory: string | null;
  selectedPriority: TaskPriority | "all";
  onClose: () => void;
  onCategoryChange: (category: string | null) => void;
  onPriorityChange: (priority: TaskPriority | "all") => void;
  onClear: () => void;
}

const FilterPopup: React.FC<FilterPopupProps> = ({
  visible,
  categories,
  activeCategory,
  selectedPriority,
  onClose,
  onCategoryChange,
  onPriorityChange,
  onClear,
}) => {
  const { colors, isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) {
      scaleAnim.setValue(visible ? 1 : 0);
      return;
    }
    if (visible) {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, reducedMotion, scaleAnim]);

  if (!visible) return null;

  const bottomOffset = (Platform.OS === "ios" ? 34 : 20) + 56 + 12;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss filters">
        <BlurView
          intensity={isDark ? 36 : 44}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      </Pressable>

      <Animated.View
        style={[
          styles.popupContainer,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            bottom: bottomOffset,
            transform: [{ scale: scaleAnim }],
          },
        ]}>
        <Text style={[typography.title, styles.popupTitle, { color: colors.text }]}>
          Filters
        </Text>

        <Text
          style={[typography.subbodySemiBold, styles.sectionLabel, { color: colors.text }]}>
          Category
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}>
          <Pressable
            onPress={() => onCategoryChange(null)}
            style={[
              styles.chip,
              {
                backgroundColor:
                  activeCategory === null ? colors.primary : "transparent",
                borderColor:
                  activeCategory === null ? colors.primary : colors.border,
              },
            ]}>
            <Text
              style={[
                typography.captionMedium,
                {
                  color:
                    activeCategory === null ? colors.onPrimary : colors.text,
                },
              ]}>
              All
            </Text>
          </Pressable>
          {categories.map((category) => (
            <Pressable
              key={category}
              onPress={() => onCategoryChange(category)}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    activeCategory === category
                      ? colors.primary
                      : "transparent",
                  borderColor:
                    activeCategory === category
                      ? colors.primary
                      : colors.border,
                },
              ]}>
              <Text
                style={[
                  typography.captionMedium,
                  {
                    color:
                      activeCategory === category
                        ? colors.onPrimary
                        : colors.text,
                  },
                ]}>
                {category}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text
          style={[typography.subbodySemiBold, styles.sectionLabel, { color: colors.text }]}>
          Priority
        </Text>
        <View style={styles.row}>
          {(["all", "high", "normal", "low"] as const).map((prio) => (
            <Pressable
              key={prio}
              onPress={() => onPriorityChange(prio)}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    selectedPriority === prio ? colors.primary : "transparent",
                  borderColor:
                    selectedPriority === prio ? colors.primary : colors.border,
                },
              ]}>
              <Text
                style={[
                  typography.captionMedium,
                  {
                    color:
                      selectedPriority === prio
                        ? colors.onPrimary
                        : colors.text,
                  },
                ]}>
                {prio === "all"
                  ? "All"
                  : prio.charAt(0).toUpperCase() + prio.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.footerRow}>
          <Pressable
            onPress={onClear}
            style={[styles.footerButton, { borderColor: colors.border }]}>
            <Text
              style={[typography.captionSemiBold, { color: colors.text }]}>
              Reset
            </Text>
          </Pressable>
          <Pressable
            onPress={onClose}
            style={[
              styles.footerButtonPrimary,
              { backgroundColor: colors.primary },
            ]}>
            <Text
              style={[typography.captionBold, { color: colors.onPrimary }]}>
              Done
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  popupContainer: {
    position: "absolute",
    right: 20,
    padding: SIZES.medium,
    borderRadius: 12,
    borderWidth: 1,
    width: "90%",
    transformOrigin: "bottom right",
  },
  popupTitle: {
    marginBottom: SIZES.small,
  },
  sectionLabel: {
    marginTop: SIZES.small,
    marginBottom: SIZES.small,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: SIZES.small,
    paddingVertical: SIZES.small,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: SIZES.small,
    minWidth: 62,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: SIZES.medium,
  },
  footerButton: {
    paddingHorizontal: SIZES.medium,
    paddingVertical: SIZES.small,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: SIZES.small,
    minHeight: 44,
    justifyContent: "center",
  },
  footerButtonPrimary: {
    paddingHorizontal: SIZES.medium,
    paddingVertical: SIZES.small,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: "center",
  },
});

export default FilterPopup;
