import { BlurView } from "expo-blur";
import React, { ReactNode } from "react";
import {
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { SIZES } from "../../theme";

type GlassBarProps = {
  children: ReactNode;
  /** Outer wrapper (e.g. margin, alignSelf) */
  wrapperStyle?: StyleProp<ViewStyle>;
  /** Inner row: padding, flexDirection, gap */
  rowStyle?: StyleProp<ViewStyle>;
};

/**
 * iOS: native blur. Android: translucent themed overlay (reliable frosted look).
 */
const GlassBar: React.FC<GlassBarProps> = ({
  children,
  wrapperStyle,
  rowStyle,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.wrapper, wrapperStyle]}>
      <View style={styles.clip}>
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={isDark ? 52 : 68}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.glassOverlay },
            ]}
          />
        )}
        <View style={[styles.row, rowStyle]}>{children}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 100,
    overflow: "hidden",
    alignSelf: "flex-end",
    marginRight: SIZES.medium,
  },
  clip: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 100,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    paddingHorizontal: SIZES.medium,
    paddingVertical: SIZES.medium,
    zIndex: 2,
    flexShrink: 0,
    gap: 16,
  },
});

export default GlassBar;
