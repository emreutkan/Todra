import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { typography } from "../typography";
import { useTheme } from "./ThemeContext";

type ToastKind = "success" | "error" | "info";

type ToastContextValue = {
  showToast: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState<ToastKind>("info");
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-24)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -24,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  }, [opacity, translateY]);

  const showToast = useCallback(
    (msg: string, k: ToastKind = "info") => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setMessage(msg);
      setKind(k);
      setVisible(true);
      opacity.setValue(0);
      translateY.setValue(-24);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
        }),
      ]).start();
      hideTimer.current = setTimeout(hide, 3200);
    },
    [hide, opacity, translateY]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  const accent =
    kind === "success"
      ? colors.success
      : kind === "error"
        ? colors.error
        : colors.primary;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {visible && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.bannerWrap,
            {
              paddingTop: insets.top + 8,
              opacity,
              transform: [{ translateY }],
            },
          ]}>
          <View
            style={[
              styles.banner,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                ...Platform.select({
                  ios: {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.12,
                    shadowRadius: 20,
                  },
                  android: { elevation: 6 },
                }),
              },
            ]}>
            <View style={[styles.accent, { backgroundColor: accent }]} />
            <Text style={[typography.bodySmall, { color: colors.text, flex: 1 }]}>
              {message}
            </Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  bannerWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 0,
    zIndex: 9999,
    alignItems: "center",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    gap: 12,
  },
  accent: {
    width: 4,
    alignSelf: "stretch",
    borderRadius: 2,
    minHeight: 20,
  },
});

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
};
