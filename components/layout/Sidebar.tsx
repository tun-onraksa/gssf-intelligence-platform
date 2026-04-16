'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  UserCheck,
  CalendarDays,
  BarChart3,
  Building2,
  FileText,
  CircleUser,
  Upload,
  Handshake,
  Ticket,
} from 'lucide-react'
import type { Role } from '@/lib/types'
import { useAuth } from '@/lib/supabase/auth-context'

interface NavItem {
  path: string
  label: string
  icon: React.ElementType
  roles: Role[]
}

const PROGRAM_ITEMS: NavItem[] = [
  { path: '/dashboard',    label: 'Dashboard',       icon: LayoutDashboard, roles: ['ADMIN', 'ORGANIZER', 'UNIVERSITY_POC'] },
  { path: '/universities', label: 'Universities',    icon: Building2,       roles: ['ADMIN', 'ORGANIZER', 'UNIVERSITY_POC'] },
  { path: '/participants', label: 'Participants',    icon: UserCheck,       roles: ['ADMIN', 'ORGANIZER'] },
  { path: '/sponsors',    label: 'Sponsors',         icon: Handshake,       roles: ['ADMIN', 'ORGANIZER'] },
  { path: '/passes',      label: 'Passes',           icon: Ticket,          roles: ['ADMIN', 'ORGANIZER'] },
  { path: '/schedule',     label: 'Pitch Schedule (Soon)',  icon: CalendarDays,    roles: ['ADMIN', 'ORGANIZER'] },
  { path: '/scoring',      label: 'Scoring (Soon)',         icon: BarChart3,       roles: ['ADMIN', 'JUDGE'] },
]

const ADMIN_ITEMS: NavItem[] = [
  { path: '/visa',    label: 'Visa Letters (Soon)', icon: FileText, roles: ['ADMIN', 'ORGANIZER'] },
  { path: '/import',  label: 'Import Data',  icon: Upload,   roles: ['ADMIN'] },
  // { path: '/reports', label: 'Reports',      icon: PieChart, roles: ['ADMIN'] },
]

const ACCOUNT_ITEMS: NavItem[] = [
  { path: '/onboarding', label: 'My Profile', icon: CircleUser, roles: ['ADMIN', 'ORGANIZER', 'MENTOR', 'JUDGE', 'STUDENT', 'UNIVERSITY_POC'] },
]

interface SectionProps {
  label: string
  items: NavItem[]
  roles: string[]
  pathname: string
}

function NavSection({ label, items, roles, pathname }: SectionProps) {
  const visible = items.filter((item) => item.roles.some((r) => roles.includes(r)))
  if (visible.length === 0) return null

  return (
    <div className="mb-1">
      <p className="px-4 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </p>
      {visible.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.path || pathname.startsWith(item.path + '/')
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`flex h-10 items-center gap-3 px-4 text-[13px] font-medium transition-colors ${
              isActive
                ? 'border-l-[3px] border-blue-500 bg-blue-500/10 text-white'
                : 'border-l-[3px] border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <Icon size={16} />
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}

export function Sidebar() {
  const { roles } = useAuth()
  const pathname = usePathname()

  return (
    <aside
      style={{ top: 56, width: 240 }}
      className="fixed bottom-0 left-0 flex flex-col overflow-hidden bg-slate-900"
    >
      {/* Program header */}
      <div className="px-4 pb-3 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Program</p>
        <p className="mt-0.5 text-[13px] font-medium text-white">GSSF Worlds 2026</p>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto">
        <NavSection label="Program"  items={PROGRAM_ITEMS} roles={roles} pathname={pathname} />
        <NavSection label="Admin"    items={ADMIN_ITEMS}   roles={roles} pathname={pathname} />
        <NavSection label="Account"  items={ACCOUNT_ITEMS} roles={roles} pathname={pathname} />
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
          <span className="text-[11px] text-slate-400">GSSF Worlds 2026</span>
          <span className="text-[11px] text-slate-500">· Active</span>
        </div>
        <p className="mt-0.5 text-[10px] text-slate-600">v1.0 prototype</p>
      </div>
    </aside>
  )
}
