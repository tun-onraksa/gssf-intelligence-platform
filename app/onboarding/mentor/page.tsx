'use client'

import { useState } from 'react'
import { User, Briefcase, Sparkles, MapPin, Plane, CheckCircle, Check, Lock } from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { StepForm } from '@/components/shared/StepForm'
import { useStore } from '@/lib/store'
import type { Person, ExpertiseLevel } from '@/lib/types'

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Personal\nInfo', icon: User },
  { label: 'Background', icon: Briefcase },
  { label: 'Expertise', icon: Sparkles },
  { label: 'Logistics', icon: MapPin },
  { label: 'Travel', icon: Plane },
  { label: 'Confirm', icon: CheckCircle },
]

const COUNTRIES = [
  'Afghanistan','Argentina','Australia','Austria','Belgium','Brazil','Canada',
  'Chile','China','Colombia','Denmark','Egypt','Ethiopia','Finland','France',
  'Germany','Ghana','Greece','Hong Kong','India','Indonesia','Ireland','Israel',
  'Italy','Japan','Jordan','Kenya','Malaysia','Mexico','Netherlands','New Zealand',
  'Nigeria','Norway','Pakistan','Peru','Philippines','Poland','Portugal',
  'Saudi Arabia','Singapore','South Africa','South Korea','Spain','Sweden',
  'Switzerland','Taiwan','Thailand','Turkey','UAE','United Kingdom',
  'United States','Vietnam','Zimbabwe',
]

const EXPERTISE_TAGS = [
  // Sector
  { tagId: 'tag_01', name: 'B2B SaaS',          domain: 'Sector' },
  { tagId: 'tag_02', name: 'Consumer',           domain: 'Sector' },
  { tagId: 'tag_03', name: 'Hardware',           domain: 'Sector' },
  { tagId: 'tag_04', name: 'Climate Tech',       domain: 'Sector' },
  { tagId: 'tag_05', name: 'FinTech',            domain: 'Sector' },
  { tagId: 'tag_06', name: 'HealthTech',         domain: 'Sector' },
  { tagId: 'tag_07', name: 'EdTech',             domain: 'Sector' },
  { tagId: 'tag_15', name: 'Web3',               domain: 'Sector' },
  // Function
  { tagId: 'tag_08', name: 'Go-to-Market',       domain: 'Function' },
  { tagId: 'tag_09', name: 'Fundraising',        domain: 'Function' },
  { tagId: 'tag_10', name: 'Product',            domain: 'Function' },
  { tagId: 'tag_11', name: 'BD & Partnerships',  domain: 'Function' },
  { tagId: 'tag_13', name: 'Ops & Scaling',      domain: 'Function' },
  { tagId: 'tag_14', name: 'Legal & Compliance', domain: 'Function' },
  // Technology
  { tagId: 'tag_12', name: 'AI/ML',              domain: 'Technology' },
]

const LEVELS: ExpertiseLevel[] = ['Practitioner', 'Expert', 'Deep Expert']

// ── Styles ────────────────────────────────────────────────────────────────────

