'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const adminClient = createAdminClient()
  const { data: profile } = await adminClient.from('profiles').select('id').eq('user_id', user.id).single()
  if (!profile) throw new Error('Profile not found')
  const { data: roles } = await adminClient.from('profile_roles').select('role').eq('profile_id', profile.id)
  const roleNames = roles?.map((r) => r.role) ?? []
  if (!roleNames.includes('ADMIN') && !roleNames.includes('ORGANIZER')) throw new Error('Insufficient permissions')
  return adminClient
}

// ── Participants (profiles) ───────────────────────────────────────────────────

export async function updateParticipant(id: string, fields: {
  full_name?: string
  email?: string
  category?: string
  organization_name?: string
  status?: string
  needs_visa?: boolean
  nationality?: string
  country_of_residence?: string
  job_title?: string
  linkedin_url?: string
  bio?: string
  phone?: string
}) {
  const adminClient = await requireAdmin()
  const { error } = await adminClient.from('profiles').update(fields).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/participants')
  revalidatePath('/dashboard')
}

// ── Universities ──────────────────────────────────────────────────────────────

export async function updateUniversity(id: string, fields: {
  name?: string
  country?: string
  status?: string
  team_count?: number | null
  poc_name?: string
  poc_email?: string
  poc_title?: string
  poc_phone?: string
  notes?: string
}) {
  const adminClient = await requireAdmin()
  const { error } = await adminClient.from('universities').update(fields).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/universities')
  revalidatePath('/dashboard')
}

// ── Sponsors ──────────────────────────────────────────────────────────────────

export async function updateSponsor(id: string, fields: {
  name?: string
  sponsorship?: string
  status?: string
  reach?: string
  notes?: string
  poc_name?: string
  poc_email?: string
  poc_title?: string
  poc_phone?: string
  poc_notes?: string
}) {
  const adminClient = await requireAdmin()
  const { error } = await adminClient.from('sponsors').update(fields).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/sponsors')
  revalidatePath('/dashboard')
}

// ── Passes ────────────────────────────────────────────────────────────────────

export async function updatePass(id: string, fields: {
  full_name?: string
  category?: string
  poc_name?: string
  title?: string
  organization?: string
  status?: string
  email?: string
  phone?: string
  linkedin_url?: string
  dietary_restrictions?: string
  allergies?: string
  details?: string
}) {
  const adminClient = await requireAdmin()
  const { error } = await adminClient.from('passes').update(fields).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/passes')
  revalidatePath('/dashboard')
}
