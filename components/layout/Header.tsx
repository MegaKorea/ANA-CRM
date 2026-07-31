'use client';

import { memo, useMemo, useCallback } from 'react';
import { Layout, Avatar, Dropdown, Space, Button, type MenuProps } from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import styles from './Header.module.scss';
import { useTheme } from '@/lib/hooks/use-theme';
import { useCurrentUser } from '@/lib/hooks/use-current-user';
import { useLogout } from '@/lib/hooks/use-auth';
import { ThemeMode } from '@/constants/enums/theme.enum';
import { HeaderMenuText } from '@/constants/header';
import { AppointmentReminder } from './AppointmentReminder';
import { StudentNotificationBell } from './StudentNotificationBell';
import { PushToggle } from './PushToggle';

const { Header: AntHeader } = Layout;

interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Header = memo(function Header({ collapsed, onToggle }: HeaderProps) {
  const { themeMode, toggleTheme } = useTheme();
  const { user, isLoading } = useCurrentUser();
  const { mutate: logout } = useLogout();

  const userMenuItems: MenuProps['items'] = useMemo(
    () => [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: HeaderMenuText.PROFILE,
      },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: HeaderMenuText.SETTINGS,
      },
      {
        type: 'divider',
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: HeaderMenuText.LOGOUT,
        danger: true,
      },
    ],
    []
  );

  const handleUserMenuClick: MenuProps['onClick'] = useCallback(
    ({ key }: { key: string }) => {
      switch (key) {
        case 'profile':
          break;
        case 'settings':
          break;
        case 'logout':
          logout();
          break;
      }
    },
    [logout]
  );

  const displayName = useMemo(
    () => user?.fullName || HeaderMenuText.DEFAULT_USER_NAME,
    [user]
  );
  const userAvatar = useMemo(
    () => (user?.email ? user.email.charAt(0).toUpperCase() : undefined),
    [user]
  );

  return (
    <AntHeader className={styles.header}>
      <Space size="middle">
        <span onClick={onToggle} className={styles.toggleButton}>
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </span>
      </Space>

      <Space size="middle">
        <PushToggle />
        <StudentNotificationBell />
        <AppointmentReminder />
        <Button
          type="text"
          icon={themeMode === ThemeMode.DARK ? <SunOutlined /> : <MoonOutlined />}
          onClick={toggleTheme}
          className={styles.themeToggleButton}
        />
        <Dropdown
          menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Space className={styles.userDropdown}>
            <Avatar size="small" icon={!userAvatar && <UserOutlined />}>
              {userAvatar}
            </Avatar>
            <span className={styles.userName}>
              {isLoading ? HeaderMenuText.LOADING : displayName}
            </span>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
});
