import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json(null)

    const admin = createAdminClient()

    // Try by user_id first
    let { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    // Fallback: match by email (handles Google OAuth vs magic link UUID mismatch)
    if (!profile && user.email) {
      const { data: byEmail } = await admin
        .from('profiles')
        .select('id')
        .eq('email', user.email)
        .maybeSingle()

      if (byEmail) {
        await admin
          .from('profiles')
          .update({ user_id: user.id })
          .eq('id', byEmail.id)
        profile = byEmail
      }
    }

    if (!profile) return NextResponse.json(null)

    const { data: roleRows } = await admin
      .from('profile_roles')
      .select('role')
      .eq('profile_id', profile.id)

    return NextResponse.json({
      profileId: profile.id,
      roles: roleRows?.map(r => r.role) ?? [],
    })
  } catch (err) {
    console.error('[/api/auth/profile]', err)
    return NextResponse.json(null)
  }
}
