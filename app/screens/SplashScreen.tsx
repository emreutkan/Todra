import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect } from "react";
import { View } from "react-native";
import { RootStackParamList } from "../types";

type SplashScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Splash"
>;

const SplashScreen = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();

  useEffect(() => {
    // Always navigate to Home screen
    navigation.replace("Home");
  }, [navigation]);

  // Render nothing to avoid any initial spinner/animation
  return <View />;
};

export default SplashScreen;
