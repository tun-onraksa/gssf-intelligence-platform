'use client'

import { Users, Trophy, UserCheck, Sparkles, FileText } from 'lucide-react'
import { useStore } from '@/lib/store'

interface StatCardProps {
  label: string
  value: number | string
  subtext: string
  icon: React.ElementType
  accentColor: string
  iconColor: string
}

function StatCard({ label, value, subtext, icon: Icon, accentColor, iconColor }: StatCardProps) {
  return (
    <div
      className="group relative flex flex-1 flex-col gap-1 overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
      style={{ borderLeft: `3px solid ${accentColor}` }}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        <Icon size={20} style={{ color: iconColor }} className="mt-0.5 shrink-0" />
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{subtext}</p>
    </div>
  )
}

export function StatCards() {
  const { persons, teams, visaLetters } = useStore()

  const worldsPersons = persons.filter((p) => p.programIds.includes('prog_worlds_2026'))
  const confirmed = worldsPersons.filter((p) => p.status === 'confirmed').length
  const mentorsAssigned = teams.filter((t) => t.assignedMentorId).length
  const visaRequired = worldsPersons.filter((p) => p.needsVisa).length
  const lettersPending = visaRequired - visaLetters.filter((v) => v.status !== 'pending').length

  return (
    <div className="flex gap-4">
      <StatCard
        label="Total Participants"
        value={worldsPersons.length}
        subtext="Across 14 universities"
        icon={Users}
        accentColor="#3B82F6"
        iconColor="#3B82F6"
      />
      <StatCard
        label="Teams"
        value={teams.length}
        subtext="Direct + Regional"
        icon={Trophy}
        accentColor="#7C3AED"
        iconColor="#7C3AED"
      />
      <StatCard
        label="Confirmed"
        value={confirmed}
        subtext={`of ${worldsPersons.length} invited`}
        icon={UserCheck}
        accentColor="#10B981"
        iconColor="#10B981"
      />
      <StatCard
        label="Mentors Assigned"
        value={mentorsAssigned}
        subtext="of 16 teams matched"
        icon={Sparkles}
        accentColor="#F59E0B"
        iconColor="#F59E0B"
      />
      <StatCard
        label="Visa Required"
        value={visaRequired}
        subtext={`${lettersPending} letters pending`}
        icon={FileText}
        accentColor="#EF4444"
        iconColor="#EF4444"
      />
    </div>
  )
}
