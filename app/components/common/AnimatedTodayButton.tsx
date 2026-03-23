import React, { useRef, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { typography } from "../../typography";

interface AnimatedTodayButtonProps {
  onPress: () => void;
  text?: string;
}

const COLLAPSED_SCALE = 62 / 120;

const AnimatedTodayButton: React.FC<AnimatedTodayButtonProps> = ({
  onPress,
  text = "Today",
}) => {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const scaleAnim = useRef(new Animated.Value(COLLAPSED_SCALE)).current;
  const [pressed, setPressed] = useState(false);

  const handlePressIn = () => {
    setPressed(true);
    if (reducedMotion) {
      scaleAnim.setValue(1);
      return;
    }
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    const finish = () => onPress();
    if (reducedMotion) {
      scaleAnim.setValue(COLLAPSED_SCALE);
      finish();
      return;
    }
    Animated.timing(scaleAnim, {
      toValue: COLLAPSED_SCALE,
      duration: 200,
      useNativeDriver: true,
    }).start(finish);
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}>
      <Animated.View
        style={[
          styles.container,
          {
            width: 120,
            borderColor: pressed ? colors.success : colors.border,
            backgroundColor: colors.card,
            transform: [{ scale: scaleAnim }],
          },
        ]}>
        <View style={styles.textContainer}>
          <Text
            style={[typography.captionSemiBold, { color: colors.primary }]}>
            {text}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  textContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default AnimatedTodayButton;
