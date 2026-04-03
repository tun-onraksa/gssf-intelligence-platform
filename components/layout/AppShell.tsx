'use client'

import { usePathname } from 'next/navigation'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Onboarding is a standalone experience — no shell
  if (pathname?.startsWith('/onboarding')) {
    return <>{children}</>
  }

  return (
    <>
      <TopBar />
      <Sidebar />
      <main
        style={{
          marginLeft: 240,
          paddingTop: 56,
          minHeight: '100vh',
          backgroundColor: '#F8FAFC',
        }}
        className="p-6"
      >
        {children}
      </main>
    </>
  )
}
