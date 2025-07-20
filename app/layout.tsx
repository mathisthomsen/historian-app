import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import ClientLayout from './client-layout';
import SessionProvider from './components/providers/SessionProvider';

export const metadata: Metadata = {
  title: 'Historian App',
  description: 'A comprehensive platform for historical research and data management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
        <SessionProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </SessionProvider>
      </body>
    </html>
  );
} 