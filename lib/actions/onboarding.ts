'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function submitOnboarding(formData: {
  token: string
  fullName: string
  nationality: string
  countryOfResidence: string
  bio?: string
  linkedinUrl?: string
  organizationName?: string
  jobTitle?: string
  needsVisa: boolean
  passportNumber?: string
  passportExpiry?: string
  passportIssuingCountry?: string
  legalName?: string
  dateOfBirth?: string
  dietaryRestrictions?: string
  tshirtSize?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  flightDetails?: string
  arrivalDate?: string
  departurCity?: string
  flightBooked?: boolean
  accessibilityNeeds?: string
  // Mentor-specific
  industryVertical?: string
  geographicFocus?: string
  yearsExperience?: string
  availabilityDays?: string[]
  mentoringFormats?: string[]
  avoidTopics?: string
  expertiseTags?: { tagId: string; level: string }[]
  // Judge-specific
  conflictTeamIds?: string[]
  conflictUniversityIds?: string[]
  conflictReasons?: Record<string, string>
}) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Get current authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Validate invite token
  const { data: invites } = await adminClient
    .rpc('get_invite_by_token', { invite_token: formData.token })

  if (!invites || invites.length === 0) {
    throw new Error('Invalid or expired invite token')
  }

  const invite = invites[0]

  // Upsert profile
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .upsert({
      user_id: user.id,
      email: invite.email,
      full_name: formData.fullName,
      nationality: formData.nationality,
      country_of_residence: formData.countryOfResidence,
      bio: formData.bio,
      linkedin_url: formData.linkedinUrl,
      organization_name: formData.organizationName,
      job_title: formData.jobTitle,
      needs_visa: formData.needsVisa,
      passport_number: formData.passportNumber,
      passport_expiry: formData.passportExpiry,
      passport_issuing_country: formData.passportIssuingCountry,
      legal_name: formData.legalName,
      date_of_birth: formData.dateOfBirth,
      dietary_restrictions: formData.dietaryRestrictions,
      tshirt_size: formData.tshirtSize,
      emergency_contact_name: formData.emergencyContactName,
      emergency_contact_phone: formData.emergencyContactPhone,
      flight_details: formData.flightDetails,
      arrival_date: formData.arrivalDate,
      departure_city: formData.departurCity,
      flight_booked: formData.flightBooked,
      accessibility_needs: formData.accessibilityNeeds,
      industry_vertical: formData.industryVertical,
      geographic_focus: formData.geographicFocus,
      years_experience: formData.yearsExperience,
      availability_days: formData.availabilityDays,
      mentoring_formats: formData.mentoringFormats,
      avoid_topics: formData.avoidTopics,
      status: 'confirmed',
    }, { onConflict: 'user_id' })
    .select()
    .single()

  if (profileError || !profile) {
    throw new Error('Failed to create profile: ' + profileError?.message)
  }

  // Assign role
  await adminClient.from('profile_roles').upsert({
    profile_id: profile.id,
    role: invite.role,
    program_id: invite.program_id,
  }, { onConflict: 'profile_id,role,program_id' })

  // Cohort history entry
  await adminClient.from('cohort_history').upsert({
    profile_id: profile.id,
    program_id: invite.program_id,
    year: new Date().getFullYear(),
    role: invite.role,
    team_id: invite.team_id ?? null,
  }, { onConflict: 'profile_id,program_id' })

  // If STUDENT — link to team
  if (invite.role === 'STUDENT' && invite.team_id) {
    await adminClient.from('team_members').upsert({
      profile_id: profile.id,
      team_id: invite.team_id,
    }, { onConflict: 'profile_id,team_id' })
  }

  // If MENTOR — save expertise tags
  if (invite.role === 'MENTOR' && formData.expertiseTags?.length) {
    await adminClient.from('profile_expertise').upsert(
      formData.expertiseTags.map(tag => ({
        profile_id: profile.id,
        tag_id: tag.tagId,
        level: tag.level,
      })),
      { onConflict: 'profile_id,tag_id' }
    )
  }

  // If JUDGE — save conflict declarations
  if (invite.role === 'JUDGE') {
    const conflicts = [
      ...(formData.conflictTeamIds ?? []).map(teamId => ({
        profile_id: profile.id,
        team_id: teamId,
        university_id: null,
        reason: formData.conflictReasons?.[teamId] ?? null,
      })),
      ...(formData.conflictUniversityIds ?? []).map(universityId => ({
        profile_id: profile.id,
        team_id: null,
        university_id: universityId,
        reason: formData.conflictReasons?.[universityId] ?? null,
      })),
    ]
    if (conflicts.length > 0) {
      await adminClient.from('judge_conflicts').insert(conflicts)
    }
  }

  // Mark invite as accepted
  await adminClient
    .from('invites')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('token', formData.token)

  revalidatePath('/participants')
  revalidatePath('/dashboard')

  return { success: true, profileId: profile.id }
}