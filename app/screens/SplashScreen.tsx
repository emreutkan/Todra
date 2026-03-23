import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../context/ThemeContext";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { SIZES } from "../theme";
import { RootStackParamList } from "../types";
import { typography } from "../typography";

type SplashScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Splash"
>;

const AUTO_ADVANCE_MS = 2200;

const SplashScreen = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const translate = useRef(new Animated.Value(reducedMotion ? 0 : 14)).current;
  const hintOpacity = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const hasNavigated = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goHome = useCallback(() => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    navigation.replace("Home");
  }, [navigation]);

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(1);
      translate.setValue(0);
      hintOpacity.setValue(1);
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 640,
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration: 640,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(hintOpacity, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }).start();
    });
  }, [reducedMotion, opacity, translate, hintOpacity]);

  useEffect(() => {
    timerRef.current = setTimeout(goHome, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [goHome]);

  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + SIZES.extraLarge,
          paddingBottom: insets.bottom + SIZES.medium,
          paddingHorizontal: SIZES.medium,
        },
      ]}
      onPress={goHome}
      accessibilityRole="button"
      accessibilityLabel="Continue to home"
      accessibilityHint="Opens your task list. Waits a moment if you do not tap.">
      <View style={styles.inner}>
        <View style={styles.heroBlock}>
          <Animated.View
            style={{
              opacity,
              transform: [{ translateY: translate }],
              alignItems: "center",
              maxWidth: 320,
            }}>
            <View
              style={[
                styles.accentBar,
                { backgroundColor: colors.primary },
              ]}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
            <Text
              style={[
                typography.displayLarge,
                { color: colors.text, textAlign: "center" },
              ]}>
              Todra
            </Text>
            <Text
              style={[
                typography.subbodySemiBold,
                {
                  color: colors.primary,
                  marginTop: SIZES.medium,
                  textAlign: "center",
                },
              ]}>
              Calm tasks, warm focus
            </Text>
            <Text
              style={[
                typography.bodySmall,
                {
                  color: colors.textSecondary,
                  marginTop: SIZES.medium,
                  textAlign: "center",
                  lineHeight: 22,
                },
              ]}>
              Add tasks, set due dates, and use reminders so nothing slips through.
            </Text>
          </Animated.View>
        </View>

        <Animated.Text
          style={[
            typography.captionMedium,
            styles.tapHint,
            {
              color: colors.textSecondary,
              opacity: hintOpacity,
            },
          ]}>
          Tap anywhere to continue
        </Animated.Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    width: "100%",
    alignItems: "center",
  },
  heroBlock: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  tapHint: {
    textAlign: "center",
    paddingBottom: SIZES.small,
  },
  accentBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: SIZES.large,
  },
});

export default SplashScreen;
