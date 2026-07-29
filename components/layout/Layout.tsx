'use client';

import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { Layout, Drawer } from 'antd';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { PageTransitionOverlay } from '@/components/common/PageTransitionOverlay';
import { useNavigation } from '@/lib/contexts/navigation.context';
import { useIsLayoutMobile } from '@/lib/hooks/use-mobile';
import styles from './Layout.module.scss';
import { useTheme } from '@/lib/hooks/use-theme';

const { Content } = Layout;

interface CRMLayoutProps {
  children: ReactNode;
}

export function CRMLayout({ children }: CRMLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsLayoutMobile();
  const { isNavigating } = useNavigation();
  const { themeMode } = useTheme();

  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile]);

  const handleToggle = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setCollapsed(true);
  }, []);

  const contentWrapperClassName = [
    styles.contentWrapper,
    collapsed ? styles.collapsed : styles.expanded,
  ].join(' ');

  return (
    <Layout className={styles.layout}>
      {!isMobile && <Sidebar collapsed={collapsed} />}

      <Drawer
        placement="left"
        closable={false}
        onClose={handleClose}
        open={isMobile && !collapsed}
        styles={{ body: { padding: 0 } }}
        size={260}
        rootClassName={themeMode}
      >
        <Sidebar collapsed={collapsed} isMobile={true} onClose={handleClose} />
      </Drawer>

      <Layout className={contentWrapperClassName}>
        <Header collapsed={collapsed} onToggle={handleToggle} />

        <Content className={styles.content}>
          {children}
        </Content>
      </Layout>

      <PageTransitionOverlay visible={isNavigating} />
    </Layout>
  );
}
