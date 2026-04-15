'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { User, GraduationCap, MapPin, Plane, CheckCircle, Check, Lock, Loader2 } from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { StepForm } from '@/components/shared/StepForm'
import { createClient } from '@/lib/supabase/client'
import { submitOnboarding } from '@/lib/actions/onboarding'

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Personal\nInfo', icon: User },
  { label: 'Academic', icon: GraduationCap },
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

// ── Styles ────────────────────────────────────────────────────────────────────

const inp = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors'
const lbl = 'text-sm font-medium text-slate-700'
const errCls = 'mt-1 text-xs text-red-500'

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return <label className={lbl}>{children}{required && <span className="ml-0.5 text-red-500">*</span>}</label>
}
function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className={errCls}>{msg}</p> : null
}
function F({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1">{children}</div>
}

// ── Context banner ────────────────────────────────────────────────────────────

function InviteBanner({ teamName }: { teamName?: string }) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
      <span className="mt-0.5 text-lg">🎓</span>
      <div>
        <p className="text-sm text-blue-800">
          You&apos;ve been invited to join <span className="font-bold">{teamName ?? 'your team'}</span> as a Student
        </p>
        <p className="mt-0.5 text-[12px] text-blue-500">GSSC Worlds 2026 · Seoul, May 17–21</p>
      </div>
    </div>
  )
}

// ── Form type ─────────────────────────────────────────────────────────────────

type F1 = {
  firstName: string; lastName: string; email: string
  nationality: string; country: string; bio: string
  yearOfStudy: string; fieldOfStudy: string; linkedin: string; website: string
  tshirt: string; dietary: string; dietaryOther: string
  emergencyName: string; emergencyPhone: string; accessibility: string
  needsVisa: string; fullLegalName: string; passportNumber: string
  passportExpiry: string; dateOfBirth: string; issuingCountry: string
  arrivalDate: string; departingCity: string; flightBooked: string
}
type Err = Partial<Record<keyof F1, string>>

const INIT: F1 = {
  firstName: '', lastName: '', email: '',
  nationality: '', country: '', bio: '',
  yearOfStudy: '', fieldOfStudy: '', linkedin: '', website: '',
  tshirt: '', dietary: '', dietaryOther: '',
  emergencyName: '', emergencyPhone: '', accessibility: '',
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
        <h1 className="text-2xl font-bold text-slate-900">You&apos;re all set, {firstName}!</h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Your profile has been submitted for GSSC Worlds 2026. You&apos;ll receive a confirmation
          email at <span className="font-medium text-slate-800">{email}</span> shortly.
        </p>
        <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">What&apos;s next</p>
          <p className="mt-1 text-sm text-slate-600">
            Your organizer will be in touch about next steps and logistics before May 17.
          </p>
        </div>
        <a href="/dashboard" className="mt-6 block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
          Back to Dashboard
        </a>
      </div>
    </div>
  )
}

// ── Steps ─────────────────────────────────────────────────────────────────────

function Step1({ f, set, e, teamName }: { f: F1; set: (k: keyof F1, v: string) => void; e: Err; teamName?: string }) {
  const left = 300 - f.bio.length
  return (
    <div className="space-y-4">
      <InviteBanner teamName={teamName} />
      <div className="grid grid-cols-2 gap-3">
        <F><Label required>First Name</Label>
          <input className={inp} value={f.firstName} onChange={(ev) => set('firstName', ev.target.value)} placeholder="Alex" />
          <FieldError msg={e.firstName} /></F>
        <F><Label required>Last Name</Label>
          <input className={inp} value={f.lastName} onChange={(ev) => set('lastName', ev.target.value)} placeholder="Ramos" />
          <FieldError msg={e.lastName} /></F>
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
        <FieldError msg={e.nationality} /></F>
      <F><Label required>Country of Residence</Label>
        <Select value={f.country || undefined} onValueChange={(v) => v && set('country', v)}>
          <SelectTrigger className="w-full h-9"><SelectValue placeholder="Select country…" /></SelectTrigger>
          <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <FieldError msg={e.country} /></F>
      <F><Label>Short Bio</Label>
        <textarea className={`${inp} min-h-[80px] resize-none`} value={f.bio}
          onChange={(ev) => ev.target.value.length <= 300 && set('bio', ev.target.value)}
          placeholder="Tell us about yourself — your background, interests, and what you're building." />
        <p className={`text-right text-[11px] ${left < 30 ? 'text-red-400' : 'text-slate-400'}`}>{left} chars left</p></F>
    </div>
  )
}

