'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/supabase/auth-context'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Role } from '@/lib/types'

// ── Role config ───────────────────────────────────────────────────────────────

const ROLES: Role[] = ['ADMIN', 'ORGANIZER', 'MENTOR', 'JUDGE', 'STUDENT', 'UNIVERSITY_POC']

const roleLabel: Record<Role, string> = {
  ADMIN:          'Admin',
  ORGANIZER:      'Organizer',
  MENTOR:         'Mentor',
  JUDGE:          'Judge',
  STUDENT:        'Student',
  UNIVERSITY_POC: 'University POC',
}

const roleDotColor: Record<Role, string> = {
  ADMIN:          'bg-red-500',
  ORGANIZER:      'bg-orange-500',
  MENTOR:         'bg-blue-500',
  JUDGE:          'bg-purple-500',
  STUDENT:        'bg-green-500',
  UNIVERSITY_POC: 'bg-teal-500',
}

const roleAvatarBg: Record<Role, string> = {
  ADMIN:          'bg-red-500',
  ORGANIZER:      'bg-orange-500',
  MENTOR:         'bg-blue-500',
  JUDGE:          'bg-purple-500',
  STUDENT:        'bg-green-500',
  UNIVERSITY_POC: 'bg-teal-500',
}

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ── Logo mark ─────────────────────────────────────────────────────────────────

function LogoMark() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/gssf-logo.png" alt="GSSF" width={60} height={60} className="rounded" />
  )
}

// ── TopBar ────────────────────────────────────────────────────────────────────

export function TopBar() {
  const { user, roles } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  // Demo role switcher — purely local UI state, does not affect auth or sidebar
  const primaryRole = (roles[0] as Role | undefined) ?? 'ADMIN'
  const [demoRole, setDemoRole] = useState<Role>(primaryRole)
  const activeRole: Role = roles.length > 0 ? primaryRole : demoRole

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? 'Admin'
  const displayEmail = user?.email ?? ''

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  return (
    <header
      style={{ height: 56, zIndex: 50 }}
      className="fixed inset-x-0 top-0 flex items-center justify-between border-b border-slate-200 bg-white px-4"
    >
      {/* Left — logo */}
      <div className="flex items-center gap-2.5">
        <LogoMark />
        <span className="text-[15px] font-bold text-slate-900">GSSF VIP</span>
      </div>

      {/* Center — program label */}
      <div className="flex items-center">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[13px] font-medium text-slate-600">
          GSSF Worlds 2026
        </span>
      </div>

      {/* Right — role indicator + avatar */}
      <div className="flex items-center gap-3">
        {/* Demo role switcher (visible in dev; shows real role in prod) */}
        {roles.length === 0 && (
          <select
            value={demoRole}
            onChange={(e) => setDemoRole(e.target.value as Role)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[13px] text-slate-700 focus:outline-none"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{roleLabel[r]}</option>
            ))}
          </select>
        )}

        {roles.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${roleDotColor[activeRole]}`} />
            <span className="text-[13px] text-slate-600">{roleLabel[activeRole]}</span>
          </div>
        )}

        {/* Divider */}
        <div className="h-5 w-px bg-slate-200" />

        {/* Avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[12px] font-semibold text-white ${roleAvatarBg[activeRole]}`}
          >
            {initials(displayName)}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-1.5 py-1.5">
              <p className="text-[13px] font-medium text-slate-900">{displayName}</p>
              {displayEmail && (
                <p className="text-[11px] text-slate-500 truncate">{displayEmail}</p>
              )}
              <p className="text-[11px] text-slate-400 mt-0.5">{roleLabel[activeRole]}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-[13px] text-red-600 focus:text-red-600 cursor-pointer"
              onSelect={handleSignOut}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
