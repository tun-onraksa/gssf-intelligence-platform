import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { count: totalParticipants },
    { count: totalTeams },
    { count: confirmedCount },
    { count: visaCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('teams').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('needs_visa', true),
  ])

  const { count: matchedTeams } = await supabase
    .from('teams')
    .select('*', { count: 'exact', head: true })
    .not('assigned_mentor_id', 'is', null)

  const { data: duplicates } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('is_duplicate', true)

  const { data: recentParticipants } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      nationality,
      country_of_residence,
      organization_name,
      needs_visa,
      status,
      is_duplicate,
      profile_roles (role, program_id),
      cohort_history (year, role, program_id)
    `)
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: rubricAcks } = await supabase
    .from('rubric_acknowledgments')
    .select('profile_id')

  const { count: totalJudges } = await supabase
    .from('profile_roles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'JUDGE')

  const { data: visaLetters } = await supabase
    .from('visa_letters')
    .select('id, status')

  const { data: scheduleStatus } = await supabase
    .from('pitch_slots')
    .select('schedule_published')
    .limit(1)
    .maybeSingle()

  const { data: previewTeams } = await supabase
    .from('teams')
    .select(`
      id, name, pitch_summary, stage, qualifying_path, region_label, track,
      universities (id, name, country),
      team_expertise_needs (
        expertise_tags (id, name, domain)
      )
    `)
    .order('name')
    .limit(6)

  return (
    <DashboardClient
      stats={{
        totalParticipants: totalParticipants ?? 0,
        totalTeams:        totalTeams ?? 0,
        confirmedCount:    confirmedCount ?? 0,
        matchedTeams:      matchedTeams ?? 0,
        visaCount:         visaCount ?? 0,
      }}
      duplicates={duplicates ?? []}
      recentParticipants={recentParticipants ?? []}
      previewTeams={previewTeams ?? []}
      readiness={{
        rubricAcksCount:      rubricAcks?.length ?? 0,
        totalJudges:          totalJudges ?? 0,
        matchedTeams:         matchedTeams ?? 0,
        totalTeams:           totalTeams ?? 0,
        schedulePublished:    scheduleStatus?.schedule_published ?? false,
        visaLettersGenerated: visaLetters?.length ?? 0,
        visaRequired:         visaCount ?? 0,
        hasDuplicates:        (duplicates?.length ?? 0) > 0,
      }}
    />
  )
}
