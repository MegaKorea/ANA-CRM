'use client';

import { Layout } from 'antd';

const { Footer: AntFooter } = Layout;

export function Footer() {
  return (
    <AntFooter
      style={{
        textAlign: 'center',
        background: '#f0f2f5',
        padding: '16px 50px',
        color: '#8c8c8c',
        fontSize: 13,
      }}
    >
      ANA CRM &copy; {new Date().getFullYear()} - Powered by Next.js & Ant Design
    </AntFooter>
  );
}
