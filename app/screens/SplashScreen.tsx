import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect } from "react";
import { View } from "react-native";
import { RootStackParamList } from "../types";

type SplashScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Splash"
>;

// Key for AsyncStorage
const FIRST_LAUNCH_KEY = "APP_FIRST_LAUNCH";

const SplashScreen = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasLaunchedBefore = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
        if (hasLaunchedBefore === "true") {
          navigation.replace("Home");
        } else {
          navigation.replace("WelcomeSlider");
        }
      } catch (error) {
        console.error("Error checking first launch:", error);
        navigation.replace("WelcomeSlider");
      }
    };

    checkFirstLaunch();
  }, [navigation]);

  // Render nothing to avoid any initial spinner/animation
  return <View />;
};

export default SplashScreen;
