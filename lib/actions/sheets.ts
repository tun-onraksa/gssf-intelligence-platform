'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SHEET_MAPPINGS, detectSheetType } from '@/lib/sheets/mappings'
import { revalidatePath } from 'next/cache'
import type { SheetType } from '@/lib/sheets/mappings'

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractSheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : null
}

function extractGid(url: string): string | null {
  const match = url.match(/[#&?]gid=(\d+)/)
  return match ? match[1] : null
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  const { data: roles } = await adminClient
    .from('profile_roles')
    .select('role')
    .eq('profile_id', profile.id)

  const roleNames = roles?.map((r) => r.role) ?? []
  if (!roleNames.includes('ADMIN') && !roleNames.includes('ORGANIZER')) {
    throw new Error('Insufficient permissions — ADMIN or ORGANIZER role required')
  }

  return { profile, adminClient }
}

// ─── fetchSheetPreview ───────────────────────────────────────────────────────

export async function fetchSheetPreview(sheetUrl: string) {
  await requireAdmin()

  const sheetId = extractSheetId(sheetUrl)
  if (!sheetId) {
    throw new Error('Invalid Google Sheets URL. Copy the full URL from your browser address bar.')
  }

  const apiKey = process.env.GOOGLE_SHEETS_API_KEY
  if (!apiKey) throw new Error('GOOGLE_SHEETS_API_KEY is not configured on the server.')

  // Fetch spreadsheet metadata (tab names / GIDs)
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${apiKey}`,
    { cache: 'no-store' }
  )

  if (!metaRes.ok) {
    if (metaRes.status === 403) {
      throw new Error('Sheet is not publicly accessible. Set sharing to "Anyone with the link can view".')
    }
    if (metaRes.status === 404) {
      throw new Error('Sheet not found. Double-check the URL.')
    }
    const body = await metaRes.text().catch(() => metaRes.statusText)
    throw new Error(`Google Sheets API error: ${body}`)
  }

  const meta = await metaRes.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const availableTabs: { title: string; sheetId: number }[] = (meta.sheets as any[]).map((s) => ({
    title: s.properties.title,
    sheetId: s.properties.sheetId,
  }))

  const gid = extractGid(sheetUrl)
  const targetTab = gid
    ? availableTabs.find((t) => t.sheetId === parseInt(gid)) ?? availableTabs[0]
    : availableTabs[0]

  if (!targetTab) throw new Error('No tabs found in the spreadsheet.')

  // Fetch values for the target tab
  const dataRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(targetTab.title)}?key=${apiKey}`,
    { cache: 'no-store' }
  )

  if (!dataRes.ok) {
    const body = await dataRes.text().catch(() => dataRes.statusText)
    throw new Error(`Failed to fetch sheet data: ${body}`)
  }

  const data = await dataRes.json()
  const values: string[][] = data.values ?? []

  if (values.length < 2) {
    throw new Error('Sheet is empty or has only a header row — nothing to import.')
  }

  const headers = values[0].map((h) => h?.trim() ?? '')
  const allRows = values.slice(1).filter((row) => row.some((cell) => cell?.trim()))

  const detectedType = detectSheetType(headers)

  // Build auto-mapping: sheetColumn → dbField
  const autoMapping: Record<string, string> = {}
  if (detectedType) {
    const defs = SHEET_MAPPINGS[detectedType]
    headers.forEach((header) => {
      const match = defs.find((m) => m.sheetColumn.toLowerCase() === header.toLowerCase())
      if (match) autoMapping[header] = match.dbField
    })
  }

  // Preview: first 5 rows as objects
  const preview = allRows.slice(0, 5).map((row) => {
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = row[i] ?? '' })
    return obj
  })

  return {
    sheetId,
    tabName: targetTab.title,
    availableTabs,
    headers,
    totalRows: allRows.length,
    preview,
    detectedType,
    autoMapping,
    allRows,
  }
}

// ─── importSheetData ─────────────────────────────────────────────────────────

