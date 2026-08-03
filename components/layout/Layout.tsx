'use client';

import { useState, useCallback, useSyncExternalStore, type ReactNode } from 'react';
import { Layout, Drawer } from 'antd';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { PageTransitionOverlay } from '@/components/common/PageTransitionOverlay';
import { useNavigation } from '@/lib/contexts/navigation.context';
import { useIsLayoutMobile } from '@/lib/hooks/use-mobile';
import styles from './Layout.module.scss';
import { useTheme } from '@/lib/hooks/use-theme';

const { Content } = Layout;
const subscribeToClient = () => () => {};

interface CRMLayoutProps {
  children: ReactNode;
}

export function CRMLayout({ children }: CRMLayoutProps) {
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mounted = useSyncExternalStore(subscribeToClient, () => true, () => false);
  const isMobile = useIsLayoutMobile();
  const { isNavigating } = useNavigation();
  const { themeMode } = useTheme();

  const [prevIsMobile, setPrevIsMobile] = useState(isMobile);
  if (isMobile !== prevIsMobile) {
    setPrevIsMobile(isMobile);
    if (!isMobile && mobileOpen) {
      setMobileOpen(false);
    }
  }

  const collapsed = isMobile ? !mobileOpen : desktopCollapsed;

  const handleToggle = useCallback(() => {
    if (isMobile) {
      setMobileOpen((open) => !open);
    } else {
      setDesktopCollapsed((value) => !value);
    }
  }, [isMobile]);

  const handleClose = useCallback(() => {
    setMobileOpen(false);
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
        open={mounted && isMobile && !collapsed}
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
