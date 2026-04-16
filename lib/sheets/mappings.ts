export type SheetType = 'participants' | 'teams' | 'mentors' | 'universities' | 'sponsors' | 'passes' | 'master'

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
  master: [
    { sheetColumn: 'Full Name',                   dbField: 'full_name',            required: true  },
    { sheetColumn: 'Last Name',                   dbField: 'last_name',            required: false },
    { sheetColumn: 'Full/Nick Name',              dbField: 'nickname',             required: false },
    { sheetColumn: 'Prefix',                      dbField: 'prefix',               required: false },
    { sheetColumn: 'Category',                    dbField: 'category',             required: false },
    { sheetColumn: 'Title',                       dbField: 'title',                required: false },
    { sheetColumn: 'Organization',                dbField: 'organization',         required: false },
    { sheetColumn: 'Mentor',                      dbField: 'mentor_name',          required: false },
    { sheetColumn: 'Team',                        dbField: 'team_name',            required: false },
    { sheetColumn: 'Email',                       dbField: 'email',                required: true  },
    { sheetColumn: 'Number',                      dbField: 'phone',                required: false },
    { sheetColumn: 'LinkedIn',                    dbField: 'linkedin_url',         required: false },
    { sheetColumn: 'Special Dietary',             dbField: 'dietary_restrictions', required: false },
    { sheetColumn: 'Allergies',                   dbField: 'allergies',            required: false },
    { sheetColumn: 'Details',                     dbField: 'details',              required: false },
    { sheetColumn: 'Headshots',                   dbField: 'headshot_url',         required: false },
    { sheetColumn: 'Sex',                         dbField: 'sex',                  required: false },
    {
      sheetColumn: 'Need Visa',                   dbField: 'needs_visa',           required: false,
      transform: (v) => ['yes', 'y', 'true', '1'].includes(v.toLowerCase()),
    },
    // ── passport fields intentionally omitted ──
    // Travel & logistics
    { sheetColumn: 'Departure City',              dbField: 'departure_city',       required: false },
    { sheetColumn: 'Departure Date (To Korea)',   dbField: 'departure_date_to',    required: false },
    { sheetColumn: 'Departure Date (From Korea)', dbField: 'departure_date_from',  required: false },
    { sheetColumn: 'Destination City/Airport',    dbField: 'destination_city',     required: false },
    { sheetColumn: 'Other Requests',              dbField: 'other_requests',       required: false },
    { sheetColumn: 'Ticket Status',               dbField: 'ticket_status',        required: false },
    { sheetColumn: 'Itinerary',                   dbField: 'itinerary_url',        required: false },
    { sheetColumn: 'Itinerary (File2)',            dbField: 'itinerary_file2_url',  required: false },
  ],
  passes: [
    { sheetColumn: 'Full Name',       dbField: 'full_name',            required: true  },
    { sheetColumn: 'Category',        dbField: 'category',             required: true  },
    { sheetColumn: 'POC',             dbField: 'poc_name',             required: false },
    { sheetColumn: 'Title',           dbField: 'title',                required: false },
    { sheetColumn: 'Organization',    dbField: 'organization',         required: false },
    { sheetColumn: 'Status',          dbField: 'status',               required: false },
    { sheetColumn: 'Email',           dbField: 'email',                required: false },
    { sheetColumn: 'Number',          dbField: 'phone',                required: false },
    { sheetColumn: 'LinkedIn',        dbField: 'linkedin_url',         required: false },
    { sheetColumn: 'Special Dietary', dbField: 'dietary_restrictions', required: false },
    { sheetColumn: 'Allergies',       dbField: 'allergies',            required: false },
    { sheetColumn: 'Details',         dbField: 'details',              required: false },
    { sheetColumn: 'Headshots',       dbField: 'headshot_url',         required: false },
  ],
  sponsors: [
    { sheetColumn: 'Sponsor Name',  dbField: 'name',            required: true  },
    { sheetColumn: 'Sponsorship',   dbField: 'sponsorship',     required: false },
    { sheetColumn: 'Status',        dbField: 'status',          required: false },
    { sheetColumn: 'Reach',         dbField: 'reach',           required: false },
    { sheetColumn: 'Notes',         dbField: 'notes',           required: false },
    { sheetColumn: 'Logo',          dbField: 'logo_url',        required: false },
    { sheetColumn: 'POC',           dbField: 'poc_name',        required: false },
    { sheetColumn: 'Title',         dbField: 'poc_title',       required: false },
    { sheetColumn: 'Email',         dbField: 'poc_email',       required: false },
    { sheetColumn: 'Contact Notes', dbField: 'poc_notes',       required: false },
    { sheetColumn: 'Number',        dbField: 'poc_phone',       required: false },
  ],
  universities: [
    { sheetColumn: 'University',         dbField: 'name',              required: true  },
    { sheetColumn: 'University Name',    dbField: 'name',              required: false },
    { sheetColumn: 'Country',            dbField: 'country',           required: true  },
    { sheetColumn: 'Status',             dbField: 'status',            required: false },
    {
      sheetColumn: 'Teams',              dbField: 'team_count',        required: false,
      transform: (v) => { const n = parseInt(v); return isNaN(n) ? null : n },
    },
    { sheetColumn: 'POC',                dbField: 'poc_name',          required: false },
    { sheetColumn: 'POC Name',           dbField: 'poc_name',          required: false },
    { sheetColumn: 'Title',              dbField: 'poc_title',         required: false },
    { sheetColumn: 'Email',              dbField: 'poc_email',         required: false },
    { sheetColumn: 'POC Email',          dbField: 'poc_email',         required: false },
    { sheetColumn: 'Number',             dbField: 'poc_phone',         required: false },
    { sheetColumn: 'Notes',              dbField: 'notes',             required: false },
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
  needs_visa:          'Needs Visa (yes/no)',
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
  // master
  last_name:           'Last Name',
  nickname:            'Full / Nick Name',
  prefix:              'Prefix',
  mentor_name:         'Mentor',
  sex:                 'Sex',
  departure_city:      'Departure City',
  departure_date_to:   'Departure Date (To Korea)',
  departure_date_from: 'Departure Date (From Korea)',
  destination_city:    'Destination City / Airport',
  other_requests:      'Other Requests',
  ticket_status:       'Ticket Status',
  itinerary_url:       'Itinerary',
  itinerary_file2_url: 'Itinerary File 2',
  // passes + sponsors + universities (shared)
  category:            'Pass Category',
  poc_name:            'POC Name',
  poc_title:           'POC Title',
  poc_email:           'POC Email',
  poc_phone:           'POC Phone / Number',
  poc_notes:           'Contact Notes',
  title:               'Title',
  organization:        'Organization',
  phone:               'Phone / Number',
  allergies:           'Allergies',
  details:             'Details',
  headshot_url:        'Headshot URL',
  sponsorship:         'Sponsorship Tier / Package',
  reach:               'Reach / Audience',
  notes:               'Notes',
  logo_url:            'Logo URL',
  // universities
  country:             'Country',
  status:              'Status',
  team_count:          'Team Count',
  cohort_history:      'Cohort History',
}

// Auto-detect sheet type from header row
export function detectSheetType(headers: string[]): SheetType | null {
  const h = headers.map((hdr) => hdr.toLowerCase())
  if (h.some((x) => x.includes('team name')) || h.some((x) => x.includes('qualifying path'))) return 'teams'
  if (h.some((x) => x.includes('expertise')) && h.some((x) => x.includes('organization'))) return 'mentors'
  if (h.some((x) => x.includes('departure')) || h.some((x) => x.includes('itinerary'))) return 'master'
  if (h.some((x) => x === 'category') && h.some((x) => x.includes('headshot'))) return 'passes'
  if (h.some((x) => x === 'sponsor') || h.some((x) => x.includes('sponsorship'))) return 'sponsors'
  if (h.some((x) => x.includes('university name')) || h.some((x) => x === 'university')) return 'universities'
  if (h.some((x) => x.includes('email')) && h.some((x) => x.includes('role'))) return 'participants'
  return null
}
