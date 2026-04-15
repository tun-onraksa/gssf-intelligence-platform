import { createClient } from '@/lib/supabase/server'
import { TeamsClient } from './TeamsClient'

export default async function TeamsPage() {
  const supabase = await createClient()

  const { data: teams } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      pitch_summary,
      stage,
      qualifying_path,
      region_label,
      track,
      assigned_mentor_id,
      universities (id, name, country),
      team_members (
        profile_id,
        profiles (id, full_name, nationality, status)
      ),
      team_expertise_needs (
        priority,
        expertise_tags (id, name, domain)
      ),
      profiles:assigned_mentor_id (
        id,
        full_name,
        organization_name,
        profile_expertise (
          level,
          expertise_tags (name)
        )
      )
    `)
    .order('name')

  const { data: pitchSlots } = await supabase
    .from('pitch_slots')
    .select(`
      id, track, day, start_time, end_time, room, team_id,
      pitch_slot_judges (
        profiles (id, full_name, organization_name)
      )
    `)

  return <TeamsClient teams={teams ?? []} pitchSlots={pitchSlots ?? []} />
}
