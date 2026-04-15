'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function generateVisaLetters(programId: string) {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Find confirmed participants who need visas
  const { data: participants } = await adminClient
    .from('profiles')
    .select(`
      id,
      full_name,
      needs_visa,
      passport_number,
      status,
      profile_roles!inner(program_id)
    `)
    .eq('needs_visa', true)
    .eq('status', 'confirmed')
    .eq('profile_roles.program_id', programId)

  if (!participants || participants.length === 0) {
    return { success: true, generated: 0 }
  }

  const { data: existing } = await adminClient
    .from('visa_letters')
    .select('profile_id')
    .eq('program_id', programId)

  const existingIds = new Set(existing?.map(l => l.profile_id) ?? [])

  const newLetters = participants
    .filter(p => !existingIds.has(p.id))
    .map(p => ({
      profile_id:   p.id,
      program_id:   programId,
      version:      1,
      status:       'generated' as const,
      generated_at: new Date().toISOString(),
    }))

  if (newLetters.length > 0) {
    const { error } = await adminClient.from('visa_letters').insert(newLetters)
    if (error) throw new Error('Failed to generate letters: ' + error.message)
  }

  revalidatePath('/visa')
  return { success: true, generated: newLetters.length }
}

export async function markVisaLetterSent(letterId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('visa_letters')
    .update({
      status:  'sent',
      sent_at: new Date().toISOString(),
    })
    .eq('id', letterId)

  if (error) throw new Error('Failed to mark as sent: ' + error.message)

  revalidatePath('/visa')
  return { success: true }
}

export async function regenerateVisaLetter(letterId: string) {
  const supabase = await createClient()

  const { data: letter } = await supabase
    .from('visa_letters')
    .select('version')
    .eq('id', letterId)
    .single()

  if (!letter) throw new Error('Letter not found')

  const { error } = await supabase
    .from('visa_letters')
    .update({
      version:      (letter.version ?? 1) + 1,
      status:       'generated',
      generated_at: new Date().toISOString(),
      sent_at:      null,
    })
    .eq('id', letterId)

  if (error) throw new Error('Failed to regenerate: ' + error.message)

  revalidatePath('/visa')
  return { success: true }
}