function Step2({ f, set, e }: { f: F1; set: (k: keyof F1, v: string) => void; e: Err }) {
  return (
    <div className="space-y-4">
      <F><Label>University</Label>
        <div className="relative">
          <input className={`${inp} bg-slate-50 text-slate-500 pr-8`} value="USC (University of Southern California)" readOnly />
          <Lock size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <p className="text-[11px] text-slate-400">Linked to your team invitation.</p></F>
      <F><Label>Year of Study</Label>
        <Select value={f.yearOfStudy || undefined} onValueChange={(v) => v && set('yearOfStudy', v)}>
          <SelectTrigger className="w-full h-9"><SelectValue placeholder="Select year…" /></SelectTrigger>
          <SelectContent>
            {['Freshman','Sophomore','Junior','Senior','Graduate','PhD'].map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select></F>
      <F><Label required>Field of Study</Label>
        <input className={inp} value={f.fieldOfStudy} onChange={(ev) => set('fieldOfStudy', ev.target.value)} placeholder="e.g. Computer Science, Business" />
        <FieldError msg={e.fieldOfStudy} /></F>
      <F><Label>LinkedIn URL</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">in</span>
          <input className={`${inp} pl-8`} value={f.linkedin} onChange={(ev) => set('linkedin', ev.target.value)} placeholder="linkedin.com/in/yourprofile" />
        </div></F>
      <F><Label>Personal Website</Label>
        <input className={inp} value={f.website} onChange={(ev) => set('website', ev.target.value)} placeholder="https://yoursite.com (optional)" /></F>
    </div>
  )
}

function Step3({ f, set, e }: { f: F1; set: (k: keyof F1, v: string) => void; e: Err }) {
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
        <F><Label>Please describe your dietary needs</Label>
          <input className={inp} value={f.dietaryOther} onChange={(ev) => set('dietaryOther', ev.target.value)} placeholder="Describe your restrictions" /></F>
      )}
      <div className="grid grid-cols-2 gap-3">
        <F><Label required>Emergency Contact Name</Label>
          <input className={inp} value={f.emergencyName} onChange={(ev) => set('emergencyName', ev.target.value)} placeholder="Full name" />
          <FieldError msg={e.emergencyName} /></F>
        <F><Label required>Emergency Contact Phone</Label>
          <input className={inp} value={f.emergencyPhone} onChange={(ev) => set('emergencyPhone', ev.target.value)} placeholder="+1 555 000 0000" />
          <FieldError msg={e.emergencyPhone} /></F>
      </div>
      <F><Label>Accessibility Needs</Label>
        <textarea className={`${inp} min-h-[80px] resize-none`} value={f.accessibility}
          onChange={(ev) => set('accessibility', ev.target.value)}
          placeholder="Any accessibility requirements? (optional)" /></F>
    </div>
  )
}

