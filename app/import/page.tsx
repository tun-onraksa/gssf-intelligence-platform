import { createClient } from '@/lib/supabase/server'
import { ImportClient } from './ImportClient'

export default async function ImportPage() {
  const supabase = await createClient()
  const { data: program } = await supabase
    .from('programs')
    .select('id, name')
    .eq('status', 'active')
    .eq('type', 'Worlds')
    .maybeSingle()

  return (
    <ImportClient
      programId={program?.id ?? ''}
      programName={program?.name ?? 'GSSC Worlds 2026'}
    />
  )
}
