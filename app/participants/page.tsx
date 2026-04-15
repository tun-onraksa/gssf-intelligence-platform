import { createClient } from '@/lib/supabase/server'
import { ParticipantsClient } from './ParticipantsClient'

export default async function ParticipantsPage() {
  const supabase = await createClient()

  const { data: participants } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      nationality,
      country_of_residence,
      bio,
      linkedin_url,
      organization_name,
      job_title,
      needs_visa,
      status,
      is_duplicate,
      geographic_focus,
      years_experience,
      created_at,
      profile_roles (role, program_id),
      cohort_history (
        year,
        role,
        program_id,
        team_id,
        programs:program_id (name)
      ),
      profile_expertise (
        level,
        expertise_tags (id, name, domain)
      ),
      judge_conflicts (
        team_id,
        university_id,
        reason,
        teams:team_id (name),
        universities:university_id (name)
      ),
      rubric_acknowledgments (acknowledged_at),
      team_members (
        teams (id, name)
      ),
      university_pocs (
        universities (id, name)
      )
    `)
    .order('created_at', { ascending: false })

  const { data: universities } = await supabase
    .from('universities')
    .select('id, name, country')
    .order('name')

  return (
    <ParticipantsClient
      participants={participants ?? []}
      universities={universities ?? []}
    />
  )
}
