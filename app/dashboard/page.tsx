import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const [
    { count: totalParticipants },
    { count: confirmedCount },
    { count: visaCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('needs_visa', true),
  ])

  const { data: uniTeamCounts } = await supabase.from('universities').select('team_count')
  const totalTeams = (uniTeamCounts ?? []).reduce((sum, u) => sum + (u.team_count ?? 0), 0)

  const { data: duplicates } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('is_duplicate', true)

  const { data: rubricAcks } = await supabase.from('rubric_acknowledgments').select('profile_id')
  const { count: totalJudges } = await supabase.from('profile_roles').select('*', { count: 'exact', head: true }).eq('role', 'JUDGE')
  const { data: visaLetters } = await supabase.from('visa_letters').select('id, status')
  const { data: scheduleStatus } = await supabase.from('pitch_slots').select('schedule_published').limit(1).maybeSingle()

  const { data: recentActivity } = await supabase
    .from('profiles')
    .select('id, full_name, email, created_at, status, profile_roles (role)')
    .order('created_at', { ascending: false })
    .limit(10)

  // ── People directory sources ──────────────────────────────────────────────

  const { data: participants } = await adminClient
    .from('profiles')
    .select('id, full_name, email, category, organization_name, status, needs_visa, profile_roles (role, program_id), cohort_history (year, role)')
    .order('full_name')

  const { data: universities } = await adminClient
    .from('universities')
    .select('id, name, country, poc_name, poc_email, poc_title, poc_phone, team_count, status')
    .order('name')

  const { data: sponsors } = await adminClient
    .from('sponsors')
    .select('id, name, sponsorship, status, poc_name, poc_email, poc_title, poc_phone')
    .order('name')

  const { data: passes } = await adminClient
    .from('passes')
    .select('id, full_name, email, category, organization, title, status, phone, dietary_restrictions, allergies, details, poc_name')
    .order('full_name')

  return (
    <DashboardClient
      stats={{
        totalParticipants: totalParticipants ?? 0,
        totalTeams:        totalTeams ?? 0,
        confirmedCount:    confirmedCount ?? 0,
        matchedTeams:      0,
        visaCount:         visaCount ?? 0,
      }}
      duplicates={duplicates ?? []}
      recentActivity={recentActivity ?? []}
      readiness={{
        rubricAcksCount:      rubricAcks?.length ?? 0,
        totalJudges:          totalJudges ?? 0,
        matchedTeams:         0,
        totalTeams:           totalTeams ?? 0,
        schedulePublished:    scheduleStatus?.schedule_published ?? false,
        visaLettersGenerated: visaLetters?.length ?? 0,
        visaRequired:         visaCount ?? 0,
        hasDuplicates:        (duplicates?.length ?? 0) > 0,
      }}
      participants={participants ?? []}
      universities={universities ?? []}
      sponsors={sponsors ?? []}
      passes={passes ?? []}
    />
  )
}
