import type { Metadata } from 'next';
import { AppProviders } from '@/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'ANA CRM - Quản lý khách hàng',
  description: 'Hệ thống quản lý quan hệ khách hàng',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
