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
import { SIZES } from "../../theme";
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
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, [visible]);

  if (!visible) return null;

  const bottomOffset = (Platform.OS === "ios" ? 34 : 20) + 56 + 12;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <BlurView
          intensity={40}
          tint={"default"}
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
        <Text style={[styles.title, { color: colors.text }]}>Filters</Text>

        <Text style={[styles.sectionLabel, { color: colors.text }]}>
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
                styles.chipText,
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
                  styles.chipText,
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

        <Text style={[styles.sectionLabel, { color: colors.text }]}>
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
                  styles.chipText,
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
            <Text style={[styles.footerButtonText, { color: colors.text }]}>
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
              style={[
                styles.footerButtonTextPrimary,
                { color: colors.onPrimary },
              ]}>
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
  title: {
    fontSize: SIZES.large,
    fontWeight: "700",
    marginBottom: SIZES.small,
  },
  sectionLabel: {
    fontSize: SIZES.medium,
    fontWeight: "600",
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
    alignItems: "center",
  },
  chipText: {
    fontSize: SIZES.small,
    fontWeight: "500",
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
  },
  footerButtonPrimary: {
    paddingHorizontal: SIZES.medium,
    paddingVertical: SIZES.small,
    borderRadius: 8,
  },
  footerButtonText: {
    fontSize: SIZES.small,
    fontWeight: "600",
  },
  footerButtonTextPrimary: {
    fontSize: SIZES.small,
    fontWeight: "700",
  },
});

export default FilterPopup;