const inp = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors'
const lbl = 'text-sm font-medium text-slate-700'
const errCls = 'mt-1 text-xs text-red-500'

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return <label className={lbl}>{children}{required && <span className="ml-0.5 text-red-500">*</span>}</label>
}
function FErr({ msg }: { msg?: string }) {
  return msg ? <p className={errCls}>{msg}</p> : null
}
function F({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1">{children}</div>
}

// ── Form type ─────────────────────────────────────────────────────────────────

type ExpertiseSelection = Record<string, ExpertiseLevel>

type MF = {
  firstName: string; lastName: string; email: string
  nationality: string; country: string; bio: string
  organization: string; jobTitle: string; vertical: string
  yearsExperience: string; geoFocus: string; linkedin: string; proBio: string
  tshirt: string; dietary: string; dietaryOther: string
  emergencyName: string; emergencyPhone: string; accessibility: string
  availDays: string[]; mentorFormats: string[]; avoidTopics: string
  needsVisa: string; fullLegalName: string; passportNumber: string
  passportExpiry: string; dateOfBirth: string; issuingCountry: string
  arrivalDate: string; departingCity: string; flightBooked: string
}
type Err = Partial<Record<keyof MF | 'expertise', string>>

const INIT: MF = {
  firstName: '', lastName: '', email: 'mentor@example.com',
  nationality: '', country: '', bio: '',
  organization: '', jobTitle: '', vertical: '',
  yearsExperience: '', geoFocus: '', linkedin: '', proBio: '',
  tshirt: '', dietary: '', dietaryOther: '',
  emergencyName: '', emergencyPhone: '', accessibility: '',
  availDays: [], mentorFormats: [], avoidTopics: '',
  needsVisa: '', fullLegalName: '', passportNumber: '',
  passportExpiry: '', dateOfBirth: '', issuingCountry: '',
  arrivalDate: '', departingCity: '', flightBooked: '',
}

// ── Success ───────────────────────────────────────────────────────────────────

function SuccessCard({ firstName, email }: { firstName: string; email: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-lg">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check size={28} className="text-green-600" strokeWidth={3} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {firstName}!</h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Your mentor profile is confirmed for GSSC Worlds 2026. The organizing team will match
          you with teams based on your expertise.
        </p>
        <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">What&apos;s next</p>
          <p className="mt-1 text-sm text-slate-600">
            You&apos;ll be notified of your team assignments before May 17. Confirmation email sent to{' '}
            <span className="font-medium text-slate-800">{email}</span>.
          </p>
        </div>
        <a href="/dashboard" className="mt-6 block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
          Back to Dashboard
        </a>
      </div>
    </div>
  )
}

// ── Step components ───────────────────────────────────────────────────────────

function Step1({ f, set, e }: { f: MF; set: (k: keyof MF, v: string) => void; e: Err }) {
  const left = 300 - f.bio.length
  return (
    <div className="space-y-4">
      <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <span className="mt-0.5 text-lg">🌟</span>
        <div>
          <p className="text-sm text-amber-900">You&apos;ve been invited as a <span className="font-bold">Mentor</span></p>
          <p className="mt-0.5 text-[12px] text-amber-600">GSSC Worlds 2026 · Seoul, May 17–21</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <F><Label required>First Name</Label>
          <input className={inp} value={f.firstName} onChange={(ev) => set('firstName', ev.target.value)} placeholder="Jane" />
          <FErr msg={e.firstName} /></F>
        <F><Label required>Last Name</Label>
          <input className={inp} value={f.lastName} onChange={(ev) => set('lastName', ev.target.value)} placeholder="Kim" />
          <FErr msg={e.lastName} /></F>
      </div>
      <F><Label required>Email</Label>
        <div className="relative">
          <input className={`${inp} bg-slate-50 text-slate-500 pr-8`} value={f.email} readOnly />
          <Lock size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <p className="text-[11px] text-slate-400">Pre-filled from your invite.</p></F>
      <F><Label required>Nationality</Label>
        <Select value={f.nationality || undefined} onValueChange={(v) => v && set('nationality', v)}>
          <SelectTrigger className="w-full h-9"><SelectValue placeholder="Select nationality…" /></SelectTrigger>
          <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <FErr msg={e.nationality} /></F>
      <F><Label required>Country of Residence</Label>
        <Select value={f.country || undefined} onValueChange={(v) => v && set('country', v)}>
          <SelectTrigger className="w-full h-9"><SelectValue placeholder="Select country…" /></SelectTrigger>
          <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <FErr msg={e.country} /></F>
      <F><Label>Short Bio</Label>
        <textarea className={`${inp} min-h-[80px] resize-none`} value={f.bio}
          onChange={(ev) => ev.target.value.length <= 300 && set('bio', ev.target.value)}
          placeholder="Tell us about yourself — background, interests, and what you're excited to mentor on." />
        <p className={`text-right text-[11px] ${left < 30 ? 'text-red-400' : 'text-slate-400'}`}>{left} chars left</p></F>
    </div>
  )
}

function Step2({ f, set, e }: { f: MF; set: (k: keyof MF, v: string) => void; e: Err }) {
  const left = 500 - f.proBio.length
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <F><Label required>Current Organization</Label>
          <input className={inp} value={f.organization} onChange={(ev) => set('organization', ev.target.value)} placeholder="Company or institution" />
          <FErr msg={e.organization} /></F>
        <F><Label required>Job Title</Label>
          <input className={inp} value={f.jobTitle} onChange={(ev) => set('jobTitle', ev.target.value)} placeholder="e.g. VP of Product" />
          <FErr msg={e.jobTitle} /></F>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <F><Label required>Industry Vertical</Label>
          <Select value={f.vertical || undefined} onValueChange={(v) => v && set('vertical', v)}>
            <SelectTrigger className="w-full h-9"><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              {['Technology','Finance','Healthcare','Climate','Consumer','Education','Deep Tech','Other'].map((v) => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FErr msg={e.vertical} /></F>
        <F><Label required>Years of Experience</Label>
          <Select value={f.yearsExperience || undefined} onValueChange={(v) => v && set('yearsExperience', v)}>
            <SelectTrigger className="w-full h-9"><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              {['1–3','3–5','5–10','10–15','15+'].map((y) => <SelectItem key={y} value={y}>{y} years</SelectItem>)}
            </SelectContent>
          </Select>
          <FErr msg={e.yearsExperience} /></F>
      </div>
      <F><Label required>Geographic Focus</Label>
        <Select value={f.geoFocus || undefined} onValueChange={(v) => v && set('geoFocus', v)}>
          <SelectTrigger className="w-full h-9"><SelectValue placeholder="Select region…" /></SelectTrigger>
          <SelectContent>
            {['North America','Latin America','Europe','South Asia','Southeast Asia','East Asia','Middle East','Africa','Global'].map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FErr msg={e.geoFocus} /></F>
      <F><Label required>LinkedIn URL</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">in</span>
          <input className={`${inp} pl-8`} value={f.linkedin} onChange={(ev) => set('linkedin', ev.target.value)} placeholder="linkedin.com/in/yourprofile" />
        </div>
        <FErr msg={e.linkedin} /></F>
      <F><Label required>Professional Bio</Label>
        <textarea className={`${inp} min-h-[100px] resize-none`} value={f.proBio}
          onChange={(ev) => ev.target.value.length <= 500 && set('proBio', ev.target.value)}
          placeholder="Describe your professional background, key achievements, and what you bring as a mentor." />
        <p className={`text-right text-[11px] ${left < 50 ? 'text-red-400' : 'text-slate-400'}`}>{left} chars left</p>
        <FErr msg={e.proBio} /></F>
    </div>
  )
}

function Step3({
  expertise, setExpertise, errors,
}: {
  expertise: ExpertiseSelection
  setExpertise: (s: ExpertiseSelection) => void
  errors: Err
}) {
  const count = Object.keys(expertise).length

  function toggleTag(tagId: string) {
    if (expertise[tagId]) {
      const next = { ...expertise }
      delete next[tagId]
      setExpertise(next)
    } else {
      setExpertise({ ...expertise, [tagId]: 'Expert' })
    }
  }

  function setLevel(tagId: string, level: ExpertiseLevel) {
    setExpertise({ ...expertise, [tagId]: level })
  }

  const domains = ['Sector', 'Function', 'Technology'] as const

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
        <p className="text-sm text-slate-600 leading-relaxed">
          Select the areas where you can add the most value to a founding team. Be specific —
          this directly powers mentor–team matching.
        </p>
      </div>

      {domains.map((domain) => {
        const tags = EXPERTISE_TAGS.filter((t) => t.domain === domain)
        return (
          <div key={domain}>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">{domain}</p>
            <div className="grid grid-cols-2 gap-2">
              {tags.map((tag) => {
                const selected = !!expertise[tag.tagId]
                const level = expertise[tag.tagId]
                return (
                  <div
                    key={tag.tagId}
                    onClick={() => toggleTag(tag.tagId)}
                    className={`relative cursor-pointer rounded-lg border p-3 transition-all select-none ${
                      selected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {selected && (
                      <div className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600">
                        <Check size={9} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                    <p className="text-[13px] font-medium text-slate-800">{tag.name}</p>
                    <p className="text-[11px] text-slate-400">{tag.domain}</p>

                    {selected && (
                      <div
                        className="mt-2 border-t border-blue-200 pt-2"
                        onClick={(ev) => ev.stopPropagation()}
                      >
                        <p className="mb-1 text-[10px] text-blue-600">Expertise level:</p>
                        <div className="flex gap-2">
                          {LEVELS.map((lvl) => (
                            <label key={lvl} className="flex cursor-pointer items-center gap-1">
                              <input
                                type="radio"
                                name={`level_${tag.tagId}`}
                                value={lvl}
                                checked={level === lvl}
                                onChange={() => setLevel(tag.tagId, lvl)}
                                className="accent-blue-600"
                              />
                              <span className="text-[10px] text-slate-600">{lvl.replace('Deep ', 'Deep\u00A0')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="flex items-center justify-between">
        <p className={`text-sm font-medium ${count >= 2 ? 'text-green-600' : 'text-slate-500'}`}>
          {count === 0 ? 'No areas selected yet' : `${count} area${count !== 1 ? 's' : ''} selected`}
        </p>
        {count < 2 && (
          <p className="text-xs text-amber-600">Select at least 2 to continue</p>
        )}
      </div>
      {errors.expertise && <p className="text-xs text-red-500">{errors.expertise}</p>}
    </div>
  )
}

function Step4({
  f, set, e,
  availDays, toggleDay,
  mentorFormats, toggleFormat,
}: {
  f: MF; set: (k: keyof MF, v: string) => void; e: Err
  availDays: string[]; toggleDay: (d: string) => void
  mentorFormats: string[]; toggleFormat: (fmt: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <F><Label>T-Shirt Size</Label>
          <Select value={f.tshirt || undefined} onValueChange={(v) => v && set('tshirt', v)}>
            <SelectTrigger className="w-full h-9"><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>{['XS','S','M','L','XL','XXL'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select></F>
        <F><Label>Dietary Restrictions</Label>
          <Select value={f.dietary || undefined} onValueChange={(v) => v && set('dietary', v)}>
            <SelectTrigger className="w-full h-9"><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              {['None','Vegetarian','Vegan','Halal','Kosher','Gluten-Free','Other'].map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select></F>
      </div>
      {f.dietary === 'Other' && (
        <F><Label>Describe your dietary needs</Label>
          <input className={inp} value={f.dietaryOther} onChange={(ev) => set('dietaryOther', ev.target.value)} placeholder="Describe your restrictions" /></F>
      )}
      <div className="grid grid-cols-2 gap-3">
        <F><Label required>Emergency Contact Name</Label>
          <input className={inp} value={f.emergencyName} onChange={(ev) => set('emergencyName', ev.target.value)} placeholder="Full name" />
          <FErr msg={e.emergencyName} /></F>
        <F><Label required>Emergency Contact Phone</Label>
          <input className={inp} value={f.emergencyPhone} onChange={(ev) => set('emergencyPhone', ev.target.value)} placeholder="+1 555 000 0000" />
          <FErr msg={e.emergencyPhone} /></F>
      </div>
      <F><Label>Accessibility Needs</Label>
        <textarea className={`${inp} min-h-[60px] resize-none`} value={f.accessibility}
          onChange={(ev) => set('accessibility', ev.target.value)} placeholder="Any accessibility requirements? (optional)" /></F>

      <div className="rounded-lg border border-slate-200 p-3">
        <p className="mb-2 text-sm font-medium text-slate-700">Availability during Worlds 2026 (May 17–21)</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {['May 17 (Opening)','May 18','May 19 (Pitch Day)','May 20','May 21 (Demo Day)'].map((day) => (
            <label key={day} className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={availDays.includes(day)} onChange={() => toggleDay(day)} className="accent-blue-600" />
              <span className="text-[12px] text-slate-700">{day}</span>
            </label>
          ))}
        </div>
      </div>

      <F><Label>Preferred Mentoring Format</Label>
        <div className="flex flex-wrap gap-3 mt-1">
          {['1:1 sessions','Group workshops','Ad-hoc / Slack'].map((fmt) => (
            <label key={fmt} className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={mentorFormats.includes(fmt)} onChange={() => toggleFormat(fmt)} className="accent-blue-600" />
              <span className="text-sm text-slate-700">{fmt}</span>
            </label>
          ))}
        </div></F>

      <F><Label>Topics to avoid mentoring on</Label>
        <textarea className={`${inp} min-h-[60px] resize-none`} value={f.avoidTopics}
          onChange={(ev) => set('avoidTopics', ev.target.value)} placeholder="Any topics you'd prefer not to mentor? (optional)" /></F>
    </div>
  )
}

function Step5({ f, set, e }: { f: MF; set: (k: keyof MF, v: string) => void; e: Err }) {
  const needsPassport = f.needsVisa === 'Yes' || f.needsVisa === 'Not sure'
  return (
    <div className="space-y-5">
      <F><Label required>Do you require a visa to travel to South Korea?</Label>
        <div className="mt-1 flex gap-5">
          {['Yes','No','Not sure'].map((opt) => (
            <label key={opt} className="flex cursor-pointer items-center gap-2">
              <input type="radio" name="mv_needsVisa" value={opt} checked={f.needsVisa === opt}
                onChange={() => set('needsVisa', opt)} className="accent-blue-600" />
              <span className="text-sm text-slate-700">{opt}</span>
            </label>
          ))}
        </div>
        <FErr msg={e.needsVisa} /></F>

      {needsPassport && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Passport Details</p>
          <F><Label required>Full Legal Name (as on passport)</Label>
            <input className={inp} value={f.fullLegalName} onChange={(ev) => set('fullLegalName', ev.target.value)} placeholder="Exactly as it appears on your passport" />
            <FErr msg={e.fullLegalName} /></F>
          <div className="grid grid-cols-2 gap-3">
            <F><Label required>Passport Number</Label>
              <input className={inp} value={f.passportNumber} onChange={(ev) => set('passportNumber', ev.target.value)} placeholder="A12345678" />
              <FErr msg={e.passportNumber} /></F>
            <F><Label required>Issuing Country</Label>
              <Select value={f.issuingCountry || undefined} onValueChange={(v) => v && set('issuingCountry', v)}>
                <SelectTrigger className="w-full h-9"><SelectValue placeholder="Country…" /></SelectTrigger>
                <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <FErr msg={e.issuingCountry} /></F>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F><Label required>Passport Expiry</Label>
              <input type="date" className={inp} value={f.passportExpiry} onChange={(ev) => set('passportExpiry', ev.target.value)} />
              <FErr msg={e.passportExpiry} /></F>
            <F><Label required>Date of Birth</Label>
              <input type="date" className={inp} value={f.dateOfBirth} onChange={(ev) => set('dateOfBirth', ev.target.value)} />
              <FErr msg={e.dateOfBirth} /></F>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <F><Label>Expected Arrival in Seoul</Label>
          <input type="date" className={inp} value={f.arrivalDate} onChange={(ev) => set('arrivalDate', ev.target.value)} /></F>
        <F><Label>Departing From</Label>
          <input className={inp} value={f.departingCity} onChange={(ev) => set('departingCity', ev.target.value)} placeholder="City name" /></F>
      </div>
      <F><Label>Flight Booked?</Label>
        <div className="mt-1 flex gap-5">
          {['Yes','No','Not yet'].map((opt) => (
            <label key={opt} className="flex cursor-pointer items-center gap-2">
              <input type="radio" name="mv_flight" value={opt} checked={f.flightBooked === opt}
                onChange={() => set('flightBooked', opt)} className="accent-blue-600" />
              <span className="text-sm text-slate-700">{opt}</span>
            </label>
          ))}
        </div></F>
    </div>
  )
}

function Step6({ f, expertise }: { f: MF; expertise: ExpertiseSelection }) {
  const selectedTags = EXPERTISE_TAGS.filter((t) => !!expertise[t.tagId])
  const rows = [
    ['Name', `${f.firstName} ${f.lastName}`],
    ['Email', f.email],
    ['Nationality', f.nationality || '—'],
    ['Organization', f.organization || '—'],
    ['Title', f.jobTitle || '—'],
    ['Vertical', f.vertical || '—'],
    ['Experience', f.yearsExperience ? `${f.yearsExperience} yrs` : '—'],
    ['Geographic Focus', f.geoFocus || '—'],
    ['Visa Required', f.needsVisa || '—'],
    ['Passport', f.passportNumber ? 'On file' : '—'],
  ]
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Review your profile before submitting.</p>
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between border-b border-slate-100 pb-2 last:border-0">
          <span className="text-sm text-slate-400">{label}</span>
          <span className="text-sm font-medium text-slate-800">{value}</span>
        </div>
      ))}
      {selectedTags.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-slate-400">Expertise Areas</p>
          <div className="flex flex-wrap gap-1.5">
            {selectedTags.map((t) => (
              <span key={t.tagId} className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                {t.name} · {expertise[t.tagId]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TITLES = [
  { title: 'Personal Information',    subtitle: 'Tell us about yourself.' },
  { title: 'Professional Background', subtitle: 'Your role, organization, and focus area.' },
  { title: 'Expertise Areas',         subtitle: 'Select areas where you can add the most value.' },
  { title: 'Logistics',               subtitle: 'Availability, dietary, and emergency contact.' },
  { title: 'Travel & Passport',       subtitle: 'Visa and travel details for Seoul.' },
  { title: 'Confirm & Submit',        subtitle: 'Review your mentor profile before submitting.' },
]

export default function MentorOnboardingPage() {
  const { confirmPerson } = useStore()
  const [step, setStep] = useState(0)
  const [form, setFormState] = useState<MF>(INIT)
  const [expertise, setExpertise] = useState<ExpertiseSelection>({})
  const [availDays, setAvailDays] = useState<string[]>([])
  const [mentorFormats, setMentorFormats] = useState<string[]>([])
  const [errors, setErrors] = useState<Err>({})
  const [submitted, setSubmitted] = useState(false)

  function set(key: keyof MF, value: string) {
    setFormState((p) => ({ ...p, [key]: value }))
    setErrors((p) => ({ ...p, [key]: undefined }))
  }

  function toggleDay(day: string) {
    setAvailDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }
  function toggleFormat(fmt: string) {
    setMentorFormats((prev) =>
      prev.includes(fmt) ? prev.filter((f) => f !== fmt) : [...prev, fmt]
    )
  }

  function validate(s: number): boolean {
    const e: Err = {}
    if (s === 0) {
      if (!form.firstName) e.firstName = 'Required'
      if (!form.lastName)  e.lastName  = 'Required'
      if (!form.nationality) e.nationality = 'Required'
      if (!form.country)     e.country     = 'Required'
    }
    if (s === 1) {
      if (!form.organization)    e.organization    = 'Required'
      if (!form.jobTitle)        e.jobTitle        = 'Required'
      if (!form.vertical)        e.vertical        = 'Required'
      if (!form.yearsExperience) e.yearsExperience = 'Required'
      if (!form.geoFocus)        e.geoFocus        = 'Required'
      if (!form.linkedin)        e.linkedin        = 'Required'
      if (!form.proBio)          e.proBio          = 'Required'
    }
    if (s === 2) {
      if (Object.keys(expertise).length < 2) {
        e.expertise = 'Please select at least 2 expertise areas'
      }
    }
    if (s === 3) {
      if (!form.emergencyName)  e.emergencyName  = 'Required'
      if (!form.emergencyPhone) e.emergencyPhone = 'Required'
    }
    if (s === 4) {
      if (!form.needsVisa) e.needsVisa = 'Please select an option'
      if (form.needsVisa === 'Yes' || form.needsVisa === 'Not sure') {
        if (!form.fullLegalName)  e.fullLegalName  = 'Required'
        if (!form.passportNumber) e.passportNumber = 'Required'
        if (!form.passportExpiry) e.passportExpiry = 'Required'
        if (!form.dateOfBirth)    e.dateOfBirth    = 'Required'
        if (!form.issuingCountry) e.issuingCountry = 'Required'
      }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleNext() { if (validate(step)) setStep((s) => s + 1) }

  function handleSubmit() {
    const geoFocusMap: Record<string, string> = {
      'North America': 'North America', 'Latin America': 'South America',
      'Europe': 'Europe', 'South Asia': 'South Asia', 'Southeast Asia': 'Southeast Asia',
      'East Asia': 'East Asia', 'Middle East': 'Middle East', 'Africa': 'Africa', 'Global': 'Global',
    }
    const expEntries = Object.entries(expertise).map(([tagId, level]) => ({ tagId, level }))
    const person: Person = {
      personId: `person_m_${Date.now()}`,
      name: `${form.firstName} ${form.lastName}`,
      email: form.email,
      nationality: form.nationality,
      country: form.country,
      roles: ['MENTOR'],
      status: 'confirmed',
      bio: form.bio || undefined,
      linkedIn: form.linkedin || undefined,
      organization: form.organization,
      needsVisa: form.needsVisa === 'Yes',
      passportNumber: form.passportNumber || undefined,
      dietaryRestrictions: form.dietary === 'Other' ? form.dietaryOther : form.dietary || undefined,
      expertise: expEntries,
      geographicFocus: geoFocusMap[form.geoFocus] ?? form.geoFocus,
      industryVertical: form.vertical,
      yearsExperience: form.yearsExperience ? parseInt(form.yearsExperience.split('–')[0] ?? form.yearsExperience) : undefined,
      conflictWithTeamIds: [],
      conflictWithUniversityIds: [],
      rubricAck: false,
      cohortHistory: [{ programId: 'prog_worlds_2026', year: 2026, role: 'MENTOR' }],
      programIds: ['prog_worlds_2026'],
    }
    confirmPerson(person)
    setSubmitted(true)
  }

  if (submitted) return <SuccessCard firstName={form.firstName} email={form.email} />

  const steps = [
    <Step1 key={0} f={form} set={set} e={errors} />,
    <Step2 key={1} f={form} set={set} e={errors} />,
    <Step3 key={2} expertise={expertise} setExpertise={setExpertise} errors={errors} />,
    <Step4 key={3} f={form} set={set} e={errors} availDays={availDays} toggleDay={toggleDay} mentorFormats={mentorFormats} toggleFormat={toggleFormat} />,
    <Step5 key={4} f={form} set={set} e={errors} />,
    <Step6 key={5} f={form} expertise={expertise} />,
  ]

  return (
    <StepForm
      steps={STEPS}
      currentStep={step}
      title={TITLES[step].title}
      subtitle={TITLES[step].subtitle}
      onNext={handleNext}
      onBack={() => setStep((s) => s - 1)}
      onSubmit={handleSubmit}
      isFirstStep={step === 0}
      isLastStep={step === STEPS.length - 1}
      submitLabel="Complete Onboarding"
      nextDisabled={step === 2 && Object.keys(expertise).length < 2}
    >
      {steps[step]}
    </StepForm>
  )
}
