import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { PRIORITY_COLORS, RADII, SIZES } from "../../theme";
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

const runHaptic = () => {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

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
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (reducedMotion) {
      opacityAnim.setValue(visible ? 1 : 0);
      translateAnim.setValue(visible ? 0 : 10);
      return;
    }
    const easing = Easing.out(Easing.cubic);
    const duration = 260;
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration,
          easing,
          useNativeDriver: true,
        }),
        Animated.timing(translateAnim, {
          toValue: 0,
          duration,
          easing,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateAnim, {
          toValue: 10,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, reducedMotion, opacityAnim, translateAnim]);

  if (!visible) return null;

  const bottomOffset = (Platform.OS === "ios" ? 34 : 20) + 56 + 12;

  const categoryChip = (selected: boolean) => ({
    backgroundColor: selected ? colors.primary : colors.inputBackground,
    borderColor: selected ? colors.primary : colors.border,
  });

  const priorityChipColors = (prio: TaskPriority | "all", selected: boolean) => {
    if (!selected) {
      return {
        backgroundColor: colors.inputBackground,
        borderColor: colors.border,
        labelColor: colors.text,
      };
    }
    if (prio === "all") {
      return {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
        labelColor: colors.onPrimary,
      };
    }
    const tint = PRIORITY_COLORS[prio];
    return {
      backgroundColor: `${tint}28`,
      borderColor: tint,
      labelColor: colors.text,
    };
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss filters">
        <BlurView
          intensity={isDark ? 32 : 40}
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
            opacity: opacityAnim,
            transform: [{ translateY: translateAnim }],
          },
        ]}>
        <View style={styles.titleRow}>
          <View
            style={[styles.accentBar, { backgroundColor: colors.primary }]}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={[typography.title, { color: colors.text, flex: 1 }]}>
            Filters
          </Text>
        </View>
        <View style={[styles.titleRule, { backgroundColor: colors.divider }]} />

        <Text
          style={[
            typography.label,
            styles.sectionLabel,
            { color: colors.textSecondary },
          ]}>
          Category
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}>
          <Pressable
            onPress={() => {
              runHaptic();
              onCategoryChange(null);
            }}
            style={({ pressed }) => [
              styles.chip,
              categoryChip(activeCategory === null),
              pressed && styles.chipPressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: activeCategory === null }}>
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
          {categories.map((category) => {
            const selected = activeCategory === category;
            return (
              <Pressable
                key={category}
                onPress={() => {
                  runHaptic();
                  onCategoryChange(category);
                }}
                style={({ pressed }) => [
                  styles.chip,
                  categoryChip(selected),
                  pressed && styles.chipPressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected }}>
                <Text
                  style={[
                    typography.captionMedium,
                    {
                      color: selected ? colors.onPrimary : colors.text,
                    },
                  ]}>
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text
          style={[
            typography.label,
            styles.sectionLabel,
            { color: colors.textSecondary },
          ]}>
          Priority
        </Text>
        <View style={styles.row}>
          {(["all", "high", "normal", "low"] as const).map((prio) => {
            const selected = selectedPriority === prio;
            const pc = priorityChipColors(prio, selected);
            return (
              <Pressable
                key={prio}
                onPress={() => {
                  runHaptic();
                  onPriorityChange(prio);
                }}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: pc.backgroundColor,
                    borderColor: pc.borderColor,
                  },
                  pressed && styles.chipPressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected }}>
                <Text
                  style={[
                    typography.captionMedium,
                    { color: pc.labelColor },
                  ]}>
                  {prio === "all"
                    ? "All"
                    : prio.charAt(0).toUpperCase() + prio.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.footerRow}>
          <Pressable
            onPress={() => {
              runHaptic();
              onClear();
            }}
            style={({ pressed }) => [
              styles.footerButton,
              { borderColor: colors.border },
              pressed && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Reset filters">
            <Text style={[typography.captionSemiBold, { color: colors.text }]}>
              Reset
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              runHaptic();
              onClose();
            }}
            style={({ pressed }) => [
              styles.footerButtonPrimary,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.92 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Done">
            <Text style={[typography.captionBold, { color: colors.onPrimary }]}>
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
    alignSelf: "center",
    padding: SIZES.medium,
    borderRadius: RADII.md,
    borderWidth: 1,
    width: "88%",
    maxWidth: 400,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SIZES.small,
  },
  accentBar: {
    width: 3,
    borderRadius: 2,
    marginRight: SIZES.medium,
    alignSelf: "stretch",
    minHeight: 24,
  },
  titleRule: {
    height: StyleSheet.hairlineWidth,
    marginBottom: SIZES.medium,
  },
  sectionLabel: {
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: SIZES.small,
    marginTop: SIZES.small,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 0,
  },
  chip: {
    paddingHorizontal: SIZES.small + 2,
    paddingVertical: SIZES.small,
    borderRadius: RADII.md + 8,
    borderWidth: 1,
    marginRight: SIZES.small,
    marginBottom: SIZES.small,
    minWidth: 64,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  chipPressed: {
    opacity: 0.88,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: SIZES.medium,
    gap: SIZES.small,
  },
  footerButton: {
    paddingHorizontal: SIZES.medium,
    paddingVertical: SIZES.small,
    borderRadius: RADII.sm,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
  },
  footerButtonPrimary: {
    paddingHorizontal: SIZES.medium + 4,
    paddingVertical: SIZES.small,
    borderRadius: RADII.sm,
    minHeight: 44,
    justifyContent: "center",
  },
});

export default FilterPopup;
