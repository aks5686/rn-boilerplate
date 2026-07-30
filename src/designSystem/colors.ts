/**
 * Design system color tokens. Components should always reference these
 * tokens (or the semantic aliases in `theme.colors`) rather than hard-coded
 * hex values, so a future theming/dark-mode pass only has to change this file.
 */

const palette = {
  blue50: '#EAF2FF',
  blue100: '#D6E4FF',
  blue300: '#7FA9FF',
  blue500: '#3366FF',
  blue700: '#1F47CC',
  blue900: '#132C80',

  gray0: '#FFFFFF',
  gray50: '#F7F8FA',
  gray100: '#EEF0F3',
  gray200: '#DFE3E8',
  gray300: '#C4CAD4',
  gray400: '#9AA2AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  gray1000: '#000000',

  red50: '#FDECEC',
  red500: '#E5484D',
  red700: '#B42318',

  green50: '#E9F9EE',
  green500: '#12B76A',
  green700: '#027A48',

  amber50: '#FFF7E6',
  amber500: '#F79009',
  amber700: '#B54708',
} as const;

export const colors = {
  ...palette,

  brand: {
    primary: palette.blue500,
    primaryHover: palette.blue700,
    primaryPressed: palette.blue900,
    primaryMuted: palette.blue50,
  },

  text: {
    primary: palette.gray900,
    secondary: palette.gray600,
    tertiary: palette.gray400,
    inverse: palette.gray0,
    link: palette.blue500,
    disabled: palette.gray300,
  },

  background: {
    primary: palette.gray0,
    secondary: palette.gray50,
    tertiary: palette.gray100,
    inverse: palette.gray900,
  },

  border: {
    subtle: palette.gray200,
    default: palette.gray300,
    strong: palette.gray400,
    focus: palette.blue500,
  },

  status: {
    success: palette.green500,
    successMuted: palette.green50,
    successStrong: palette.green700,
    error: palette.red500,
    errorMuted: palette.red50,
    errorStrong: palette.red700,
    warning: palette.amber500,
    warningMuted: palette.amber50,
    warningStrong: palette.amber700,
  },

  overlay: 'rgba(17, 24, 39, 0.5)',
  transparent: 'transparent',
} as const;

export type ColorTokens = typeof colors;
