import { ThemeMode } from './enums/theme.enum';

export type CrmColors = Readonly<{
  primary: string;
  navActiveText: string;
  white: string;
  black: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  bgApp: string;
  bgSurface: string;
  bgSunken: string;
  bgHover: string;
  bgSelected: string;
  transparent: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  borderStrong: string;
}>;

// ART LANCE design tokens v2.0 — see DESIGN_TOKEN.md (mirrors app/scss/_variables.scss
// since antd's ConfigProvider reads plain JS values, not CSS custom properties).
export const COLORS_LIGHT = {
  primary: '#6E34BB',
  navActiveText: '#5B2B9B',
  white: '#FFFFFF',
  black: '#000000',
  success: '#16A34A',
  warning: '#D9880F',
  error: '#E5484D',
  info: '#3E7BFA',
  bgApp: '#F8F9FB',
  bgSurface: '#FFFFFF',
  bgSunken: '#F1F2F6',
  bgHover: '#F1F2F6',
  bgSelected: '#F4EFFB',
  transparent: 'transparent',
  textPrimary: '#14161F',
  textSecondary: '#545A6E',
  border: '#E6E8EF',
  borderStrong: '#D5D8E2',
} as const satisfies CrmColors;

export const COLORS_DARK = {
  primary: '#6E34BB',
  navActiveText: '#B792E2',
  white: '#FFFFFF',
  black: '#000000',
  success: '#16A34A',
  warning: '#D9880F',
  error: '#E5484D',
  info: '#3E7BFA',
  bgApp: '#14161F',
  bgSurface: '#1C1F2A',
  bgSunken: '#232633',
  bgHover: '#262A37',
  bgSelected: 'rgba(110, 52, 187, 0.18)',
  transparent: 'transparent',
  textPrimary: '#F1F2F6',
  textSecondary: '#A6ABBD',
  border: '#2E3240',
  borderStrong: '#3B4051',
} as const satisfies CrmColors;

export function getColorsByTheme(themeMode: ThemeMode): CrmColors {
  return themeMode === ThemeMode.DARK ? COLORS_DARK : COLORS_LIGHT;
}

export const COLORS = COLORS_LIGHT;
