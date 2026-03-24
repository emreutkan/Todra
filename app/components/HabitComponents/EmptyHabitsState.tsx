import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { SIZES } from "../../theme";
import { typography } from "../../typography";

const EmptyHabitsState: React.FC = () => {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const entrance = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const iconBob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) {
      entrance.setValue(1);
      return;
    }
    entrance.setValue(0);
    Animated.timing(entrance, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [reducedMotion, entrance]);

  useEffect(() => {
    if (reducedMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(iconBob, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(iconBob, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reducedMotion, iconBob]);

  const cardStyle = {
    opacity: entrance,
    transform: [
      {
        translateY: entrance.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  };

  const iconStyle = {
    transform: [
      {
        translateY: iconBob.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -5],
        }),
      },
    ],
    opacity: entrance.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.45, 0.38],
    }),
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.content,
          { backgroundColor: colors.card, borderColor: colors.border },
          cardStyle,
        ]}>
        <Animated.View style={iconStyle}>
          <Ionicons name="repeat-outline" size={64} color={colors.accent} />
        </Animated.View>
        <Text
          style={[typography.headline, styles.title, { color: colors.text }]}>
          Build a rhythm
        </Text>
        <Text
          style={[
            typography.bodySmall,
            styles.subtitle,
            { color: colors.textSecondary },
          ]}>
          Track vitamins, training blocks, or skincare on a schedule that fits
          you — tap + below when you’re ready.
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SIZES.medium,
    paddingVertical: SIZES.large,
  },
  content: {
    width: "100%",
    maxWidth: 340,
    paddingVertical: SIZES.extraLarge,
    paddingHorizontal: SIZES.medium,
    borderRadius: SIZES.base + 6,
    alignItems: "center",
    borderWidth: 1,
  },
  title: {
    marginTop: SIZES.medium,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginTop: SIZES.small,
    paddingHorizontal: SIZES.small,
  },
});

export default EmptyHabitsState;
