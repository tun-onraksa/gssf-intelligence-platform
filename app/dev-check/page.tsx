import { createClient } from '@/lib/supabase/server'

export default async function DevCheckPage() {
  const supabase = await createClient()

  const [
    { count: profileCount },
    { count: teamCount },
    { count: visaCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('teams').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('needs_visa', true),
  ])

  const stats = {
    totalProfiles:   profileCount ?? 0,
    totalTeams:      teamCount    ?? 0,
    visaRequired:    visaCount    ?? 0,
  }

  return (
    <div style={{ fontFamily: 'monospace', padding: '2rem' }}>
      <h1>Data Layer Verification (live Supabase)</h1>
      <pre>{JSON.stringify(stats, null, 2)}</pre>
    </div>
  )
}
