/**
 * Design system spacing & layout tokens. A 4pt base unit keeps all
 * paddings/margins/gaps on a consistent grid across the app.
 */

const BASE_UNIT = 4;

export const spacing = {
  none: 0,
  xxs: BASE_UNIT, // 4
  xs: BASE_UNIT * 2, // 8
  sm: BASE_UNIT * 3, // 12
  md: BASE_UNIT * 4, // 16
  lg: BASE_UNIT * 6, // 24
  xl: BASE_UNIT * 8, // 32
  xxl: BASE_UNIT * 12, // 48
  xxxl: BASE_UNIT * 16, // 64
} as const;

export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
  circle: 9999,
} as const;

export const iconSize = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export const layout = {
  screenHorizontalPadding: spacing.md,
  screenVerticalPadding: spacing.lg,
  maxContentWidth: 480,
  minTouchTarget: 44,
} as const;

export const elevation = {
  none: 0,
  low: 2,
  medium: 4,
  high: 8,
} as const;

export type SpacingTokens = typeof spacing;
