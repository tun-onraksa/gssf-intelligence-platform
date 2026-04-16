import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { AppShell } from '@/components/layout/AppShell'
import { AuthProvider } from '@/lib/supabase/auth-context'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'GSSF VIP',
  description: 'GSSF Program Intelligence Platform',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  )
}
