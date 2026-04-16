import { createAdminClient } from '@/lib/supabase/admin'
import { SponsorsClient } from './SponsorsClient'

export default async function SponsorsPage() {
  const adminClient = createAdminClient()

  const { data: sponsors } = await adminClient
    .from('sponsors')
    .select('id, name, sponsorship, status, reach, notes, logo_url, poc_name, poc_title, poc_email, poc_phone, poc_notes')
    .order('name')

  return <SponsorsClient sponsors={sponsors ?? []} />
}
