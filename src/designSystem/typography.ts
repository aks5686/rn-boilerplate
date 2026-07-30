import { Platform, TextStyle } from 'react-native';

/**
 * Design system typography tokens. Font family falls back to the platform
 * default (San Francisco on iOS, Roboto on Android) unless a custom typeface
 * has been linked into the project.
 */

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

const fontWeights = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
};

interface TypographyVariant extends TextStyle {
  fontSize: number;
  lineHeight: number;
  fontWeight: TextStyle['fontWeight'];
}

function variant(fontSize: number, lineHeight: number, fontWeight: TextStyle['fontWeight']): TypographyVariant {
  return { fontFamily, fontSize, lineHeight, fontWeight };
}

export const typography = {
  fontFamily,
  fontWeights,

  displayLarge: variant(40, 48, fontWeights.bold),
  displayMedium: variant(32, 40, fontWeights.bold),
  displaySmall: variant(28, 36, fontWeights.bold),

  headingLarge: variant(24, 32, fontWeights.semibold),
  headingMedium: variant(20, 28, fontWeights.semibold),
  headingSmall: variant(18, 24, fontWeights.semibold),

  bodyLarge: variant(17, 24, fontWeights.regular),
  bodyMedium: variant(15, 22, fontWeights.regular),
  bodySmall: variant(13, 18, fontWeights.regular),

  labelLarge: variant(15, 20, fontWeights.medium),
  labelMedium: variant(13, 18, fontWeights.medium),
  labelSmall: variant(11, 16, fontWeights.medium),

  caption: variant(12, 16, fontWeights.regular),
  overline: {
    ...variant(11, 14, fontWeights.semibold),
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },

  button: variant(16, 20, fontWeights.semibold),
} as const;

export type TypographyTokens = typeof typography;
