'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createInvite(formData: {
  email: string
  role: string
  teamName?: string
  track?: string
}) {
  const supabase = await createClient()

  // Verify the caller is ADMIN or ORGANIZER
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  const { data: roles } = await supabase
    .from('profile_roles')
    .select('role')
    .eq('profile_id', profile.id)

  const roleNames = roles?.map(r => r.role) ?? []
  if (!roleNames.includes('ADMIN') && !roleNames.includes('ORGANIZER')) {
    throw new Error('Insufficient permissions')
  }

  // Use admin client to bypass RLS for invite creation
  const adminClient = createAdminClient()

  // Resolve the active Worlds program UUID from the DB, creating it if absent
  let { data: program } = await adminClient
    .from('programs')
    .select('id')
    .eq('type', 'Worlds')
    .eq('status', 'active')
    .maybeSingle()

  if (!program) {
    const { data: created, error: createError } = await adminClient
      .from('programs')
      .insert({ name: 'GSSF Worlds 2026', type: 'Worlds', status: 'active', year: 2026 })
      .select('id')
      .single()

    if (createError || !created) {
      throw new Error('Failed to resolve program: ' + createError?.message)
    }
    program = created
  }

  // Resolve team UUID by name if provided
  let teamId: string | null = null
  if (formData.teamName) {
    const { data: team, error: teamError } = await adminClient
      .from('teams')
      .select('id')
      .eq('name', formData.teamName)
      .maybeSingle()

    if (teamError) throw new Error('Failed to look up team: ' + teamError.message)
    if (!team) throw new Error(`Team "${formData.teamName}" not found in database`)
    teamId = team.id
  }

  // Check for existing pending invite for this email + program
  const { data: existing } = await adminClient
    .from('invites')
    .select('id, status')
    .eq('email', formData.email)
    .eq('program_id', program.id)
    .maybeSingle()

  if (existing && existing.status === 'pending') {
    throw new Error('A pending invite already exists for this email in this program')
  }

  // Insert invite record
  const { data: invite, error: inviteError } = await adminClient
    .from('invites')
    .insert({
      email: formData.email,
      role: formData.role,
      program_id: program.id,
      team_id: teamId,
      track: formData.track ?? null,
      invited_by: profile.id,
    })
    .select()
    .single()

  if (inviteError || !invite) {
    throw new Error('Failed to create invite: ' + inviteError?.message)
  }

  // Invite record is now the source of truth.
  // The invitee signs in via Google OAuth at /login — the auth callback will
  // detect the pending invite by email and apply their role automatically.
  // No magic link is sent; Google sign-in is the only auth method.

  const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/login`

  revalidatePath('/participants')
  return { success: true, inviteId: invite.id, loginUrl }
}

export async function resendInvite(inviteId: string) {
  const adminClient = createAdminClient()

  const { data: invite } = await adminClient
    .from('invites')
    .select('*')
    .eq('id', inviteId)
    .single()

  if (!invite) throw new Error('Invite not found')

  // Reset expiry
  await adminClient
    .from('invites')
    .update({ expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
    .eq('id', inviteId)

  if (!invite.token) throw new Error('Invite token missing — cannot resend')

  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/onboarding%3Ftoken%3D${invite.token}`
  const { error } = await adminClient.auth.admin.inviteUserByEmail(invite.email, {
    redirectTo,
  })

  if (error) throw new Error('Failed to resend: ' + error.message)
  return { success: true }
}