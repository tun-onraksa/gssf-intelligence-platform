import { createClient } from '@/lib/supabase/server'
import { ScheduleClient } from './ScheduleClient'

export default async function SchedulePage() {
  const supabase = await createClient()

  const { data: slots } = await supabase
    .from('pitch_slots')
    .select(`
      id, track, day, start_time, end_time, room, team_id, schedule_published, program_id,
      teams:team_id (
        id, name, stage, qualifying_path, region_label,
        universities (name, country)
      ),
      pitch_slot_judges (
        profiles (id, full_name, organization_name)
      ),
      slot_conflicts (
        id, type, judge_id, description, resolved,
        profiles:judge_id (id, full_name)
      )
    `)
    .order('day')
    .order('start_time')

  // Fetch judge profile IDs first, then fetch profiles
  const { data: judgeRoles } = await supabase
    .from('profile_roles')
    .select('profile_id')
    .eq('role', 'JUDGE')

  const judgeIds = (judgeRoles ?? []).map((r) => r.profile_id).filter(Boolean) as string[]

  const { data: judges } = judgeIds.length
    ? await supabase
        .from('profiles')
        .select('id, full_name, organization_name')
        .in('id', judgeIds)
    : { data: [] }

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, track, universities(name)')
    .order('name')

  const schedulePublished = slots?.some((s) => s.schedule_published) ?? false
  const totalConflicts =
    slots?.reduce(
      (acc, s) => acc + (s.slot_conflicts?.filter((c) => !c.resolved).length ?? 0),
      0
    ) ?? 0

  const programId = slots?.find((s) => s.program_id)?.program_id ?? ''

  return (
    <ScheduleClient
      slots={slots ?? []}
      judges={judges ?? []}
      teams={teams ?? []}
      schedulePublished={schedulePublished}
      totalConflicts={totalConflicts}
      programId={programId}
    />
  )
}
