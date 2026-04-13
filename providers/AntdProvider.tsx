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
          'var(--font-mona-sans), "Mona Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: THEME.fontSize.base,
        borderRadius: THEME.borderRadius.base,
        borderRadiusLG: THEME.borderRadius.lg,
        borderRadiusSM: THEME.borderRadius.sm,
        colorBgContainer: colors.bgContainer,
        colorBgLayout: colors.bgLayout,
        colorText: colors.textPrimary,
        colorTextSecondary: colors.textSecondary,
        colorBorder: colors.borderColor,
      },
      components: {
        Layout: {
          headerBg: colors.headerBg,
          headerColor: colors.headerText,
          siderBg: colors.headerBg,
          bodyBg: colors.bodyBg,
        },
        Menu: {
          darkItemBg: colors.headerBg,
          darkItemSelectedBg: colors.primary,
          darkItemHoverBg: colors.hoverBg,
        },
        Button: {
          primaryShadow: `0 ${THEME.shadow.offset}px 0 ${colors.primary}1a`,
        },
        Card: {
          headerBg: colors.transparent,
        },
        Table: {
          headerBg: colors.tableHeaderBg,
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
