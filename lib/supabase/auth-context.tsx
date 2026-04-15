'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  profileId: string | null
  roles: string[]
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profileId: null,
  roles: [],
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { // eslint-disable-line react-hooks/exhaustive-deps
    // Get initial session
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user)
      if (user) await loadProfile(user.id)
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          setProfileId(null)
          setRoles([])
        }
      }
    )

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadProfile(userId: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (profile) {
      setProfileId(profile.id)

      const { data: roleRows } = await supabase
        .from('profile_roles')
        .select('role')
        .eq('profile_id', profile.id)

      setRoles(roleRows?.map(r => r.role) ?? [])
    }
  }

  return (
    <AuthContext.Provider value={{ user, profileId, roles, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)