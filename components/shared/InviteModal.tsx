'use client'

import { useState, useEffect } from 'react'
import { createInvite } from '@/lib/actions/invite'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Send } from 'lucide-react'

interface InviteModalProps {
  open: boolean
  onClose: () => void
  defaultRole?: string
}

export function InviteModal({ open, onClose, defaultRole }: InviteModalProps) {
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState(defaultRole ?? 'STUDENT')
  const [teamName, setTeamName] = useState('')
  const [track, setTrack] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loginUrl, setLoginUrl] = useState('')

  // Fetch teams once when modal opens
  useEffect(() => {
    if (!open) return
    const supabase = createClient()
    supabase
      .from('teams')
      .select('id, name')
      .order('name')
      .then(({ data }) => setTeams(data ?? []))
  }, [open])

  async function handleSubmit() {
    if (!email || !role) {
      setError('Email and role are required')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await createInvite({
        email,
        role,
        teamName: teamName || undefined,
        track: track || undefined,
      })
      setLoginUrl((res as { loginUrl?: string }).loginUrl ?? '')
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setEmail('')
    setRole(defaultRole ?? 'STUDENT')
    setTeamName('')
    setTrack('')
    setError(null)
    setSuccess(false)
    setLoginUrl('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Participant</DialogTitle>
        </DialogHeader>

        {!success ? (
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">
                Email address *
              </label>
              <Input
                type="email"
                placeholder="participant@university.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">
                Role *
              </label>
              <Select value={role} onValueChange={(v) => v && setRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="ORGANIZER">Organizer</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="MENTOR">Mentor</SelectItem>
                  <SelectItem value="JUDGE">Judge</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Team selector — only for STUDENT role */}
            {role === 'STUDENT' && (
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">
                  Assign to team
                </label>
                <Select value={teamName} onValueChange={(v) => v && setTeamName(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map(t => (
                      <SelectItem key={t.id} value={t.name}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Track selector — only for JUDGE role */}
            {role === 'JUDGE' && (
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">
                  Assign to track
                </label>
                <Select value={track} onValueChange={(v) => v && setTrack(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a track" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Track A</SelectItem>
                    <SelectItem value="B">Track B</SelectItem>
                    <SelectItem value="C">Track C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" />Send Invite</>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <Send className="w-5 h-5 text-green-600" />
            </div>
            <p className="font-medium text-slate-900">Invite created!</p>
            <p className="text-sm text-slate-500 mt-1">
              <span className="font-medium">{email}</span> has been pre-authorized as{' '}
              <span className="font-medium">{role}</span>.
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Share this link so they can sign in with their Google account:
            </p>
            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-600 break-all select-all">
              {loginUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/login`}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Their role will be applied automatically when they sign in.
            </p>
            <Button onClick={handleClose} className="mt-4 w-full" variant="outline">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
