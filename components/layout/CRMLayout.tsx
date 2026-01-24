'use client';

import { useState, type ReactNode } from 'react';
import { Layout } from 'antd';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

const { Content } = Layout;

interface CRMLayoutProps {
  children: ReactNode;
}

export function CRMLayout({ children }: CRMLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  const siderWidth = collapsed ? 80 : 260;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} />

      {/* Main Layout */}
      <Layout
        style={{
          marginLeft: siderWidth,
          transition: 'margin-left 0.2s',
        }}
      >
        {/* Header */}
        <Header collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

        {/* Content */}
        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: '#fff',
            borderRadius: 8,
            minHeight: 'calc(100vh - 64px - 48px - 53px)',
            overflow: 'auto',
          }}
        >
          {children}
        </Content>

        {/* Footer */}
        <Footer />
      </Layout>
    </Layout>
  );
}
