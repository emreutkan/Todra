import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import { Animated, Platform, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface AddButtonProps {
  onPress: () => void;
  label?: string;
  showShadow?: boolean;
}

const AddButton: React.FC<AddButtonProps> = ({
  onPress,
  label = "Add New Task",
  showShadow = true,
}) => {
  const { colors } = useTheme();
  const pressAnim = useRef(new Animated.Value(1)).current;
  const sizeAnim = useRef(new Animated.Value(70)).current; // Base width for AddButton
  const heightAnim = useRef(new Animated.Value(56)).current; // Base height for AddButton

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(pressAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(sizeAnim, {
        toValue: 84, // 70 * 1.2 = 84
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(heightAnim, {
        toValue: 67, // 56 * 1.2 = 67
        duration: 200,
        useNativeDriver: false,
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
        toValue: 70,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(heightAnim, {
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
          backgroundColor: colors.primary,
          width: sizeAnim,
          height: heightAnim,
          borderRadius: Animated.divide(heightAnim, 2),
        },
        showShadow && [styles.shadow, { shadowColor: colors.primary }],
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
        <Ionicons name="add" size={24} color={colors.onPrimary} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fab: {
    width: 70,
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
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});

export default AddButton;
