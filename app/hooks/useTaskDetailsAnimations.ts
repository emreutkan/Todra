import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { useReducedMotion } from "./useReducedMotion";

export const useTaskDetailsAnimations = (task: unknown) => {
  const reducedMotion = useReducedMotion();
  const statusOpacity = useRef(new Animated.Value(0)).current;
  const detailsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!task) return;
    if (reducedMotion) {
      statusOpacity.setValue(1);
      detailsOpacity.setValue(1);
      return;
    }
    Animated.sequence([
      Animated.timing(statusOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(detailsOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [task, reducedMotion, statusOpacity, detailsOpacity]);

  const animateStatusToggle = () => {
    if (reducedMotion) {
      statusOpacity.setValue(1);
      return;
    }
    Animated.sequence([
      Animated.timing(statusOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(statusOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return {
    statusOpacity,
    detailsOpacity,
    animateStatusToggle,
  };
};
