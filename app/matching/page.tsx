import { createClient } from '@/lib/supabase/server'
import { MatchingClient } from './MatchingClient'

export default async function MatchingPage() {
  const supabase = await createClient()

  const { data: teams } = await supabase
    .from('teams')
    .select(`
      id, name, pitch_summary, stage, qualifying_path, region_label, track,
      assigned_mentor_id,
      universities (id, name, country),
      team_expertise_needs (
        priority,
        expertise_tags (id, name, domain)
      )
    `)
    .order('name')

  const { data: mentors } = await supabase
    .from('profiles')
    .select(`
      id, full_name, organization_name, geographic_focus,
      years_experience, industry_vertical,
      profile_roles!inner (role),
      profile_expertise (
        level,
        expertise_tags (id, name, domain)
      )
    `)
    .eq('profile_roles.role', 'MENTOR')
    .eq('status', 'confirmed')

  const { data: expertiseTags } = await supabase
    .from('expertise_tags')
    .select('id, name, domain')
    .order('name')

  return (
    <MatchingClient
      teams={teams ?? []}
      mentors={mentors ?? []}
      expertiseTags={expertiseTags ?? []}
    />
  )
}
