// Warm minimal light, premium warm dark, optional true-black dark

export type ThemeColors = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  card: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  notification: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  inputBackground: string;
  divider: string;
  disabled: string;
  onPrimary: string;
  /** Frosted bar fallback when blur unavailable / Android */
  glassOverlay: string;
  /** Subtle wash on primary controls */
  primaryMuted: string;
  /** Modal / sheet backdrop */
  overlayScrim: string;
  /** Neutral elevation shadow (iOS shadowColor; pair with shadowOpacity as needed) */
  shadowColor: string;
  /** Thin dividers and subtle separators */
  hairline: string;
  /** Settings / list row background for destructive actions */
  destructiveSurface: string;
  /** Icon and label color for destructive rows (readable on surface and normal bg) */
  destructiveText: string;
};

export const lightWarmTheme: ThemeColors = {
  primary: "#8B7355",
  secondary: "#6B5D4F",
  accent: "#C4A57B",
  background: "#F7F3EE",
  card: "#FFFCF9",
  surface: "#F0EBE3",
  text: "#3D3835",
  textSecondary: "#7A726B",
  border: "#E8E0D5",
  notification: "#7A726B",
  success: "#7D9F7B",
  error: "#C17C74",
  warning: "#D4A574",
  info: "#8B9EB7",
  inputBackground: "#F3EEE8",
  divider: "#E5DDD4",
  disabled: "#B5ADA3",
  onPrimary: "#FFFCF9",
  glassOverlay: "rgba(255, 252, 249, 0.82)",
  primaryMuted: "rgba(139, 115, 85, 0.14)",
  overlayScrim: "rgba(0, 0, 0, 0.5)",
  shadowColor: "rgba(61, 56, 53, 0.22)",
  hairline: "rgba(0, 0, 0, 0.12)",
  destructiveSurface: "#ffebeb",
  destructiveText: "#d63031",
};

export const darkPremiumTheme: ThemeColors = {
  primary: "#D4C4B0",
  secondary: "#B8A896",
  accent: "#C9B896",
  background: "#1A1816",
  card: "#242120",
  surface: "#2C2928",
  text: "#F2EDE8",
  textSecondary: "#A39E98",
  border: "#3A3634",
  notification: "#A39E98",
  success: "#9BB89E",
  error: "#D4A09A",
  warning: "#D4B896",
  info: "#A3B4C9",
  inputBackground: "#2A2726",
  divider: "#343130",
  disabled: "#6B6662",
  onPrimary: "#1A1816",
  glassOverlay: "rgba(26, 24, 22, 0.78)",
  primaryMuted: "rgba(212, 196, 176, 0.12)",
  overlayScrim: "rgba(0, 0, 0, 0.42)",
  shadowColor: "rgba(0, 0, 0, 0.35)",
  hairline: "rgba(242, 237, 232, 0.12)",
  destructiveSurface: "#421b1b",
  destructiveText: "#ff6b6b",
};

export const darkOledTheme: ThemeColors = {
  primary: "#D4C4B0",
  secondary: "#B8A896",
  accent: "#C9B896",
  background: "#000000",
  card: "#0C0C0C",
  surface: "#141414",
  text: "#ECEAE8",
  textSecondary: "#9A9693",
  border: "#252525",
  notification: "#9A9693",
  success: "#8FAF92",
  error: "#C9948E",
  warning: "#C9A882",
  info: "#98A8BC",
  inputBackground: "#101010",
  divider: "#1C1C1C",
  disabled: "#5C5956",
  onPrimary: "#000000",
  glassOverlay: "rgba(0, 0, 0, 0.76)",
  primaryMuted: "rgba(212, 196, 176, 0.1)",
  overlayScrim: "rgba(0, 0, 0, 0.58)",
  shadowColor: "rgba(0, 0, 0, 0.5)",
  hairline: "rgba(236, 234, 232, 0.14)",
  destructiveSurface: "#421b1b",
  destructiveText: "#ff6b6b",
};

export const PRIORITY_COLORS = {
  low: "#8FA8B8",
  normal: "#D4B896",
  high: "#C9948E",
};

export const SIZES = {
  base: 8,
  small: 12,
  font: 14,
  medium: 16,
  large: 18,
  extraLarge: 24,
};

/** @deprecated use lightWarmTheme */
export const COLORS = lightWarmTheme;

export const FONTS = {
  regular: { fontFamily: "NunitoSans_400Regular", fontWeight: "400" as const },
  medium: { fontFamily: "NunitoSans_500Medium", fontWeight: "500" as const },
  semibold: {
    fontFamily: "NunitoSans_600SemiBold",
    fontWeight: "600" as const,
  },
  bold: { fontFamily: "NunitoSans_700Bold", fontWeight: "700" as const },
};
