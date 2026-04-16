import { createAdminClient } from '@/lib/supabase/admin'
import OpenAI from 'openai'
import { NextRequest } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ── Tool definitions ──────────────────────────────────────────────────────────

const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_stats',
      description: 'Get high-level counts: total participants, teams, confirmed count, visa required, sponsors, passes.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_participants',
      description: 'Search participants/profiles. Filter by name, email, organization, role (STUDENT, MENTOR, JUDGE, ORGANIZER, ADMIN), status (pending, invited, confirmed), needs_visa.',
      parameters: {
        type: 'object',
        properties: {
          query:      { type: 'string',  description: 'Name, email, or org to search' },
          role:       { type: 'string',  description: 'Filter by role' },
          status:     { type: 'string',  description: 'Filter by status: pending, invited, confirmed' },
          needs_visa: { type: 'boolean', description: 'Filter to only visa-required participants' },
          limit:      { type: 'number',  description: 'Max results, default 20' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_universities',
      description: 'Search universities by name or country. Returns name, country, team count, POC info, status.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'University name or country to search' },
          limit: { type: 'number', description: 'Max results, default 20' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_sponsors',
      description: 'Search sponsors by name or tier. Returns name, sponsorship tier, status, POC info.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Sponsor name or tier to search' },
          limit: { type: 'number', description: 'Max results, default 20' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_passes',
      description: 'Search pass holders by name, category, or organization.',
      parameters: {
        type: 'object',
        properties: {
          query:    { type: 'string', description: 'Name or org to search' },
          category: { type: 'string', description: 'Filter by pass category' },
          limit:    { type: 'number', description: 'Max results, default 20' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_person_details',
      description: 'Get full details for a specific person across all sources: participant profile, university POC roles, sponsor POC roles, pass info.',
      parameters: {
        type: 'object',
        properties: {
          name:  { type: 'string', description: 'Person\'s full name' },
          email: { type: 'string', description: 'Person\'s email (more precise)' },
        },
        required: [],
      },
    },
  },
]

// ── Tool execution ────────────────────────────────────────────────────────────

async function runTool(name: string, args: Record<string, unknown>) {
  const db = createAdminClient()

  if (name === 'get_stats') {
    const [
      { count: participants },
      { count: confirmed },
      { count: visa },
      { count: passes },
      { count: sponsors },
    ] = await Promise.all([
      db.from('profiles').select('*', { count: 'exact', head: true }),
      db.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
      db.from('profiles').select('*', { count: 'exact', head: true }).eq('needs_visa', true),
      db.from('passes').select('*', { count: 'exact', head: true }),
      db.from('sponsors').select('*', { count: 'exact', head: true }),
    ])
    const { data: uniTeams } = await db.from('universities').select('team_count')
    const totalTeams = (uniTeams ?? []).reduce((s, u) => s + (u.team_count ?? 0), 0)
    return { participants, confirmed, visa_required: visa, passes, sponsors, total_teams: totalTeams }
  }

  if (name === 'search_participants') {
    const { query, role, status, needs_visa, limit = 20 } = args as Record<string, unknown>
    let q = db.from('profiles')
      .select('full_name, email, category, organization_name, status, needs_visa, profile_roles (role)')
      .limit(limit as number)
    if (query) q = q.or(`full_name.ilike.%${query}%,email.ilike.%${query}%,organization_name.ilike.%${query}%`)
    if (status) q = q.eq('status', status as string)
    if (needs_visa === true) q = q.eq('needs_visa', true)
    const { data } = await q
    // Role filter post-query (stored in profile_roles join)
    let results = data ?? []
    if (role) {
      results = results.filter((p) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p.profile_roles as any[]).some((r: { role: string }) =>
          r.role.toUpperCase().includes((role as string).toUpperCase())
        ) || (p.category ?? '').toUpperCase().includes((role as string).toUpperCase())
      )
    }
    return results
  }

  if (name === 'search_universities') {
    const { query, limit = 20 } = args as Record<string, unknown>
    let q = db.from('universities')
      .select('name, country, team_count, status, poc_name, poc_email, poc_title, poc_phone, notes')
      .limit(limit as number)
    if (query) q = q.or(`name.ilike.%${query}%,country.ilike.%${query}%`)
    const { data } = await q
    return data ?? []
  }

  if (name === 'search_sponsors') {
    const { query, limit = 20 } = args as Record<string, unknown>
    let q = db.from('sponsors')
      .select('name, sponsorship, status, reach, poc_name, poc_email, poc_title, notes')
      .limit(limit as number)
    if (query) q = q.or(`name.ilike.%${query}%,sponsorship.ilike.%${query}%`)
    const { data } = await q
    return data ?? []
  }

  if (name === 'search_passes') {
    const { query, category, limit = 20 } = args as Record<string, unknown>
    let q = db.from('passes')
      .select('full_name, email, category, organization, title, status, poc_name, dietary_restrictions')
      .limit(limit as number)
    if (query) q = q.or(`full_name.ilike.%${query}%,organization.ilike.%${query}%`)
    if (category) q = q.ilike('category', `%${category}%`)
    const { data } = await q
    return data ?? []
  }

  if (name === 'get_person_details') {
    const { name: personName, email } = args as Record<string, unknown>
    const results: Record<string, unknown> = {}

    // Profile
    let pq = db.from('profiles')
      .select('full_name, email, category, organization_name, status, needs_visa, profile_roles (role), cohort_history (year, role)')
    if (email) pq = pq.ilike('email', email as string)
    else if (personName) pq = pq.ilike('full_name', `%${personName}%`)
    const { data: profiles } = await pq.limit(3)
    if (profiles?.length) results.participant = profiles

    // University POC
    if (personName || email) {
      const filter = email ? `poc_email.ilike.${email}` : `poc_name.ilike.%${personName}%`
      const { data: unis } = await db.from('universities').select('name, country, poc_name, poc_email, poc_title, team_count').or(filter)
      if (unis?.length) results.university_poc = unis
    }

    // Sponsor POC
    if (personName || email) {
      const filter = email ? `poc_email.ilike.${email}` : `poc_name.ilike.%${personName}%`
      const { data: spons } = await db.from('sponsors').select('name, sponsorship, poc_name, poc_email, poc_title, status').or(filter)
      if (spons?.length) results.sponsor_contact = spons
    }

    // Pass
    let passq = db.from('passes').select('full_name, email, category, organization, title, status, dietary_restrictions, details')
    if (email) passq = passq.ilike('email', email as string)
    else if (personName) passq = passq.ilike('full_name', `%${personName}%`)
    const { data: passData } = await passq.limit(3)
    if (passData?.length) results.pass = passData

    return Object.keys(results).length ? results : { message: 'Person not found in any source.' }
  }

  return { error: `Unknown tool: ${name}` }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const systemPrompt = `You are a helpful assistant for the GSSF Worlds 2026 program management platform.
You ONLY answer questions based on data retrieved from the tools provided.
Never invent, guess, or assume any data. If the tools return no results, say so clearly.
When presenting lists, be concise. Format numbers and names clearly.
You have access to: participants, universities, sponsors, passes, and high-level stats.`

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const msgs: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...messages,
      ]

      // Agentic tool-calling loop (max 5 rounds)
      for (let round = 0; round < 5; round++) {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: msgs,
          tools,
          tool_choice: 'auto',
        })

        const choice = response.choices[0]
        msgs.push(choice.message)

        if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
          // Run all tool calls in parallel
          const toolResults = await Promise.all(
            choice.message.tool_calls.map(async (tc) => {
              const result = await runTool(tc.function.name, JSON.parse(tc.function.arguments))
              return {
                role: 'tool' as const,
                tool_call_id: tc.id,
                content: JSON.stringify(result),
              }
            })
          )
          msgs.push(...toolResults)
          continue
        }

        // Final answer — stream it
        const finalStream = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: msgs,
          stream: true,
        })

        for await (const chunk of finalStream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
        }
        break
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
