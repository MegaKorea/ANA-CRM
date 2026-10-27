'use client';

import { useState, useCallback, useSyncExternalStore, type ReactNode } from 'react';
import { Layout, Drawer } from 'antd';
import { m } from 'motion/react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { NavigationProgress } from '@/components/common/NavigationProgress';
import { useNavigation } from '@/lib/contexts/navigation.context';
import { useIsLayoutMobile } from '@/lib/hooks/use-mobile';
import styles from './Layout.module.scss';
import { useTheme } from '@/lib/hooks/use-theme';

const { Content } = Layout;
const subscribeToClient = () => () => {};

const COLLAPSED_STORAGE_KEY = 'sidebar:collapsed';
const collapsedListeners = new Set<() => void>();

function subscribeCollapsed(callback: () => void) {
  collapsedListeners.add(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === COLLAPSED_STORAGE_KEY) {
      collapsedListeners.forEach((l) => l());
    }
  };
  window.addEventListener('storage', handleStorage);
  return () => {
    collapsedListeners.delete(callback);
    window.removeEventListener('storage', handleStorage);
  };
}

function getCollapsedSnapshot(): boolean {
  return localStorage.getItem(COLLAPSED_STORAGE_KEY) === '1';
}

function getCollapsedServerSnapshot(): boolean {
  return false;
}

function setStoredCollapsed(value: boolean): void {
  localStorage.setItem(COLLAPSED_STORAGE_KEY, value ? '1' : '0');
  collapsedListeners.forEach((l) => l());
}

interface CRMLayoutProps {
  children: ReactNode;
}

export function CRMLayout({ children }: CRMLayoutProps) {
  const desktopCollapsed = useSyncExternalStore(
    subscribeCollapsed,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const mounted = useSyncExternalStore(subscribeToClient, () => true, () => false);
  const isMobile = useIsLayoutMobile();
  const { isNavigating } = useNavigation();
  const pathname = usePathname();
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
      setStoredCollapsed(!desktopCollapsed);
    }
  }, [isMobile, desktopCollapsed]);

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
          {/* Opacity only: a transform here would trap position: fixed children. */}
          <m.div
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {children}
          </m.div>
        </Content>
      </Layout>

      <NavigationProgress visible={isNavigating} />
    </Layout>
  );
}
