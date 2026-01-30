'use client';

import { Layout, Menu, type MenuProps } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import styles from './Sidebar.module.scss';
import logo from '../../app/assets/logo/logo-ana.png';
import Image from 'next/image';
import { useTheme } from '@/lib/hooks/use-theme';
import { HiViewGridAdd } from 'react-icons/hi';
import { menuItems } from '@/constants/menu';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { themeMode } = useTheme();

  const selectedKeys = useMemo(() => [pathname], [pathname]);

  const defaultOpenKeys = useMemo(() => {
    const paths = pathname.split('/').filter(Boolean);
    if (paths.length > 1) {
      return [`/${paths[0]}`];
    }
    return [];
  }, [pathname]);

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    router.push(key);
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
        <h1>
         {!collapsed ? <Image src={logo} alt="logo" width={70} height={50} className={styles.logoImage} /> : <HiViewGridAdd 
         size={40}
         />}
        </h1>
      </div>

      <Menu
        theme={themeMode}
        mode="inline"
        selectedKeys={selectedKeys}
        defaultOpenKeys={collapsed ? [] : defaultOpenKeys}
        items={menuItems}
        onClick={handleMenuClick}
        className={styles.menu}
      />
    </Sider>
  );
}
