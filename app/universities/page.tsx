import { createClient } from '@/lib/supabase/server'
import { UniversitiesClient } from './UniversitiesClient'

export default async function UniversitiesPage() {
  const supabase = await createClient()

  const { data: universities } = await supabase
    .from('universities')
    .select(`
      id, name, country, active_status, cohort_history,
      university_pocs (
        profiles (id, full_name, email, organization_name)
      )
    `)
    .order('name')

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, track, stage, qualifying_path, region_label, university_id')
    .order('name')

  return (
    <UniversitiesClient
      universities={universities ?? []}
      teams={teams ?? []}
    />
  )
}
