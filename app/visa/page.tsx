import { createClient } from '@/lib/supabase/server'
import { VisaClient } from './VisaClient'

export default async function VisaPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user!.id)
    .single()

  const { data: roleRow } = await supabase
    .from('profile_roles')
    .select('program_id')
    .eq('profile_id', profile!.id)
    .not('program_id', 'is', null)
    .limit(1)
    .single()

  const programId = roleRow?.program_id ?? ''

  // Confirmed participants who need a visa in this program
  const { data: participants } = await supabase
    .from('profiles')
    .select(`
      id, full_name, nationality, country_of_residence, passport_number,
      needs_visa, status, organization_name,
      profile_roles!inner (role, program_id)
    `)
    .eq('needs_visa', true)
    .eq('status', 'confirmed')
    .eq('profile_roles.program_id', programId)

  const { data: visaLetters } = await supabase
    .from('visa_letters')
    .select('id, profile_id, program_id, version, status, generated_at, sent_at')
    .eq('program_id', programId)

  return (
    <VisaClient
      programId={programId}
      participants={participants ?? []}
      visaLetters={visaLetters ?? []}
    />
  )
}
