'use client';

import { Layout, Menu, type MenuProps, Typography } from 'antd';
import { usePathname } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import styles from './Sidebar.module.scss';
import logo from '../../app/assets/logo/logo-ana.png';
import Image from 'next/image';
import { useTheme } from '@/lib/hooks/use-theme';
import { HiViewGridAdd } from 'react-icons/hi';
import { menuItems } from '@/constants/menu';
import { useNavigation } from '@/lib/contexts/navigation.context';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const { themeMode } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { navigateWithDelay } = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

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
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={260}
      theme={themeMode}
      className={styles.sider}
    >
      <div className={styles.logoContainer}>
        <Typography.Title level={1}>
         {!collapsed ? <Image src={logo} alt="logo" width={70} height={40} className={styles.logoImage} /> : <HiViewGridAdd 
         size={40}
         />}
        </Typography.Title>
      </div>

      <Menu
        theme={themeMode}
        mode="inline"
        selectedKeys={selectedKeys}
        defaultOpenKeys={defaultOpenKeys}
        items={menuItems}
        onClick={handleMenuClick}
        className={styles.menu}
      />
    </Sider>
  );
}
