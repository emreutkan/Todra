import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { RootStackParamList } from "../types";
import { typography } from "../typography";

type SplashScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Splash"
>;

const SplashScreen = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("Home");
    }, 1400);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={{
          opacity,
          transform: [{ translateY: translate }],
          alignItems: "center",
        }}>
        <Text
          style={[
            typography.displayLarge,
            { color: colors.text, textAlign: "center" },
          ]}>
          Todra
        </Text>
        <Text
          style={[
            typography.captionMedium,
            {
              color: colors.textSecondary,
              marginTop: 12,
              textAlign: "center",
              maxWidth: 260,
            },
          ]}>
          Calm tasks, warm focus
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
  },
});

export default SplashScreen;
