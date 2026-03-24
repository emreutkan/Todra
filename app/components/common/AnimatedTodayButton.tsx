import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { typography } from "../../typography";

interface AnimatedTodayButtonProps {
  onPress: () => void;
  text?: string;
}

/** Compact chip for the date header: fixed footprint, opacity fade-in only (no scale). */
const AnimatedTodayButton: React.FC<AnimatedTodayButtonProps> = ({
  onPress,
  text = "Today",
}) => {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(1);
      return;
    }
    opacity.setValue(0);
    const t = Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    t.start();
    return () => t.stop();
  }, [opacity, reducedMotion]);

  return (
    <Animated.View style={[styles.wrap, { opacity }]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.72}
        accessibilityRole="button"
        accessibilityLabel={text}
        accessibilityHint="Jump to today’s date"
        style={[
          styles.chip,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
          },
        ]}>
        <Text style={[typography.captionSemiBold, { color: colors.primary }]}>
          {text}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "stretch",
    justifyContent: "center",
  },
  chip: {
    minHeight: 34,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default AnimatedTodayButton;
