import { useEffect, useRef } from "react";
import { Animated } from "react-native";

export const useTaskDetailsAnimations = (task: any) => {
  const statusOpacity = useRef(new Animated.Value(0)).current;
  const detailsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (task) {
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
    }
  }, [task, statusOpacity, detailsOpacity]);

  const animateStatusToggle = () => {
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

