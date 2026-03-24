// Restrained editorial: ink neutrals, no washed pastels — dark fills on light, light fills on dark

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
  primary: "#111827",
  secondary: "#4B5563",
  accent: "#B45309",
  background: "#F9FAFB",
  card: "#FFFFFF",
  surface: "#F3F4F6",
  text: "#111827",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  notification: "#6B7280",
  success: "#166534",
  error: "#991B1B",
  warning: "#A16207",
  info: "#1E40AF",
  inputBackground: "#F3F4F6",
  divider: "#E5E7EB",
  disabled: "#9CA3AF",
  onPrimary: "#FFFFFF",
  glassOverlay: "rgba(255, 255, 255, 0.92)",
  primaryMuted: "rgba(17, 24, 39, 0.08)",
  overlayScrim: "rgba(0, 0, 0, 0.52)",
  shadowColor: "rgba(0, 0, 0, 0.14)",
  hairline: "rgba(0, 0, 0, 0.09)",
  destructiveSurface: "#fef2f2",
  destructiveText: "#b91c1c",
};

export const darkPremiumTheme: ThemeColors = {
  primary: "#E5E7EB",
  secondary: "#A1A1AA",
  accent: "#D97706",
  background: "#09090B",
  card: "#18181B",
  surface: "#27272A",
  text: "#FAFAFA",
  textSecondary: "#A1A1AA",
  border: "#3F3F46",
  notification: "#A1A1AA",
  success: "#22C55E",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
  inputBackground: "#27272A",
  divider: "#3F3F46",
  disabled: "#71717A",
  onPrimary: "#09090B",
  glassOverlay: "rgba(9, 9, 11, 0.88)",
  primaryMuted: "rgba(229, 231, 235, 0.12)",
  overlayScrim: "rgba(0, 0, 0, 0.55)",
  shadowColor: "rgba(0, 0, 0, 0.5)",
  hairline: "rgba(250, 250, 250, 0.1)",
  destructiveSurface: "#450a0a",
  destructiveText: "#fca5a5",
};

export const darkOledTheme: ThemeColors = {
  primary: "#E5E7EB",
  secondary: "#A1A1AA",
  accent: "#D97706",
  background: "#000000",
  card: "#0A0A0A",
  surface: "#141414",
  text: "#FAFAFA",
  textSecondary: "#A1A1AA",
  border: "#27272A",
  notification: "#A1A1AA",
  success: "#22C55E",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
  inputBackground: "#141414",
  divider: "#1F1F1F",
  disabled: "#71717A",
  onPrimary: "#000000",
  glassOverlay: "rgba(0, 0, 0, 0.82)",
  primaryMuted: "rgba(229, 231, 235, 0.1)",
  overlayScrim: "rgba(0, 0, 0, 0.62)",
  shadowColor: "rgba(0, 0, 0, 0.6)",
  hairline: "rgba(250, 250, 250, 0.1)",
  destructiveSurface: "#450a0a",
  destructiveText: "#fca5a5",
};

export const PRIORITY_COLORS = {
  low: "#71717A",
  normal: "#52525B",
  high: "#B91C1C",
};

export const SIZES = {
  base: 8,
  small: 12,
  font: 14,
  medium: 16,
  large: 18,
  extraLarge: 24,
};

/** Standard corner radii — prefer over raw numbers for cards, chips, FABs */
export const RADII = {
  sm: 8,
  md: 12,
  /** Half of 56×56 circular FABs */
  fab: 28,
} as const;

/** Shared horizontal inset for Home date strip + task stack (one rhythm). */
export const HOME_GUTTER = SIZES.medium;

/**
 * Home `TaskList`: stats strip, priority section headers, and `TaskItem` rows share
 * the same corner radius, insets, and vertical rhythm (see TaskList + TaskItem).
 */
export const HOME_LIST = {
  cardRadius: RADII.md,
  sectionPaddingV: SIZES.small,
  sectionPaddingH: SIZES.medium,
  /** Space below each task card */
  itemMarginBottom: SIZES.small,
  /** Space below stats strip / each section header */
  stackGap: SIZES.base,
} as const;

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
