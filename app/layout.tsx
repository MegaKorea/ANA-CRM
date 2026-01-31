import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { AppProviders } from '@/providers';
import { ConditionalLayout } from '@/components/layout/ConditionalLayout';
import './scss/index.scss';

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ANA CRM',
  description: 'Hệ thống quản lý quan hệ khách hàng',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${poppins.variable} antialiased`}>
        <AppProviders>
          <ConditionalLayout>{children}</ConditionalLayout>
        </AppProviders>
      </body>
    </html>
  );
}
