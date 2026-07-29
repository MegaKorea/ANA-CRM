'use client';

import { Layout, Menu, type MenuProps, Typography } from 'antd';
import { usePathname } from 'next/navigation';
import { useMemo, useSyncExternalStore } from 'react';
import styles from './Sidebar.module.scss';
import logo from '../../app/assets/logo/logo-ana.png';
import Image from 'next/image';
import { useTheme } from '@/lib/hooks/use-theme';
import { HiViewGridAdd } from 'react-icons/hi';
import { menuItems, type AppMenuItem, type MenuItem } from '@/constants/menu';
import { useNavigation } from '@/lib/contexts/navigation.context';
import { useCurrentUser } from '@/lib/hooks/use-current-user';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
  isMobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ collapsed, isMobile, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { themeMode } = useTheme();
  const { navigateWithDelay } = useNavigation();
  const { user, isLoading } = useCurrentUser();

  const filteredMenuItems = useMemo(() => {
    const userRole = user?.roleCode;

    function filterMenu(items: AppMenuItem[]): MenuItem[] {
      return items
        .filter((item) => {
          if (item.roles && item.roles.length > 0) {
            if (userRole) {
              return item.roles.some((r) => r.toUpperCase() === userRole.toUpperCase());
            }
            if (isLoading) {
              return true;
            }
            return false;
          }
          return true;
        })
        .map((item) => {
          if (item.children) {
            const children = filterMenu(item.children);
            return {
              ...item,
              children: children.length > 0 ? children : undefined,
            } as MenuItem;
          }
          const rest = { ...item };
          delete (rest as Partial<AppMenuItem>).roles;
          return rest as MenuItem;
        });
    }

    return filterMenu(menuItems);
  }, [user?.roleCode, isLoading]);

  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  const selectedKeys = useMemo(() => {
    if (!mounted) return [];
    return [pathname];
  }, [pathname, mounted]);

  const defaultOpenKeys = useMemo(() => {
    if (!mounted || collapsed) return [];
    const paths = pathname.split('/').filter(Boolean);
    if (paths.length > 1) {
      return [`/${paths[0]}`];
    }
    return [];
  }, [pathname, collapsed, mounted]);

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigateWithDelay(key);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const sidebarContent = (
    <>
      <div className={styles.logoContainer}>
        <Typography.Title level={1}>
          {(!collapsed || isMobile) ? (
            <Image src={logo} alt="logo" width={70} height={40} className={styles.logoImage} />
          ) : (
            <HiViewGridAdd size={40} />
          )}
        </Typography.Title>
      </div>

      <Menu
        theme={themeMode}
        mode="inline"
        selectedKeys={selectedKeys}
        defaultOpenKeys={defaultOpenKeys}
        items={filteredMenuItems}
        onClick={handleMenuClick}
        className={styles.menu}
      />
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
