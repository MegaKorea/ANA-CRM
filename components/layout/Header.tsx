'use client';

import { Layout, Avatar, Dropdown, Space, Badge, Input, type MenuProps } from 'antd';
import {
  BellOutlined,
  SearchOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';

const { Header: AntHeader } = Layout;

interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Header({ collapsed, onToggle }: HeaderProps) {
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
        // Handle profile navigation
        break;
      case 'settings':
        // Handle settings navigation
        break;
      case 'logout':
        // Handle logout
        break;
    }
  };

  return (
    <AntHeader
      style={{
        padding: '0 24px',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Left section */}
      <Space size="middle">
        <span
          onClick={onToggle}
          style={{ fontSize: 18, cursor: 'pointer', color: '#001529' }}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </span>
        <Input
          placeholder="Tìm kiếm..."
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          style={{ width: 250, borderRadius: 20 }}
          allowClear
        />
      </Space>

      {/* Right section */}
      <Space size="middle">
        <Badge count={5} size="small">
          <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
        </Badge>
        <Dropdown
          menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Space style={{ cursor: 'pointer' }}>
            <Avatar size="small" icon={<UserOutlined />} />
            <span style={{ color: '#001529' }}>Admin</span>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
}
