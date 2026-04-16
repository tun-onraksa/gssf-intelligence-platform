import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // After successful sign-in (Google or magic link), check for a pending
      // invite matching this user's email and apply it automatically.
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
          const adminClient = createAdminClient()
          const { data: invite } = await adminClient
            .from('invites')
            .select('*')
            .eq('email', user.email)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (invite) {
            // Ensure the profile exists
            const { data: existingProfile } = await adminClient
              .from('profiles')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle()

            let profileId = existingProfile?.id
            if (!profileId) {
              const { data: newProfile } = await adminClient
                .from('profiles')
                .insert({
                  user_id: user.id,
                  email: user.email,
                  full_name: user.user_metadata?.full_name ?? user.email,
                  status: 'invited',
                })
                .select('id')
                .single()
              profileId = newProfile?.id
            }

            if (profileId) {
              // Apply the invited role
              await adminClient
                .from('profile_roles')
                .upsert({
                  profile_id: profileId,
                  role: invite.role,
                  program_id: invite.program_id ?? null,
                }, { onConflict: 'profile_id,role,program_id' })

              // Mark invite as accepted
              await adminClient
                .from('invites')
                .update({ status: 'accepted' })
                .eq('id', invite.id)
            }
          }
        }
      } catch {
        // Don't block sign-in if invite lookup fails
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth failed — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
