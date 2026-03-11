'use client';

import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { Layout, Drawer, Grid } from 'antd';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { PageTransitionOverlay } from '@/components/common/PageTransitionOverlay';
import { useNavigation } from '@/lib/contexts/navigation.context';
import styles from './Layout.module.scss';
import { useTheme } from '@/lib/hooks/use-theme';

const { Content } = Layout;
const { useBreakpoint } = Grid;

interface CRMLayoutProps {
  children: ReactNode;
}

export function CRMLayout({ children }: CRMLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isNavigating } = useNavigation();
  const { themeMode } = useTheme();

  const screens = useBreakpoint();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isMobile = mounted && (screens.xs || screens.sm || screens.md) && !screens.lg;

  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile]);

  const siderWidth = isMobile ? 0 : (collapsed ? 80 : 260);

  const handleToggle = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setCollapsed(true);
  }, []);

  return (
    <Layout className={styles.layout}>
      {!isMobile && <Sidebar collapsed={collapsed} />}

      <Drawer
        placement="left"
        closable={false}
        onClose={handleClose}
        open={isMobile && !collapsed}
        styles={{ body: { padding: 0 } }}
        width={260}
        rootClassName={themeMode}
      >
        <Sidebar collapsed={collapsed} isMobile={true} onClose={handleClose} />
      </Drawer>

      <Layout
        className={styles.contentWrapper}
        style={{
          marginLeft: siderWidth,
        }}
      >
        <Header collapsed={collapsed} onToggle={handleToggle} />

        <Content className={styles.content}>
          {children}
        </Content>
      </Layout>

      <PageTransitionOverlay visible={isNavigating} />
    </Layout>
  );
}
