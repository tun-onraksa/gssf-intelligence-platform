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

  async function loadProfile() {
    try {
      const res = await fetch('/api/auth/profile')
      const data = await res.json()
      if (data) {
        setProfileId(data.profileId)
        setRoles(data.roles)
      } else {
        setProfileId(null)
        setRoles([])
      }
    } catch (err) {
      console.error('[AuthContext] loadProfile failed:', err)
      setProfileId(null)
      setRoles([])
    }
  }

  useEffect(() => { // eslint-disable-line react-hooks/exhaustive-deps
    // Get initial session
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user)
      if (user) await loadProfile()
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await loadProfile()
        } else {
          setProfileId(null)
          setRoles([])
        }
      }
    )

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{ user, profileId, roles, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