function Step4({ f, set, e }: { f: F1; set: (k: keyof F1, v: string) => void; e: Err }) {
  const needsPassport = f.needsVisa === 'Yes' || f.needsVisa === 'Not sure'
  return (
    <div className="space-y-5">
      <F><Label required>Do you require a visa to travel to South Korea?</Label>
        <div className="mt-1 flex gap-5">
          {['Yes','No','Not sure'].map((opt) => (
            <label key={opt} className="flex cursor-pointer items-center gap-2">
              <input type="radio" name="needsVisa" value={opt} checked={f.needsVisa === opt}
                onChange={() => set('needsVisa', opt)} className="accent-blue-600" />
              <span className="text-sm text-slate-700">{opt}</span>
            </label>
          ))}
        </div>
        <FieldError msg={e.needsVisa} /></F>

      {needsPassport && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Passport Details</p>
          <F><Label required>Full Legal Name (as on passport)</Label>
            <input className={inp} value={f.fullLegalName} onChange={(ev) => set('fullLegalName', ev.target.value)} placeholder="Exactly as it appears on your passport" />
            <FieldError msg={e.fullLegalName} /></F>
          <div className="grid grid-cols-2 gap-3">
            <F><Label required>Passport Number</Label>
              <input className={inp} value={f.passportNumber} onChange={(ev) => set('passportNumber', ev.target.value)} placeholder="A12345678" />
              <FieldError msg={e.passportNumber} /></F>
            <F><Label required>Issuing Country</Label>
              <Select value={f.issuingCountry || undefined} onValueChange={(v) => v && set('issuingCountry', v)}>
                <SelectTrigger className="w-full h-9"><SelectValue placeholder="Country…" /></SelectTrigger>
                <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <FieldError msg={e.issuingCountry} /></F>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F><Label required>Passport Expiry</Label>
              <input type="date" className={inp} value={f.passportExpiry} onChange={(ev) => set('passportExpiry', ev.target.value)} />
              <FieldError msg={e.passportExpiry} /></F>
            <F><Label required>Date of Birth</Label>
              <input type="date" className={inp} value={f.dateOfBirth} onChange={(ev) => set('dateOfBirth', ev.target.value)} />
              <FieldError msg={e.dateOfBirth} /></F>
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
              <input type="radio" name="flightBooked" value={opt} checked={f.flightBooked === opt}
                onChange={() => set('flightBooked', opt)} className="accent-blue-600" />
              <span className="text-sm text-slate-700">{opt}</span>
            </label>
          ))}
        </div></F>
    </div>
  )
}

