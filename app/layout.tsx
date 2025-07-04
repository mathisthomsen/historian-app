import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientLayout from './client-layout'
import { AuthKitProvider } from '@workos-inc/authkit-nextjs/components'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Historian App',
  description: 'Verwalten Sie Personen, Ereignisse und historische Daten',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className={inter.className} suppressHydrationWarning={true}>
        <AuthKitProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AuthKitProvider>
      </body>
    </html>
  )
} 