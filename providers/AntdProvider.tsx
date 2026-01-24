'use client';

import { ConfigProvider, App, theme } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { type ReactNode } from 'react';

interface AntdProviderProps {
  children: ReactNode;
}

// CRM Theme Configuration
const crmTheme = {
  token: {
    // Primary brand color
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',

    // Typography
    fontFamily:
      'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,

    // Border radius
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,

    // Layout
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f5f5f5',
  },
  components: {
    Layout: {
      headerBg: '#001529',
      headerColor: '#ffffff',
      siderBg: '#001529',
      bodyBg: '#f0f2f5',
    },
    Menu: {
      darkItemBg: '#001529',
      darkItemSelectedBg: '#1890ff',
      darkItemHoverBg: 'rgba(255, 255, 255, 0.08)',
    },
    Button: {
      primaryShadow: '0 2px 0 rgba(24, 144, 255, 0.1)',
    },
    Card: {
      headerBg: 'transparent',
    },
    Table: {
      headerBg: '#fafafa',
    },
  },
  algorithm: theme.defaultAlgorithm,
};

export function AntdProvider({ children }: AntdProviderProps) {
  return (
    <ConfigProvider theme={crmTheme} locale={viVN}>
      <App>{children}</App>
    </ConfigProvider>
  );
}

// Export theme for use in other components
export { crmTheme };
