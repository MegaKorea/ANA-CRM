'use client';

import { ConfigProvider, App, theme } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { JSX, useMemo, type ReactNode } from 'react';
import { getColorsByTheme } from '@/constants/colors';
import { THEME } from '@/constants/theme';
import { useTheme } from '@/lib/hooks/use-theme';
import { ThemeMode } from '@/constants/enums/theme.enum';

interface AntdProviderProps {
  children: ReactNode;
}

function AntdProviderContent({ children }: AntdProviderProps): JSX.Element {
  const { themeMode } = useTheme();

  const crmTheme = useMemo(() => {
    const colors = getColorsByTheme(themeMode);
    return {
      token: {
        colorPrimary: colors.primary,
        colorSuccess: colors.success,
        colorWarning: colors.warning,
        colorError: colors.error,
        colorInfo: colors.info,
        fontFamily:
          'var(--font-lexend), "Lexend", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: THEME.fontSize.base,
        borderRadius: THEME.borderRadius.sm,
        borderRadiusLG: THEME.borderRadius.md,
        borderRadiusSM: THEME.borderRadius.xs,
        colorBgContainer: colors.bgSurface,
        colorBgElevated: colors.bgSurface,
        colorBgLayout: colors.bgApp,
        colorText: colors.textPrimary,
        colorTextSecondary: colors.textSecondary,
        colorBorder: colors.borderStrong,
        colorBorderSecondary: colors.border,
      },
      components: {
        Layout: {
          headerBg: colors.bgSurface,
          headerColor: colors.textPrimary,
          siderBg: colors.bgSurface,
          bodyBg: colors.bgApp,
        },
        Dropdown: {
          colorBgElevated: colors.bgSurface,
        },
        Menu: {
          itemBg: colors.bgSurface,
          popupBg: colors.bgSurface,
          itemColor: colors.textSecondary,
          itemHoverBg: colors.bgHover,
          itemHoverColor: colors.textPrimary,
          itemSelectedBg: colors.bgSelected,
          itemSelectedColor: colors.navActiveText,
          // Expanded submenus should not paint an edge-to-edge block behind
          // their children — each row keeps its own inset, rounded pill.
          subMenuItemBg: colors.transparent,
          itemBorderRadius: THEME.borderRadius.sm,
          itemMarginInline: 8,
          itemMarginBlock: 2,
          darkItemBg: colors.bgSurface,
          darkPopupBg: colors.bgSurface,
          darkItemColor: colors.textSecondary,
          darkItemHoverBg: colors.bgHover,
          darkItemHoverColor: colors.textPrimary,
          darkItemSelectedBg: colors.bgSelected,
          darkItemSelectedColor: colors.navActiveText,
          darkSubMenuItemBg: colors.transparent,
        },
        Button: {
          primaryShadow: `0 ${THEME.shadow.offset}px 0 ${colors.primary}1a`,
        },
        Card: {
          headerBg: colors.transparent,
        },
        Table: {
          headerBg: colors.bgSunken,
        },
      },
      algorithm:
        themeMode === ThemeMode.DARK ? theme.darkAlgorithm : theme.defaultAlgorithm,
    };
  }, [themeMode]);

  return (
    <ConfigProvider theme={crmTheme} locale={viVN}>
      <App>{children}</App>
    </ConfigProvider>
  );
}

export function AntdProvider({ children }: AntdProviderProps) {
  return <AntdProviderContent>{children}</AntdProviderContent>;
}
