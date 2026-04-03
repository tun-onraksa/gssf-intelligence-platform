'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useStore } from '@/lib/store'
import type { Role } from '@/lib/types'

// ── Role config ──────────────────────────────────────────────────────────────

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

// Name per role — maps the "active persona" to a display name
const rolePersonaName: Record<Role, string> = {
  ADMIN:          'Mike Lee',
  ORGANIZER:      'Gigi Wang',
  MENTOR:         'Rachel Kim',
  JUDGE:          'Sarah Chen',
  STUDENT:        'Alex Ramos',
  UNIVERSITY_POC: 'Ji-ho Park',
}

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ── Logo mark ────────────────────────────────────────────────────────────────

function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <rect width="28" height="28" rx="7" fill="#3B82F6" />
      <text
        x="14"
        y="20"
        textAnchor="middle"
        fill="white"
        fontFamily="system-ui, sans-serif"
        fontWeight="700"
        fontSize="16"
      >
        G
      </text>
    </svg>
  )
}

// ── TopBar ────────────────────────────────────────────────────────────────────

export function TopBar() {
  const { activeRole, activeProgramId, programs, setRole, setActiveProgram } = useStore()

  const visiblePrograms = programs.filter(
    (p) => p.type === 'Worlds' || p.status === 'active'
  )

  const personaName = rolePersonaName[activeRole]

  return (
    <header
      style={{ height: 56, zIndex: 50 }}
      className="fixed inset-x-0 top-0 flex items-center justify-between border-b border-slate-200 bg-white px-4"
    >
      {/* Left — logo */}
      <div className="flex items-center gap-2.5">
        <LogoMark />
        <span className="text-[15px] font-bold text-slate-900">GSSC VIP</span>
      </div>

      {/* Center — program selector */}
      <div className="flex items-center">
        <Select value={activeProgramId} onValueChange={(v) => v && setActiveProgram(v)}>
          <SelectTrigger className="h-8 w-[220px] border-slate-200 text-[13px]">
            <SelectValue placeholder="Select program" />
          </SelectTrigger>
          <SelectContent>
            {visiblePrograms.map((p) => (
              <SelectItem key={p.programId} value={p.programId} className="text-[13px]">
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Right — role switcher + avatar */}
      <div className="flex items-center gap-3">
        {/* Role switcher */}
        <Select value={activeRole} onValueChange={(v) => v && setRole(v as Role)}>
          <SelectTrigger className="h-8 w-[160px] border-slate-200 text-[13px]">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${roleDotColor[activeRole]}`} />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((role) => (
              <SelectItem key={role} value={role} className="text-[13px]">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${roleDotColor[role]}`} />
                  {roleLabel[role]}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Divider */}
        <div className="h-5 w-px bg-slate-200" />

        {/* Avatar with tooltip */}
        <TooltipProvider delay={300}>
          <Tooltip>
            <TooltipTrigger
              className={`flex h-8 w-8 cursor-default items-center justify-center rounded-full text-[12px] font-semibold text-white ${roleAvatarBg[activeRole]}`}
            >
              {initials(personaName)}
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[12px]">
              <p className="font-medium">{personaName}</p>
              <p className="text-muted-foreground">{roleLabel[activeRole]}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  )
}
