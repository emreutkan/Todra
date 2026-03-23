/**
 * Font family names match @expo-google-fonts/* post-load identifiers.
 * Load these in App.tsx via useFonts before rendering.
 */
export const FONT = {
  display: "Fraunces_600SemiBold",
  displayRegular: "Fraunces_400Regular",
  body: "NunitoSans_400Regular",
  bodyMedium: "NunitoSans_500Medium",
  bodySemiBold: "NunitoSans_600SemiBold",
  bodyBold: "NunitoSans_700Bold",
} as const;

/** Modular scale: display → title → headline → body → small → caption / label */
export const typography = {
  displayLarge: {
    fontFamily: FONT.display,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  display: {
    fontFamily: FONT.display,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  title: {
    fontFamily: FONT.display,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  /** Section / sheet titles between title (22) and headline (18) */
  titleMedium: {
    fontFamily: FONT.display,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.15,
  },
  /** Stack header “hero” line — between title (22) and display (28) */
  heroTitle: {
    fontFamily: FONT.display,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.35,
  },
  headline: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 18,
    lineHeight: 24,
  },
  headlineBold: {
    fontFamily: FONT.bodyBold,
    fontSize: 18,
    lineHeight: 24,
  },
  body: {
    fontFamily: FONT.body,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: FONT.bodyMedium,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySemiBold: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: FONT.body,
    fontSize: 14,
    lineHeight: 20,
  },
  bodySmallMedium: {
    fontFamily: FONT.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  bodySmallBold: {
    fontFamily: FONT.bodyBold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.5,
  },
  bodySmallSemiBold: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  /** Between body (16) and bodySmall (14) — dense secondary lines */
  subbody: {
    fontFamily: FONT.body,
    fontSize: 15,
    lineHeight: 22,
  },
  subbodySemiBold: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 15,
    lineHeight: 22,
  },
  subbodyMedium: {
    fontFamily: FONT.bodyMedium,
    fontSize: 15,
    lineHeight: 22,
  },
  subbodyBold: {
    fontFamily: FONT.bodyBold,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.5,
  },
  label: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  caption: {
    fontFamily: FONT.body,
    fontSize: 12,
    lineHeight: 16,
  },
  captionMedium: {
    fontFamily: FONT.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  captionSemiBold: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  captionBold: {
    fontFamily: FONT.bodyBold,
    fontSize: 12,
    lineHeight: 16,
  },
  /** Compact chips, priority toggles */
  chip: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.3,
  },
  /** Secondary meta lines (13 / medium) */
  meta: {
    fontFamily: FONT.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  /** Tiny calendar / axis labels */
  overline: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.6,
  },
  /** Primary actions — pair with icon rows */
  button: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 16,
    lineHeight: 22,
  },
} as const;