function Step5({ f, teamName }: { f: F1; teamName?: string }) {
  const rows = [
    ['Name', `${f.firstName} ${f.lastName}`],
    ['Email', f.email],
    ['Nationality', f.nationality || '—'],
    ['Country', f.country || '—'],
    ['Team', teamName ?? '—'],
    ['Year of Study', f.yearOfStudy || '—'],
    ['Field of Study', f.fieldOfStudy || '—'],
    ['T-Shirt', f.tshirt || '—'],
    ['Dietary', f.dietary === 'Other' ? (f.dietaryOther || 'Other') : (f.dietary || '—')],
    ['Visa Required', f.needsVisa || '—'],
    ['Passport', f.passportNumber ? 'On file' : '—'],
    ['Arrival Date', f.arrivalDate || '—'],
  ]
  return (
    <div className="space-y-1">
      <p className="mb-4 text-sm text-slate-500">Review your information before submitting.</p>
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between border-b border-slate-100 py-2 last:border-0">
          <span className="text-sm text-slate-400">{label}</span>
          <span className="text-sm font-medium text-slate-800">{value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TITLES = [
  { title: 'Personal Information', subtitle: 'Tell us about yourself.' },
  { title: 'Academic Background',  subtitle: 'Your university and study details.' },
  { title: 'Logistics',            subtitle: 'T-shirt, dietary, and emergency contact.' },
  { title: 'Travel & Passport',    subtitle: 'Visa and travel details for Seoul.' },
  { title: 'Confirm & Submit',     subtitle: 'Review your information before submitting.' },
]

type InviteContext = { email: string; role: string; programId: string; teamId?: string; track?: string }

function StudentOnboardingContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const supabase = createClient()

  const [teamName, setTeamName] = useState<string | undefined>(undefined)
  const [step, setStep] = useState(0)
  const [form, setFormState] = useState<F1>(INIT)
  const [errors, setErrors] = useState<Err>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [inviteContext, setInviteContext] = useState<InviteContext | null>(null)
  const [inviteError, setInviteError] = useState(false)

  function set(key: keyof F1, value: string) {
    setFormState((p) => ({ ...p, [key]: value }))
    setErrors((p) => ({ ...p, [key]: undefined }))
  }

  useEffect(() => {
    if (!token) { setInviteError(true); return }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any).rpc('get_invite_by_token', { invite_token: token })
      .then(async ({ data, error }: { data: Record<string, unknown>[] | null; error: unknown }) => {
        if (error || !data || data.length === 0) {
          setInviteError(true)
        } else {
          const invite = data[0] as Record<string, string | null>
          const ctx: InviteContext = {
            email: invite.email ?? '',
            role: invite.role ?? '',
            programId: invite.program_id ?? '',
            teamId: invite.team_id ?? undefined,
            track: invite.track ?? undefined,
          }
          setInviteContext(ctx)
          set('email', ctx.email)

          // Fetch team name if team is assigned
          if (ctx.teamId) {
            const { data: team } = await supabase
              .from('teams')
              .select('name')
              .eq('id', ctx.teamId)
              .single()
            if (team) setTeamName(team.name)
          }
        }
      })
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  if (inviteError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-sm">
          <h2 className="text-lg font-semibold text-slate-900">Invalid or expired invite</h2>
          <p className="text-sm text-slate-500 mt-2">
            This invite link is no longer valid. Please contact your program organizer for a new invite.
          </p>
        </div>
      </div>
    )
  }

  if (!inviteContext) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
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
      if (!form.fieldOfStudy) e.fieldOfStudy = 'Required'
    }
    if (s === 2) {
      if (!form.emergencyName)  e.emergencyName  = 'Required'
      if (!form.emergencyPhone) e.emergencyPhone = 'Required'
    }
    if (s === 3) {
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

  async function handleSubmit() {
    try {
      await submitOnboarding({
        token: token!,
        fullName: `${form.firstName} ${form.lastName}`,
        nationality: form.nationality,
        countryOfResidence: form.country,
        bio: form.bio || undefined,
        linkedinUrl: form.linkedin || undefined,
        needsVisa: form.needsVisa === 'Yes',
        passportNumber: form.passportNumber || undefined,
        passportExpiry: form.passportExpiry || undefined,
        passportIssuingCountry: form.issuingCountry || undefined,
        legalName: form.fullLegalName || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        dietaryRestrictions: form.dietary === 'Other' ? form.dietaryOther : form.dietary || undefined,
        tshirtSize: form.tshirt || undefined,
        emergencyContactName: form.emergencyName || undefined,
        emergencyContactPhone: form.emergencyPhone || undefined,
        arrivalDate: form.arrivalDate || undefined,
        departurCity: form.departingCity || undefined,
        flightBooked: form.flightBooked === 'Yes',
        accessibilityNeeds: form.accessibility || undefined,
      })
      setSubmitted(true)
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed')
    }
  }

  if (submitted) return <SuccessCard firstName={form.firstName} email={form.email} />

  const steps = [
    <Step1 key={0} f={form} set={set} e={errors} teamName={teamName} />,
    <Step2 key={1} f={form} set={set} e={errors} />,
    <Step3 key={2} f={form} set={set} e={errors} />,
    <Step4 key={3} f={form} set={set} e={errors} />,
    <Step5 key={4} f={form} teamName={teamName} />,
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
    >
      {steps[step]}
      {submitError && (
        <p className="mt-3 text-sm text-red-500">{submitError}</p>
      )}
    </StepForm>
  )
}

export default function StudentOnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>}>
      <StudentOnboardingContent />
    </Suspense>
  )
}
