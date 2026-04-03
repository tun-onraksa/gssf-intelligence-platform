import type { Team, Person, MentorMatch } from './types'

// Geography region mapping for loose matching
const regionMap: Record<string, string[]> = {
  'North America': ['United States', 'Canada', 'Mexico'],
  'South America': ['Brazil', 'Argentina', 'Colombia', 'Chile'],
  'Southeast Asia': ['Singapore', 'Thailand', 'Vietnam', 'Indonesia', 'Malaysia', 'Philippines'],
  'East Asia': ['China', 'Japan', 'South Korea', 'Hong Kong', 'Taiwan'],
  'South Asia': ['India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal'],
  'Europe': ['United Kingdom', 'Germany', 'France', 'Switzerland', 'Finland', 'Sweden', 'Netherlands', 'Austria', 'Spain', 'Italy'],
  'Middle East': ['Israel', 'UAE', 'Saudi Arabia', 'Turkey'],
  'Africa': ['Ghana', 'Nigeria', 'Kenya', 'South Africa', 'Egypt'],
}

// University country → broad region
function getRegionForCountry(country: string): string {
  for (const [region, countries] of Object.entries(regionMap)) {
    if (countries.includes(country)) return region
  }
  return 'Other'
}

// Fundraising-adjacent tag IDs
const fundraisingTagIds = new Set(['tag_09', 'tag_15', 'tag_05'])

export function computeMentorMatches(
  teams: Team[],
  mentors: Person[]
): MentorMatch[] {
  const results: MentorMatch[] = []

  for (const team of teams) {
    const teamNeedSet = new Set(team.needsExpertiseTagIds)
    const pairScores: Array<{ mentorId: string; score: number; tagOverlapScore: number; geographyScore: number; stageScore: number; matchedTagIds: string[] }> = []

    for (const mentor of mentors) {
      if (!mentor.roles.includes('MENTOR')) continue

      // 1. Tag overlap score
      const mentorTagIds = mentor.expertise.map((e) => e.tagId)
      const matched = mentorTagIds.filter((tid) => teamNeedSet.has(tid))
      const tagOverlapScore = team.needsExpertiseTagIds.length > 0
        ? (matched.length / team.needsExpertiseTagIds.length) * 60
        : 0

      // 2. Geography score
      // We need the team's university country. We pass teams and we know universityId.
      // We look up from a static map for now (we don't have universities array here).
      // Instead, encode region lookup by university country embedded in team metadata is not available.
      // We use a simple heuristic: match mentor.geographicFocus against the team's program region label
      // or universityId suffix.
      // Since we don't have the universities array, we accept it as optional param behavior.
      // Geography score: 10 if mentor.geographicFocus region loosely matches team university country
      // For the pure function, we'll check based on a static university→country map derived from seed
      const uniCountryMap: Record<string, string> = {
        uni_usc: 'United States',
        uni_berkeley: 'United States',
        uni_iitdelhi: 'India',
        uni_kaist: 'South Korea',
        uni_aalto: 'Finland',
        uni_oxford: 'United Kingdom',
        uni_nus: 'Singapore',
        uni_eth: 'Switzerland',
        uni_tau: 'Israel',
        uni_toronto: 'Canada',
        uni_hkust: 'Hong Kong',
        uni_tsinghua: 'China',
        uni_columbia: 'United States',
        uni_utaustin: 'United States',
      }
      const teamCountry = uniCountryMap[team.universityId] ?? 'Other'
      const teamRegion = getRegionForCountry(teamCountry)
      const geographyScore = mentor.geographicFocus === teamRegion ? 10 : 0

      // 3. Stage score
      let stageScore = 5
      if (team.stage === 'Pre-seed') {
        const hasFundraisingFocus = mentor.expertise.some((e) => fundraisingTagIds.has(e.tagId))
        if (hasFundraisingFocus) stageScore = 10
      }

      // 4. Total (cap at 100)
      const total = Math.min(100, Math.round(tagOverlapScore + geographyScore + stageScore))

      pairScores.push({
        mentorId: mentor.personId,
        score: total,
        tagOverlapScore: Math.round(tagOverlapScore),
        geographyScore,
        stageScore,
        matchedTagIds: matched,
      })
    }

    // Sort desc, take top 3
    pairScores.sort((a, b) => b.score - a.score)
    const top3 = pairScores.slice(0, 3)

    top3.forEach((p, i) => {
      results.push({
        mentorId: p.mentorId,
        teamId: team.teamId,
        score: p.score,
        tagOverlapScore: p.tagOverlapScore,
        geographyScore: p.geographyScore,
        stageScore: p.stageScore,
        matchedTagIds: p.matchedTagIds,
        rank: i + 1,
      })
    })
  }

  return results
}
