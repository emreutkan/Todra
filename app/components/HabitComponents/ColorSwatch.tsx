import React, { useRef } from "react";
import { Animated, Easing, StyleSheet, TouchableOpacity } from "react-native";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useTheme } from "../../context/ThemeContext";

type Props = {
  color: string;
  selected: boolean;
  onSelect: () => void;
};

const ColorSwatch: React.FC<Props> = ({ color, selected, onSelect }) => {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useRef(new Animated.Value(selected ? 1.08 : 1)).current;

  React.useEffect(() => {
    if (reducedMotion) {
      scale.setValue(selected ? 1.06 : 1);
      return;
    }
    Animated.timing(scale, {
      toValue: selected ? 1.12 : 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [selected, reducedMotion, scale]);

  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Color ${color}`}
      accessibilityState={{ selected }}>
      <Animated.View
        style={[
          styles.swatch,
          {
            backgroundColor: color,
            transform: [{ scale }],
            borderColor: selected ? colors.text : "transparent",
            borderWidth: selected ? 2 : 0,
          },
        ]}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
});

export default ColorSwatch;
