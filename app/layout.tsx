import type { Metadata } from 'next'
import './globals.css'
import ClientLayout from './client-layout'
import { AuthKitProvider } from '@workos-inc/authkit-nextjs/components'
import { GeistSans } from "geist/font/sans";

export const metadata: Metadata = {
  title: 'Evidoxa',
  description: 'Verwalten Sie Personen, Ereignisse und historische Daten',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className={GeistSans.className} suppressHydrationWarning={true}>
        <AuthKitProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AuthKitProvider>
      </body>
    </html>
  )
} 