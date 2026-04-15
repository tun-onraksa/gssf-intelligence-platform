export type Role = 'ADMIN' | 'ORGANIZER' | 'MENTOR' | 'JUDGE' | 'STUDENT' | 'UNIVERSITY_POC'

export type ProgramType = 'Worlds' | 'Regional' | 'University'
export type ProgramStatus = 'draft' | 'active' | 'completed'
export type PersonStatus = 'pending' | 'invited' | 'confirmed'
export type QualifyingPath = 'direct' | 'regional'
export type ExpertiseLevel = 'Practitioner' | 'Expert' | 'Deep Expert'
export type EventType = 'Workshop' | 'Pitch Session' | 'Demo Day' | 'Ceremony'
export type OrgType = 'Corporate' | 'NonProfit' | 'Accelerator' | 'VC'

export interface Program {
  programId: string
  name: string
  year: number
  type: ProgramType
  status: ProgramStatus
  advancesToId?: string
}

export interface University {
  universityId: string
  name: string
  country: string
  activeStatus: boolean
  cohortHistory: number[]
  pocIds: string[]
}

export interface ExpertiseTag {
  tagId: string
  name: string
  domain: string
}

export interface PersonExpertise {
  tagId: string
  level: ExpertiseLevel
}

export interface CohortEntry {
  programId: string
  year: number
  role: Role
  teamId?: string
}

export interface Person {
  personId: string
  name: string
  email: string
  nationality: string
  country: string
  roles: Role[]
  status: PersonStatus
  bio?: string
  linkedIn?: string
  organization?: string
  needsVisa: boolean
  passportNumber?: string
  dietaryRestrictions?: string
  flightDetails?: string
  expertise: PersonExpertise[]
  geographicFocus?: string
  industryVertical?: string
  yearsExperience?: number
  conflictWithTeamIds: string[]
  conflictWithUniversityIds: string[]
  rubricAck: boolean
  rubricAckAt?: string
  cohortHistory: CohortEntry[]
  isDuplicate?: boolean
  universityId?: string
  programIds: string[]
}

export interface Team {
  teamId: string
  teamName: string
  universityId: string
  programId: string
  pitchSummary: string
  stage: 'Pre-seed' | 'Seed' | 'Series A'
  qualifyingPath: QualifyingPath
  regionLabel?: string
  needsExpertiseTagIds: string[]
  memberIds: string[]
  trackAssignment?: string
}

export interface PitchSlot {
  slotId: string
  programId: string
  track: string
  day: number
  startTime: string
  endTime: string
  room: string
  teamId?: string
  judgeIds: string[]
  conflicts: SlotConflict[]
}

export interface SlotConflict {
  type: 'double_booked_judge' | 'conflict_of_interest'
  judgeId: string
  description: string
  conflictId?: string  // DB UUID — populated once reads migrate off seed data
}

export interface Score {
  scoreId: string
  judgeId: string
  teamId: string
  programId: string
  dimensions: {
    innovation: number
    market: number
    team: number
    traction: number
  }
  total: number
  submittedAt: string
  track: string
}

export interface VisaLetter {
  letterId: string
  personId: string
  version: number
  generatedAt: string
  sentAt?: string
  status: 'generated' | 'sent' | 'pending'
}

export interface AppStore {
  activeRole: Role
  activeProgramId: string
  persons: Person[]
  teams: Team[]
  universities: University[]
  programs: Program[]
  expertiseTags: ExpertiseTag[]
  pitchSlots: PitchSlot[]
  scores: Score[]
  visaLetters: VisaLetter[]
  schedulePublished: boolean
  scoringClosed: Record<string, boolean>
  setRole: (role: Role) => void
  setActiveProgram: (programId: string) => void
  confirmPerson: (person: Person) => void
  submitScore: (score: Score) => void
  closeScoring: (track: string) => void
  publishSchedule: () => void
  generateVisaLetters: () => void
  markVisaLetterSent: (letterId: string) => void
  resolveConflict: (slotId: string, conflictIndex: number) => void
}
