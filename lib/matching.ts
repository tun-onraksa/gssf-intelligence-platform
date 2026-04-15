// ── Mentor-team matching algorithm ───────────────────────────────────────────
// Computes expertise-overlap scores between unmatched teams and available mentors.
// Entirely pure — no side effects, no DB calls.

export interface MatchableTeam {
  id: string
  name: string
  track: string | null
  assigned_mentor_id: string | null
  team_expertise_needs: {
    expertise_tags: { id: string; name: string; domain: string } | null
  }[]
  universities: { id: string; name: string; country: string } | null
}

export interface MatchableMentor {
  id: string
  full_name: string | null
  organization_name: string | null
  geographic_focus: string | null
  years_experience: string | null
  industry_vertical: string | null
  profile_expertise: {
    level: string
    expertise_tags: { id: string; name: string; domain: string } | null
  }[]
}

export interface ExpertiseTagBasic {
  id: string
  name: string
  domain: string
}

export interface MentorMatchResult {
  teamId: string
  mentorId: string
  score: number
  matchedTags: string[]
  matchedDomains: string[]
}

const LEVEL_WEIGHT: Record<string, number> = {
  'Deep Expert': 3,
  'Expert':      2,
  'Practitioner': 1,
}

export function computeMentorMatches(
  teams: MatchableTeam[],
  mentors: MatchableMentor[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _expertiseTags: ExpertiseTagBasic[],  // reserved for future domain weighting
): MentorMatchResult[] {
  const results: MentorMatchResult[] = []

  for (const team of teams.filter((t) => !t.assigned_mentor_id)) {
    const teamTagIds = team.team_expertise_needs
      .map((n) => n.expertise_tags?.id)
      .filter((id): id is string => id != null)

    if (teamTagIds.length === 0) continue

    for (const mentor of mentors) {
      let score = 0
      const matchedTags: string[] = []
      const matchedDomains = new Set<string>()

      for (const exp of mentor.profile_expertise) {
        if (!exp.expertise_tags) continue
        if (teamTagIds.includes(exp.expertise_tags.id)) {
          const weight = LEVEL_WEIGHT[exp.level] ?? 1
          score += weight
          matchedTags.push(exp.expertise_tags.name)
          matchedDomains.add(exp.expertise_tags.domain)
        }
      }

      if (score > 0) {
        results.push({
          teamId:       team.id,
          mentorId:     mentor.id,
          score,
          matchedTags,
          matchedDomains: Array.from(matchedDomains),
        })
      }
    }
  }

  // Sort descending by score, then alphabetically by teamId for stability
  return results.sort((a, b) =>
    b.score !== a.score ? b.score - a.score : a.teamId.localeCompare(b.teamId)
  )
}

/** Returns the top N mentor candidates for a given team. */
export function topMatchesForTeam(
  teamId: string,
  allMatches: MentorMatchResult[],
  limit = 5,
): MentorMatchResult[] {
  return allMatches
    .filter((m) => m.teamId === teamId)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
