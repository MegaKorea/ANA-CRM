'use client';

import { Layout, Menu, Skeleton, type MenuProps, Typography } from 'antd';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
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

interface SidebarProps {
  collapsed: boolean;
  isMobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ collapsed, isMobile, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { themeMode } = useTheme();
  const { navigateWithDelay } = useNavigation();
  const roleCode = useUserRoleCode();
  const isLoading = useAuthLoading();

  const filteredMenuItems = useMemo(
    () => filterMenuByRole(menuItems, roleCode),
    [roleCode]
  );

  const selectedKeys = useMemo(() => [pathname], [pathname]);

  const defaultOpenKeys = useMemo(() => {
    if (collapsed) return [];
    const paths = pathname.split('/').filter(Boolean);
    if (paths.length > 1) {
      return [`/${paths[0]}`];
    }
    return [];
  }, [pathname, collapsed]);

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
          defaultOpenKeys={defaultOpenKeys}
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
