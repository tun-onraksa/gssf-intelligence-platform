'use client'

import { usePathname } from 'next/navigation'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { ChatBubble } from '@/components/shared/ChatBubble'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Standalone pages — no shell
  if (pathname?.startsWith('/onboarding') || pathname === '/login') {
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
      <ChatBubble />
    </>
  )
}
