export type SheetType = 'participants' | 'teams' | 'mentors' | 'universities'

export interface ColumnMapping {
  sheetColumn: string   // expected header in the spreadsheet
  dbField: string       // field name in our DB
  required: boolean
  transform?: (val: string) => unknown
}

export const SHEET_MAPPINGS: Record<SheetType, ColumnMapping[]> = {
  participants: [
    { sheetColumn: 'Full Name',       dbField: 'full_name',           required: true  },
    { sheetColumn: 'Email',           dbField: 'email',               required: true  },
    { sheetColumn: 'Nationality',     dbField: 'nationality',          required: true  },
    { sheetColumn: 'Country',         dbField: 'country_of_residence', required: false },
    { sheetColumn: 'University',      dbField: 'organization_name',    required: false },
    { sheetColumn: 'Role',            dbField: 'role',                 required: true  },
    { sheetColumn: 'Team',            dbField: 'team_name',            required: false },
    { sheetColumn: 'Dietary',         dbField: 'dietary_restrictions', required: false },
    {
      sheetColumn: 'Visa Required',   dbField: 'needs_visa',           required: false,
      transform: (v) => ['yes', 'y', 'true', '1'].includes(v.toLowerCase()),
    },
    { sheetColumn: 'Passport Number', dbField: 'passport_number',      required: false },
    { sheetColumn: 'Passport Expiry', dbField: 'passport_expiry',      required: false },
    { sheetColumn: 'Date of Birth',   dbField: 'date_of_birth',        required: false },
    { sheetColumn: 'LinkedIn',        dbField: 'linkedin_url',         required: false },
    { sheetColumn: 'Bio',             dbField: 'bio',                  required: false },
    { sheetColumn: 'Job Title',       dbField: 'job_title',            required: false },
  ],
  teams: [
    { sheetColumn: 'Team Name',       dbField: 'name',                 required: true  },
    { sheetColumn: 'University',      dbField: 'university_name',      required: true  },
    { sheetColumn: 'Pitch Summary',   dbField: 'pitch_summary',        required: false },
    { sheetColumn: 'Stage',           dbField: 'stage',                required: false },
    {
      sheetColumn: 'Qualifying Path', dbField: 'qualifying_path',      required: true,
      transform: (v) => v.toLowerCase().includes('regional') ? 'regional' : 'direct',
    },
    { sheetColumn: 'Region',          dbField: 'region_label',         required: false },
    { sheetColumn: 'Track',           dbField: 'track',                required: false },
    {
      sheetColumn: 'Needs Expertise', dbField: 'needs_expertise',      required: false,
      transform: (v) => v.split(',').map((s) => s.trim()).filter(Boolean),
    },
  ],
  mentors: [
    { sheetColumn: 'Full Name',         dbField: 'full_name',          required: true  },
    { sheetColumn: 'Email',             dbField: 'email',              required: true  },
    { sheetColumn: 'Organization',      dbField: 'organization_name',  required: false },
    { sheetColumn: 'Title',             dbField: 'job_title',          required: false },
    { sheetColumn: 'LinkedIn',          dbField: 'linkedin_url',       required: false },
    {
      sheetColumn: 'Expertise',         dbField: 'expertise_tags',     required: false,
      transform: (v) => v.split(',').map((s) => s.trim()).filter(Boolean),
    },
    { sheetColumn: 'Geographic Focus',  dbField: 'geographic_focus',   required: false },
    { sheetColumn: 'Years Experience',  dbField: 'years_experience',   required: false },
    { sheetColumn: 'Bio',               dbField: 'bio',                required: false },
    {
      sheetColumn: 'Visa Required',     dbField: 'needs_visa',         required: false,
      transform: (v) => ['yes', 'y', 'true', '1'].includes(v.toLowerCase()),
    },
  ],
  universities: [
    { sheetColumn: 'University Name',    dbField: 'name',              required: true  },
    { sheetColumn: 'Country',            dbField: 'country',           required: true  },
    { sheetColumn: 'POC Name',           dbField: 'poc_name',          required: false },
    { sheetColumn: 'POC Email',          dbField: 'poc_email',         required: false },
    {
      sheetColumn: 'Years Participated', dbField: 'cohort_history',    required: false,
      transform: (v) => v.split(',').map((s) => parseInt(s.trim())).filter((n) => !isNaN(n)),
    },
  ],
}

// DB field labels for the column mapping dropdowns
export const DB_FIELD_LABELS: Record<string, string> = {
  full_name:           'Full Name',
  email:               'Email',
  nationality:         'Nationality',
  country_of_residence:'Country of Residence',
  organization_name:   'Organization',
  role:                'Role',
  team_name:           'Team Name (link)',
  dietary_restrictions:'Dietary Restrictions',
  needs_visa:          'Needs Visa',
  passport_number:     'Passport Number',
  passport_expiry:     'Passport Expiry',
  date_of_birth:       'Date of Birth',
  linkedin_url:        'LinkedIn URL',
  bio:                 'Bio',
  job_title:           'Job Title',
  geographic_focus:    'Geographic Focus',
  years_experience:    'Years Experience',
  expertise_tags:      'Expertise Tags',
  // teams
  name:                'Team Name',
  university_name:     'University Name (link)',
  pitch_summary:       'Pitch Summary',
  stage:               'Stage',
  qualifying_path:     'Qualifying Path',
  region_label:        'Region',
  track:               'Track',
  needs_expertise:     'Needs Expertise',
  // universities
  country:             'Country',
  poc_name:            'POC Name',
  poc_email:           'POC Email',
  cohort_history:      'Cohort History',
}

// Auto-detect sheet type from header row
export function detectSheetType(headers: string[]): SheetType | null {
  const h = headers.map((hdr) => hdr.toLowerCase())
  if (h.some((x) => x.includes('team name')) || h.some((x) => x.includes('qualifying path'))) return 'teams'
  if (h.some((x) => x.includes('expertise')) && h.some((x) => x.includes('organization'))) return 'mentors'
  if (h.some((x) => x.includes('university name')) || h.some((x) => x.includes('poc'))) return 'universities'
  if (h.some((x) => x.includes('email')) && h.some((x) => x.includes('role'))) return 'participants'
  return null
}
