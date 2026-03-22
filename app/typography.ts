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

export const typography = {
  displayLarge: {
    fontFamily: FONT.display,
    fontSize: 40,
    letterSpacing: -0.5,
  },
  display: {
    fontFamily: FONT.display,
    fontSize: 28,
    letterSpacing: -0.3,
  },
  title: {
    fontFamily: FONT.display,
    fontSize: 22,
    letterSpacing: -0.2,
  },
  headline: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 18,
  },
  body: {
    fontFamily: FONT.body,
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
  label: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 12,
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
} as const;
