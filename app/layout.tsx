import type { Metadata } from 'next';
import { Mona_Sans } from 'next/font/google';
import { AppProviders } from '@/providers';
import { ConditionalLayout } from '@/components/layout/ConditionalLayout';
import './scss/index.scss';

const monaSans = Mona_Sans({
  weight: ['200', '300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-mona-sans',
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
      <body className={`${monaSans.variable} antialiased`}>
        <AppProviders>
          <ConditionalLayout>{children}</ConditionalLayout>
        </AppProviders>
      </body>
    </html>
  );
}
