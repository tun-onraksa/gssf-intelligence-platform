'use client'

import { useRouter } from 'next/navigation'
import { ChevronDown, GraduationCap, User, Scale } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

export function SimulateInviteButton() {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-none"
      >
        Simulate Invite
        <ChevronDown size={14} className="text-slate-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuItem
          className="cursor-pointer gap-2.5"
          onClick={() => router.push('/onboarding/student')}
        >
          <User size={14} className="text-green-600" />
          Student Invite
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-2.5"
          onClick={() => router.push('/onboarding/mentor')}
        >
          <GraduationCap size={14} className="text-blue-600" />
          Mentor Invite
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-2.5"
          onClick={() => router.push('/onboarding/judge')}
        >
          <Scale size={14} className="text-purple-600" />
          Judge Invite
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
