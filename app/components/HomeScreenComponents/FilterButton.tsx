import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import { Animated, Platform, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface FilterButtonProps {
  onPress: () => void;
  label?: string;
  showShadow?: boolean;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  onPress,
  label = "Filter Tasks",
  showShadow = true,
}) => {
  const { colors } = useTheme();
  const pressAnim = useRef(new Animated.Value(1)).current;
  const sizeAnim = useRef(new Animated.Value(56)).current; // Add this for actual size
  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(pressAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(sizeAnim, {
        toValue: 67, // 56 * 1.2 = 67
        duration: 200,
        useNativeDriver: false, // Can't use native driver for layout properties
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(pressAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(sizeAnim, {
        toValue: 56,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={[
        styles.fab,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          width: sizeAnim, // Use animated width
          height: sizeAnim, // Use animated height
          borderRadius: Animated.divide(sizeAnim, 2), // Keep it circular
        },
        showShadow && [styles.shadow],
        { transform: [{ scale: pressAnim }] },
      ]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={label}
        accessibilityRole="button"
        style={styles.touchable}>
        <Ionicons name="funnel" size={22} color={colors.text} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  touchable: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 28,
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
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
