'use client';

import { Layout, Menu, Skeleton, type MenuProps, Typography } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import styles from './Sidebar.module.scss';
import logo from '../../app/assets/logo/logo-ana.png';
import Image from 'next/image';
import { useTheme } from '@/lib/hooks/use-theme';
import { HiViewGridAdd } from 'react-icons/hi';
import { menuItems } from '@/constants/menu';
import { useNavigation } from '@/lib/contexts/navigation.context';
import { useAuthLoading, useUserRoleCode } from '@/lib/hooks/use-current-user';
import { filterMenuByRole } from '@/lib/utils/menu-filter';

const { Sider } = Layout;

const subscribeToClient = () => () => {};

const OPEN_KEYS_STORAGE_KEY = 'sidebar:openKeys';

type RouteNode = { key?: unknown; children?: RouteNode[] } | null;

function collectRoutes(items: RouteNode[]): string[] {
  return items.flatMap((item) => {
    if (!item) return [];
    if (item.children) return collectRoutes(item.children);
    return typeof item.key === 'string' && item.key.startsWith('/') ? [item.key] : [];
  });
}

function readStoredOpenKeys(): string[] | null {
  try {
    const raw = localStorage.getItem(OPEN_KEYS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeStoredOpenKeys(keys: string[]): void {
  try {
    localStorage.setItem(OPEN_KEYS_STORAGE_KEY, JSON.stringify(keys));
  } catch {
  }
}

interface SidebarProps {
  collapsed: boolean;
  isMobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ collapsed, isMobile, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { themeMode } = useTheme();
  const router = useRouter();
  const { navigate } = useNavigation();
  const roleCode = useUserRoleCode();
  const isLoading = useAuthLoading();

  const filteredMenuItems = useMemo(
    () => filterMenuByRole(menuItems, roleCode),
    [roleCode]
  );

  const selectedKeys = useMemo(() => [pathname], [pathname]);

  // Warm every page the user can reach from the menu so clicks open instantly.
  useEffect(() => {
    if (isLoading) return;
    collectRoutes(filteredMenuItems as RouteNode[]).forEach((route) => router.prefetch(route));
  }, [isLoading, filteredMenuItems, router]);

  const routeDefaultOpenKeys = useMemo(() => {
    const paths = pathname.split('/').filter(Boolean);
    if (paths.length > 1) {
      return [`/${paths[0]}`];
    }
    return [];
  }, [pathname]);

  const computeOpenKeys = () => (collapsed ? [] : readStoredOpenKeys() ?? routeDefaultOpenKeys);

  const mounted = useSyncExternalStore(subscribeToClient, () => true, () => false);

  const [openKeys, setOpenKeys] = useState<string[]>(() => (collapsed ? [] : routeDefaultOpenKeys));

  const [prevHydrationKey, setPrevHydrationKey] = useState([mounted, collapsed]);
  if (mounted !== prevHydrationKey[0] || collapsed !== prevHydrationKey[1]) {
    setPrevHydrationKey([mounted, collapsed]);
    setOpenKeys(computeOpenKeys());
  }

  const handleOpenChange: MenuProps['onOpenChange'] = (keys) => {
    setOpenKeys(keys);
    writeStoredOpenKeys(keys);
  };

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const sidebarContent = (
    <>
      <div className={styles.logoContainer}>
        <Typography.Title level={1}>
          {(!collapsed || isMobile) ? (
            <Image src={logo} alt="logo" width={98} height={56} className={styles.logoImage} />
          ) : (
            <HiViewGridAdd size={40} />
          )}
        </Typography.Title>
      </div>

      {isLoading ? (
        <div className={styles.menuSkeleton}>
          <Skeleton active paragraph={{ rows: 8 }} title={false} />
        </div>
      ) : (
        <Menu
          theme={themeMode}
          mode="inline"
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
          items={filteredMenuItems}
          onClick={handleMenuClick}
          className={styles.menu}
        />
      )}
    </>
  );

  if (isMobile) {
    return (
      <Sider
        trigger={null}
        collapsible
        collapsed={false}
        width={260}
        theme={themeMode}
        className={styles.sider}
        style={{ position: 'relative', height: '100%' }}
      >
        {sidebarContent}
      </Sider>
    );
  }

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={260}
      theme={themeMode}
      className={styles.sider}
    >
      {sidebarContent}
    </Sider>
  );
}
