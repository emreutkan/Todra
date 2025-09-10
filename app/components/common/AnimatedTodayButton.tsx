import React, { useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { SIZES } from "../../theme";

interface AnimatedTodayButtonProps {
  onPress: () => void;
  text?: string;
}

const AnimatedTodayButton: React.FC<AnimatedTodayButtonProps> = ({
  onPress,
  text = "Today",
}) => {
  const { colors } = useTheme();

  // Animation values
  const widthAnim = useRef(new Animated.Value(62)).current; // minWidth from original
  const borderColorAnim = useRef(new Animated.Value(0)).current;
  const textPaddingAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    // Animate width expansion
    Animated.parallel([
      Animated.timing(widthAnim, {
        toValue: 120, // Expanded width
        duration: 200,
        useNativeDriver: false,
      }),
      // Animate border color to green
      Animated.timing(borderColorAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      // Animate text padding to move it left
      Animated.timing(textPaddingAnim, {
        toValue: 50, // Move text to the left
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    // Animate back to original state
    Animated.parallel([
      Animated.timing(widthAnim, {
        toValue: 62, // Back to minWidth
        duration: 200,
        useNativeDriver: false,
      }),
      // Animate border color back to original
      Animated.timing(borderColorAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      // Animate text padding back to center
      Animated.timing(textPaddingAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      // Execute the actual onPress after animation completes
      onPress();
    });
  };

  // Interpolate border color from original to green
  const borderColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, "#22c55e"], // Green color
  });

  // Interpolate text padding for left alignment effect
  const textPaddingRight = textPaddingAnim;

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1} // Disable default opacity change
    >
      <Animated.View
        style={[
          styles.container,
          {
            width: widthAnim,
            borderColor: borderColor,
            backgroundColor: colors.card,
          },
        ]}>
        <Animated.View
          style={[
            styles.textContainer,
            {
              paddingRight: textPaddingRight,
            },
          ]}>
          <Text style={[styles.text, { color: colors.primary }]}>{text}</Text>
        </Animated.View>
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
    minWidth: 62,
    overflow: "hidden", // Ensure content doesn't overflow during animation
  },
  textContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: SIZES.small,
    fontWeight: "600",
  },
});

export default AnimatedTodayButton;
