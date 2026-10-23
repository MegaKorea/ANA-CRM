import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { AppProviders } from '@/providers';
import { ConditionalLayout } from '@/components/layout/ConditionalLayout';
import logoAna from '@/app/assets/logo/logo-ana.png';
import './scss/index.scss';

export const metadata: Metadata = {
  title: 'ANA CRM',
  description: 'Hệ thống LMS ANA',
  icons: {
    icon: logoAna.src,
    shortcut: logoAna.src,
    apple: logoAna.src,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <AntdRegistry>
          <AppProviders>
            <ConditionalLayout>{children}</ConditionalLayout>
          </AppProviders>
        </AntdRegistry>
      </body>
    </html>
  );
}
