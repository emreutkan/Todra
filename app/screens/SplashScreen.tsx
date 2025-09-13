import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { RootStackParamList } from "../types";

type SplashScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Splash"
>;

const SplashScreen = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const { isDark } = useTheme();

  useEffect(() => {
    // Navigate to Home after a short delay
    const timer = setTimeout(() => {
      navigation.replace("Home");
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#000000" : "#ffffff" },
      ]}>
      <Text style={[styles.appName, { color: isDark ? "#ffffff" : "#000000" }]}>
        Todra
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  appName: {
    fontSize: 48,
    fontWeight: "bold",
    letterSpacing: 2,
  },
});

export default SplashScreen;