export async function importSheetData(params: {
  sheetType: SheetType
  columnMapping: Record<string, string>  // sheetColumn → dbField
  allRows: string[][]
  headers: string[]
  programId: string
}) {
  const { adminClient } = await requireAdmin()

  const { sheetType, columnMapping, allRows, headers, programId } = params
  const mappingDefs = SHEET_MAPPINGS[sheetType]

  let inserted = 0
  let skipped = 0
  const errors: { row: number; message: string }[] = []

  // ── Parse all rows ──────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type ParsedRow = Record<string, any> & { _rowIndex: number }

  const parsedRows: ParsedRow[] = []

  for (let i = 0; i < allRows.length; i++) {
    const row = allRows[i]
    const rowIndex = i + 2  // 1-indexed + header offset

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: Record<string, any> = {}
    headers.forEach((header, colIndex) => {
      const dbField = columnMapping[header]
      if (!dbField) return
      const rawVal = (row[colIndex] ?? '').trim()
      const def = mappingDefs.find((m) => m.dbField === dbField)
      obj[dbField] = def?.transform ? def.transform(rawVal) : (rawVal || null)
    })

    // Validate required fields
    const missing = mappingDefs
      .filter((m) => m.required && columnMapping[m.sheetColumn] && !obj[m.dbField])
      .map((m) => m.dbField)

    if (missing.length > 0) {
      errors.push({ row: rowIndex, message: `Missing required fields: ${missing.join(', ')}` })
      continue
    }

    obj._rowIndex = rowIndex
    parsedRows.push(obj as ParsedRow)
  }

  // ── participants & mentors ───────────────────────────────────────────────

  if (sheetType === 'participants' || sheetType === 'mentors') {
    for (const row of parsedRows) {
      try {
        if (!row.email) {
          errors.push({ row: row._rowIndex, message: 'Email is required' })
          continue
        }

        const profileFields = {
          full_name:            row.full_name             ?? null,
          nationality:          row.nationality            ?? null,
          country_of_residence: row.country_of_residence  ?? null,
          organization_name:    row.organization_name      ?? null,
          linkedin_url:         row.linkedin_url           ?? null,
          bio:                  row.bio                    ?? null,
          job_title:            row.job_title              ?? null,
          needs_visa:           row.needs_visa             ?? false,
          passport_number:      row.passport_number        ?? null,
          passport_expiry:      row.passport_expiry        ?? null,
          date_of_birth:        row.date_of_birth          ?? null,
          dietary_restrictions: row.dietary_restrictions   ?? null,
          geographic_focus:     row.geographic_focus       ?? null,
          years_experience:     row.years_experience       ?? null,
          status:               'invited' as const,
        }

        const { data: existing } = await adminClient
          .from('profiles')
          .select('id')
          .eq('email', row.email)
          .maybeSingle()

        let profileId: string

        if (existing) {
          await adminClient.from('profiles').update(profileFields).eq('id', existing.id)
          profileId = existing.id
          skipped++
        } else {
          const { data: newProfile, error: insertErr } = await adminClient
            .from('profiles')
            .insert({ email: row.email, ...profileFields })
            .select('id')
            .single()

          if (insertErr || !newProfile) {
            throw new Error(insertErr?.message ?? 'Insert failed')
          }
          profileId = newProfile.id
          inserted++
        }

        // Assign role
        if (row.role) {
          await adminClient.from('profile_roles').upsert(
            { profile_id: profileId, role: row.role.toUpperCase(), program_id: programId },
            { onConflict: 'profile_id,role,program_id' }
          )
        }

        // Link to team by name (participants only)
        if (row.team_name && sheetType === 'participants') {
          const { data: team } = await adminClient
            .from('teams')
            .select('id')
            .eq('name', row.team_name)
            .eq('program_id', programId)
            .maybeSingle()
          if (team) {
            await adminClient.from('team_members').upsert(
              { profile_id: profileId, team_id: team.id },
              { onConflict: 'profile_id,team_id' }
            )
          }
        }

        // Save expertise tags (mentors only)
        if (row.expertise_tags?.length && sheetType === 'mentors') {
          for (const tagName of row.expertise_tags as string[]) {
            const { data: tag } = await adminClient
              .from('expertise_tags')
              .select('id')
              .ilike('name', tagName)
              .maybeSingle()
            if (tag) {
              await adminClient.from('profile_expertise').upsert(
                { profile_id: profileId, tag_id: tag.id, level: 'Practitioner' },
                { onConflict: 'profile_id,tag_id' }
              )
            }
          }
        }
      } catch (err: unknown) {
        errors.push({ row: row._rowIndex, message: err instanceof Error ? err.message : String(err) })
        // Reverse the inserted/skipped count for this row since it errored after increment
      }
    }
  }

  // ── teams ────────────────────────────────────────────────────────────────

  if (sheetType === 'teams') {
    for (const row of parsedRows) {
      try {
        // Resolve or create university
        let universityId: string | null = null
        if (row.university_name) {
          const { data: uni } = await adminClient
            .from('universities')
            .select('id')
            .ilike('name', row.university_name)
            .maybeSingle()

          if (uni) {
            universityId = uni.id
          } else {
            const { data: newUni } = await adminClient
              .from('universities')
              .insert({ name: row.university_name, country: 'Unknown', active_status: true })
              .select('id')
              .single()
            universityId = newUni?.id ?? null
          }
        }

        const { data: existing } = await adminClient
          .from('teams')
          .select('id')
          .eq('name', row.name)
          .eq('program_id', programId)
          .maybeSingle()

        let teamId: string

        if (existing) {
          await adminClient.from('teams').update({
            university_id:   universityId,
            pitch_summary:   row.pitch_summary   ?? null,
            stage:           row.stage           ?? null,
            qualifying_path: row.qualifying_path ?? null,
            region_label:    row.region_label    ?? null,
            track:           row.track           ?? null,
          }).eq('id', existing.id)
          teamId = existing.id
          skipped++
        } else {
          const { data: newTeam, error: insertErr } = await adminClient
            .from('teams')
            .insert({
              name:            row.name,
              university_id:   universityId,
              program_id:      programId,
              pitch_summary:   row.pitch_summary   ?? null,
              stage:           row.stage           ?? null,
              qualifying_path: row.qualifying_path ?? 'direct',
              region_label:    row.region_label    ?? null,
              track:           row.track           ?? null,
            })
            .select('id')
            .single()

          if (insertErr || !newTeam) throw new Error(insertErr?.message ?? 'Insert failed')
          teamId = newTeam.id
          inserted++
        }

        // Link expertise needs
        if (row.needs_expertise?.length) {
          for (const tagName of row.needs_expertise as string[]) {
            const { data: tag } = await adminClient
              .from('expertise_tags')
              .select('id')
              .ilike('name', tagName)
              .maybeSingle()
            if (tag) {
              // Use insert + ignore duplicate rather than upsert (no guaranteed unique constraint)
              await adminClient
                .from('team_expertise_needs')
                .insert({ team_id: teamId, tag_id: tag.id, priority: 1 })
                .throwOnError()
                .then(() => {}, () => {})  // swallow duplicate key errors
            }
          }
        }
      } catch (err: unknown) {
        errors.push({ row: row._rowIndex, message: err instanceof Error ? err.message : String(err) })
      }
    }
  }

  // ── universities ─────────────────────────────────────────────────────────

  if (sheetType === 'universities') {
    for (const row of parsedRows) {
      try {
        const { data: existing } = await adminClient
          .from('universities')
          .select('id')
          .ilike('name', row.name)
          .maybeSingle()

        if (existing) {
          await adminClient.from('universities').update({
            country:        row.country        ?? existing,
            cohort_history: row.cohort_history ?? [],
          }).eq('id', existing.id)
          skipped++
        } else {
          const { error: insertErr } = await adminClient.from('universities').insert({
            name:           row.name,
            country:        row.country ?? 'Unknown',
            active_status:  true,
            cohort_history: row.cohort_history ?? [],
          })
          if (insertErr) throw new Error(insertErr.message)
          inserted++
        }
      } catch (err: unknown) {
        errors.push({ row: row._rowIndex, message: err instanceof Error ? err.message : String(err) })
      }
    }
  }

  revalidatePath('/participants')
  revalidatePath('/teams')
  revalidatePath('/universities')

  return { inserted, skipped, errors, total: allRows.length }
}
