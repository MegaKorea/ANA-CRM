import { ThemeMode } from './enums/theme.enum';

export type CrmColors = Readonly<{
  primary: string;
  white: string;
  black: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  bgLayout: string;
  headerBg: string;
  bodyBg: string;
  tableHeaderBg: string;
  transparent: string;
  hoverBg: string;
  textPrimary: string;
  textSecondary: string;
  borderColor: string;
  bgContainer: string;
  headerText: string;
}>;

export const COLORS_LIGHT = {
  primary: '#ec008c',
  white: '#FFFFFF',
  black: '#000000',
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#1890ff',
  bgLayout: '#f5f5f5',
  headerBg: '#001529',
  bodyBg: '#f0f2f5',
  tableHeaderBg: '#fafafa',
  transparent: 'transparent',
  hoverBg: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#000000',
  textSecondary: '#666666',
  borderColor: '#d9d9d9',
  bgContainer: '#FFFFFF',
  headerText: '#FFFFFF',
} as const satisfies CrmColors;

export const COLORS_DARK = {
  primary: '#ec008c',
  white: '#FFFFFF',
  black: '#000000',
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#1890ff',
  bgLayout: '#000000',
  headerBg: '#000000',
  bodyBg: '#000000',
  tableHeaderBg: '#000000',
  transparent: 'transparent',
  hoverBg: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#FFFFFF',
  textSecondary: '#BFBFBF',
  borderColor: '#434343',
  bgContainer: '#000000',
  headerText: '#FFFFFF',
} as const satisfies CrmColors;

export function getColorsByTheme(themeMode: ThemeMode): CrmColors {
  return themeMode === ThemeMode.DARK ? COLORS_DARK : COLORS_LIGHT;
}

export const COLORS = COLORS_LIGHT;
