'use client';

import { Layout, Menu, type MenuProps } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined,
  CustomerServiceOutlined,
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: string,
  icon?: React.ReactNode,
  children?: MenuItem[]
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const menuItems: MenuItem[] = [
  getItem('Dashboard', '/', <DashboardOutlined />),
  getItem('Khách hàng', '/customers', <TeamOutlined />, [
    getItem('Danh sách', '/customers'),
    getItem('Thêm mới', '/customers/create'),
    getItem('Nhóm khách hàng', '/customers/groups'),
  ]),
  getItem('Liên hệ', '/contacts', <UserOutlined />, [
    getItem('Danh sách', '/contacts'),
    getItem('Thêm mới', '/contacts/create'),
  ]),
  getItem('Đơn hàng', '/orders', <ShoppingCartOutlined />, [
    getItem('Tất cả đơn hàng', '/orders'),
    getItem('Đơn hàng mới', '/orders/new'),
    getItem('Đang xử lý', '/orders/processing'),
    getItem('Hoàn thành', '/orders/completed'),
  ]),
  getItem('Sản phẩm', '/products', <FileTextOutlined />, [
    getItem('Danh sách', '/products'),
    getItem('Danh mục', '/products/categories'),
  ]),
  getItem('Hỗ trợ', '/support', <CustomerServiceOutlined />, [
    getItem('Ticket', '/support/tickets'),
    getItem('FAQ', '/support/faq'),
  ]),
  getItem('Báo cáo', '/reports', <BarChartOutlined />, [
    getItem('Doanh thu', '/reports/revenue'),
    getItem('Khách hàng', '/reports/customers'),
    getItem('Sản phẩm', '/reports/products'),
  ]),
  getItem('Cài đặt', '/settings', <SettingOutlined />, [
    getItem('Thông tin chung', '/settings/general'),
    getItem('Người dùng', '/settings/users'),
    getItem('Phân quyền', '/settings/roles'),
  ]),
];

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

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
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 101,
      }}
    >
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <h1
          style={{
            color: '#fff',
            margin: 0,
            fontSize: collapsed ? 20 : 24,
            fontWeight: 700,
            transition: 'all 0.2s',
          }}
        >
          {collapsed ? 'A' : 'ANA CRM'}
        </h1>
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={selectedKeys}
        defaultOpenKeys={collapsed ? [] : defaultOpenKeys}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0, paddingTop: 8 }}
      />
    </Sider>
  );
}
