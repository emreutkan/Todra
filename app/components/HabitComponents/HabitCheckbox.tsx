import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, TouchableOpacity } from "react-native";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useTheme } from "../../context/ThemeContext";

const PRESS_IN = 0.88;

type Props = {
  checked: boolean;
  onToggle: () => void;
  accentColor: string;
  disabled?: boolean;
};

const runHaptic = (fn: () => Promise<void>) => {
  void fn().catch(() => {});
};

const HabitCheckbox: React.FC<Props> = ({
  checked,
  onToggle,
  accentColor,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const pressAnim = useRef(new Animated.Value(1)).current;
  const checkPop = useRef(new Animated.Value(checked ? 1 : 0)).current;
  const prevChecked = useRef(checked);

  useEffect(() => {
    const becameChecked = checked && !prevChecked.current;
    prevChecked.current = checked;

    if (!checked) {
      checkPop.setValue(0);
      return;
    }

    if (reducedMotion) {
      checkPop.setValue(1);
      return;
    }

    if (becameChecked) {
      checkPop.setValue(0);
      Animated.spring(checkPop, {
        toValue: 1,
        friction: 7,
        tension: 140,
        useNativeDriver: true,
      }).start();
    } else {
      checkPop.setValue(1);
    }
  }, [checked, reducedMotion, checkPop]);

  const handlePressIn = () => {
    if (reducedMotion) {
      pressAnim.setValue(PRESS_IN);
      return;
    }
    Animated.timing(pressAnim, {
      toValue: PRESS_IN,
      duration: 90,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (reducedMotion) {
      pressAnim.setValue(1);
      return;
    }
    Animated.spring(pressAnim, {
      toValue: 1,
      friction: 8,
      tension: 220,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (disabled) return;
    if (!checked) {
      runHaptic(() =>
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      );
    } else {
      runHaptic(() => Haptics.selectionAsync());
    }
    onToggle();
  };

  return (
    <Animated.View
      style={[
        styles.box,
        {
          backgroundColor: checked ? accentColor : colors.surface,
          borderColor: checked ? accentColor : colors.border,
          transform: [{ scale: pressAnim }],
          opacity: disabled ? 0.45 : 1,
        },
      ]}>
      {checked ? (
        <Animated.View
          style={[styles.checkWrap, { transform: [{ scale: checkPop }] }]}
          pointerEvents="none">
          <Ionicons name="checkmark" size={16} color={colors.onPrimary} />
        </Animated.View>
      ) : null}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={StyleSheet.absoluteFill}
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled }}
        accessibilityLabel={checked ? "Mark habit incomplete" : "Mark habit done"}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  box: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  checkWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default HabitCheckbox;
