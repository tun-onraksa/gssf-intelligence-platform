import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { UniversitiesClient } from './UniversitiesClient'

export default async function UniversitiesPage() {
  const supabase = await createClient()

  // Try fetching with new columns; fall back to base columns if they don't exist yet
  let universities: Record<string, unknown>[] = []

  const { data, error } = await supabase
    .from('universities')
    .select('id, name, country, active_status, cohort_history, status, team_count, poc_name, poc_title, poc_email, poc_phone, notes')
    .order('name')

  if (error) {
    // New columns may not exist yet — fall back to base columns
    const adminClient = createAdminClient()
    const { data: fallback } = await adminClient
      .from('universities')
      .select('id, name, country, active_status, cohort_history')
      .order('name')
    universities = (fallback ?? []) as unknown as Record<string, unknown>[]
  } else {
    universities = (data ?? []) as unknown as Record<string, unknown>[]
  }

  // Fetch team names from master_attendees, keyed by organization name
  const adminClient = createAdminClient()
  const { data: attendees } = await adminClient
    .from('master_attendees')
    .select('organization, team_name')
    .not('team_name', 'is', null)
    .neq('team_name', '')

  // Build map: university name (lowercased) → unique team names
  const teamsByUniversity: Record<string, string[]> = {}
  for (const a of attendees ?? []) {
    if (!a.organization?.trim() || !a.team_name?.trim()) continue
    const key = a.organization.trim().toLowerCase()
    if (!teamsByUniversity[key]) teamsByUniversity[key] = []
    const name = a.team_name.trim()
    if (!teamsByUniversity[key].includes(name)) teamsByUniversity[key].push(name)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <UniversitiesClient universities={universities as any} teamsByUniversity={teamsByUniversity} />
}
