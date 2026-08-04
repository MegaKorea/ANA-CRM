import type { MenuProps } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  SafetyOutlined,
  ContactsOutlined,
  BookOutlined,
  ReadOutlined,
  DollarOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { REPORTS_ACCESS_ROLES } from '@/constants/reports';


export type MenuItem = Required<MenuProps>['items'][number];


export type AppMenuItem = {
  key: string;
  icon?: React.ReactNode;
  label: React.ReactNode;
  roles?: string[];
  children?: AppMenuItem[];
};

export { REPORTS_ACCESS_ROLES };

export const menuItems: AppMenuItem[] = [
  {
    key: '/admin',
    icon: <UserOutlined />,
    label: 'QUẢN TRỊ',
    roles: ['ADMIN'],
    children: [
      {
        key: '/admin/user',
        icon: <TeamOutlined />,
        label: 'NGƯỜI DÙNG',
      },
      {
        key: '/admin/user/role',
        icon: <SafetyOutlined />,
        label: 'VAI TRÒ',
      },
    ],
  },
  {
    key: '/lead',
    icon: <ContactsOutlined />,
    label: 'DATA',
    roles: ['ADMIN', 'TELESALES', 'AO', 'PC'],
  },
  {
    key: '/accounting',
    icon: <DollarOutlined />,
    label: 'KẾ TOÁN',
    roles: ['ADMIN', 'ACCOUNTANT'],
  },
  {
    key: '/reports',
    icon: <BarChartOutlined />,
    label: 'BÁO CÁO',
    roles: [...REPORTS_ACCESS_ROLES],
  },
  {
    key: '/lms',
    icon: <ReadOutlined />,
    label: 'LMS',
    children: [
      {
        key: '/course',
        icon: <BookOutlined />,
        label: 'KHÓA HỌC',
        roles: ['ADMIN', 'TELESALES', 'AO', 'PC', 'STU'],
      },
      {
        key: '/class',
        icon: <TeamOutlined />,
        label: 'LỚP HỌC',
      },
    ],
  },
];
