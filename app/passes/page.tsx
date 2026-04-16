import { createAdminClient } from '@/lib/supabase/admin'
import { PassesClient } from './PassesClient'

export default async function PassesPage() {
  const adminClient = createAdminClient()

  const { data: passes } = await adminClient
    .from('passes')
    .select('id, full_name, category, poc_name, title, organization, status, email, phone, linkedin_url, dietary_restrictions, allergies, details, headshot_url')
    .order('full_name')

  return <PassesClient passes={passes ?? []} />
}
