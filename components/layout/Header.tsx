'use client';

import { Layout, Avatar, Dropdown, Space, Input, Button, type MenuProps } from 'antd';
import {
  SearchOutlined,
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
import { ThemeMode } from '@/constants/enums/theme.enum';

const { Header: AntHeader } = Layout;

interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Header({ collapsed, onToggle }: HeaderProps) {
  const { themeMode, toggleTheme } = useTheme();

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Tài khoản',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
    },
  ];

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    switch (key) {
      case 'profile':
        break;
      case 'settings':
        break;
      case 'logout':
        break;
    }
  };

  return (
    <AntHeader className={styles.header}>
      <Space size="middle">
        <span onClick={onToggle} className={styles.toggleButton}>
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </span>
      </Space>

      <Space size="middle">
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
            <Avatar size="small" icon={<UserOutlined />} />
            <span className={styles.userName}>Admin</span>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
}
