export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cohort_history: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string | null
          program_id: string | null
          role: Database["public"]["Enums"]["role_type"]
          team_id: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id?: string | null
          program_id?: string | null
          role: Database["public"]["Enums"]["role_type"]
          team_id?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string | null
          program_id?: string | null
          role?: Database["public"]["Enums"]["role_type"]
          team_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "cohort_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_history_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_history_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      expertise_tags: {
        Row: {
          domain: string
          id: string
          name: string
        }
        Insert: {
          domain: string
          id?: string
          name: string
        }
        Update: {
          domain?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      invites: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string | null
          program_id: string | null
          role: Database["public"]["Enums"]["role_type"]
          status: Database["public"]["Enums"]["invite_status"] | null
          team_id: string | null
          token: string | null
          track: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          program_id?: string | null
          role: Database["public"]["Enums"]["role_type"]
          status?: Database["public"]["Enums"]["invite_status"] | null
          team_id?: string | null
          token?: string | null
          track?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          program_id?: string | null
          role?: Database["public"]["Enums"]["role_type"]
          status?: Database["public"]["Enums"]["invite_status"] | null
          team_id?: string | null
          token?: string | null
          track?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      judge_conflicts: {
        Row: {
          declared_at: string | null
          id: string
          profile_id: string | null
          reason: string | null
          team_id: string | null
          university_id: string | null
        }
        Insert: {
          declared_at?: string | null
          id?: string
          profile_id?: string | null
          reason?: string | null
          team_id?: string | null
          university_id?: string | null
        }
        Update: {
          declared_at?: string | null
          id?: string
          profile_id?: string | null
          reason?: string | null
          team_id?: string | null
          university_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "judge_conflicts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judge_conflicts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judge_conflicts_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          type: Database["public"]["Enums"]["org_type"] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          type?: Database["public"]["Enums"]["org_type"] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["org_type"] | null
        }
        Relationships: []
      }
      pitch_slot_judges: {
        Row: {
          id: string
          profile_id: string | null
          slot_id: string | null
        }
        Insert: {
          id?: string
          profile_id?: string | null
          slot_id?: string | null
        }
        Update: {
          id?: string
          profile_id?: string | null
          slot_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pitch_slot_judges_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pitch_slot_judges_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "pitch_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      pitch_slots: {
        Row: {
          created_at: string | null
          day: number
          end_time: string
          id: string
          program_id: string | null
          room: string | null
          schedule_published: boolean | null
          start_time: string
          team_id: string | null
          track: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day: number
          end_time: string
          id?: string
          program_id?: string | null
          room?: string | null
          schedule_published?: boolean | null
          start_time: string
          team_id?: string | null
          track: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day?: number
          end_time?: string
          id?: string
          program_id?: string | null
          room?: string | null
          schedule_published?: boolean | null
          start_time?: string
          team_id?: string | null
          track?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pitch_slots_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pitch_slots_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_expertise: {
        Row: {
          id: string
          level: Database["public"]["Enums"]["expertise_level"]
          profile_id: string | null
          tag_id: string | null
        }
        Insert: {
          id?: string
          level: Database["public"]["Enums"]["expertise_level"]
          profile_id?: string | null
          tag_id?: string | null
        }
        Update: {
          id?: string
          level?: Database["public"]["Enums"]["expertise_level"]
          profile_id?: string | null
          tag_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_expertise_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_expertise_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "expertise_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_roles: {
        Row: {
          granted_at: string | null
          id: string
          profile_id: string | null
          program_id: string | null
          role: Database["public"]["Enums"]["role_type"]
        }
        Insert: {
          granted_at?: string | null
          id?: string
          profile_id?: string | null
          program_id?: string | null
          role: Database["public"]["Enums"]["role_type"]
        }
        Update: {
          granted_at?: string | null
          id?: string
          profile_id?: string | null
          program_id?: string | null
          role?: Database["public"]["Enums"]["role_type"]
        }
        Relationships: [
          {
            foreignKeyName: "profile_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_roles_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accessibility_needs: string | null
          arrival_date: string | null
          availability_days: string[] | null
          avoid_topics: string | null
          bio: string | null
          country_of_residence: string | null
          created_at: string | null
          date_of_birth: string | null
          departure_city: string | null
          dietary_restrictions: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          flight_booked: boolean | null
          flight_details: string | null
          full_name: string | null
          geographic_focus: string | null
          id: string
          industry_vertical: string | null
          is_duplicate: boolean | null
          job_title: string | null
          legal_name: string | null
          linkedin_url: string | null
          mentoring_formats: string[] | null
          nationality: string | null
          needs_visa: boolean | null
          organization_id: string | null
          organization_name: string | null
          passport_expiry: string | null
          passport_issuing_country: string | null
          passport_number: string | null
          status: Database["public"]["Enums"]["person_status"] | null
          tshirt_size: string | null
          updated_at: string | null
          user_id: string | null
          years_experience: string | null
        }
        Insert: {
          accessibility_needs?: string | null
          arrival_date?: string | null
          availability_days?: string[] | null
          avoid_topics?: string | null
          bio?: string | null
          country_of_residence?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          departure_city?: string | null
          dietary_restrictions?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          flight_booked?: boolean | null
          flight_details?: string | null
          full_name?: string | null
          geographic_focus?: string | null
          id?: string
          industry_vertical?: string | null
          is_duplicate?: boolean | null
          job_title?: string | null
          legal_name?: string | null
          linkedin_url?: string | null
          mentoring_formats?: string[] | null
          nationality?: string | null
          needs_visa?: boolean | null
          organization_id?: string | null
          organization_name?: string | null
          passport_expiry?: string | null
          passport_issuing_country?: string | null
          passport_number?: string | null
          status?: Database["public"]["Enums"]["person_status"] | null
          tshirt_size?: string | null
          updated_at?: string | null
          user_id?: string | null
          years_experience?: string | null
        }
        Update: {
          accessibility_needs?: string | null
          arrival_date?: string | null
          availability_days?: string[] | null
          avoid_topics?: string | null
          bio?: string | null
          country_of_residence?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          departure_city?: string | null
          dietary_restrictions?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          flight_booked?: boolean | null
          flight_details?: string | null
          full_name?: string | null
          geographic_focus?: string | null
          id?: string
          industry_vertical?: string | null
          is_duplicate?: boolean | null
          job_title?: string | null
          legal_name?: string | null
          linkedin_url?: string | null
          mentoring_formats?: string[] | null
          nationality?: string | null
          needs_visa?: boolean | null
          organization_id?: string | null
          organization_name?: string | null
          passport_expiry?: string | null
          passport_issuing_country?: string | null
          passport_number?: string | null
          status?: Database["public"]["Enums"]["person_status"] | null
          tshirt_size?: string | null
          updated_at?: string | null
          user_id?: string | null
          years_experience?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          advances_to_id: string | null
          created_at: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["program_status"]
          type: Database["public"]["Enums"]["program_type"]
          updated_at: string | null
          year: number
        }
        Insert: {
          advances_to_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["program_status"]
          type: Database["public"]["Enums"]["program_type"]
          updated_at?: string | null
          year: number
        }
        Update: {
          advances_to_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["program_status"]
          type?: Database["public"]["Enums"]["program_type"]
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "programs_advances_to_id_fkey"
            columns: ["advances_to_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      rubric_acknowledgments: {
        Row: {
          acknowledged_at: string | null
          id: string
          profile_id: string | null
          program_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          id?: string
          profile_id?: string | null
          program_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          id?: string
          profile_id?: string | null
          program_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rubric_acknowledgments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rubric_acknowledgments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      scores: {
        Row: {
          id: string
          innovation: number | null
          judge_id: string | null
          market: number | null
          program_id: string | null
          submitted_at: string | null
          team_id: string | null
          team_score: number | null
          total: number | null
          track: string | null
          traction: number | null
        }
        Insert: {
          id?: string
          innovation?: number | null
          judge_id?: string | null
          market?: number | null
          program_id?: string | null
          submitted_at?: string | null
          team_id?: string | null
          team_score?: number | null
          total?: number | null
          track?: string | null
          traction?: number | null
        }
        Update: {
          id?: string
          innovation?: number | null
          judge_id?: string | null
          market?: number | null
          program_id?: string | null
          submitted_at?: string | null
          team_id?: string | null
          team_score?: number | null
          total?: number | null
          track?: string | null
          traction?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scores_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_tracks: {
        Row: {
          closed: boolean | null
          closed_at: string | null
          id: string
          program_id: string | null
          track: string
        }
        Insert: {
          closed?: boolean | null
          closed_at?: string | null
          id?: string
          program_id?: string | null
          track: string
        }
        Update: {
          closed?: boolean | null
          closed_at?: string | null
          id?: string
          program_id?: string | null
          track?: string
        }
        Relationships: [
          {
            foreignKeyName: "scoring_tracks_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      slot_conflicts: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          judge_id: string | null
          resolved: boolean | null
          slot_id: string | null
          type: Database["public"]["Enums"]["conflict_type"]
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          judge_id?: string | null
          resolved?: boolean | null
          slot_id?: string | null
          type: Database["public"]["Enums"]["conflict_type"]
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          judge_id?: string | null
          resolved?: boolean | null
          slot_id?: string | null
          type?: Database["public"]["Enums"]["conflict_type"]
        }
        Relationships: [
          {
            foreignKeyName: "slot_conflicts_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slot_conflicts_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "pitch_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      team_expertise_needs: {
        Row: {
          id: string
          priority: number | null
          tag_id: string | null
          team_id: string | null
        }
        Insert: {
          id?: string
          priority?: number | null
          tag_id?: string | null
          team_id?: string | null
        }
        Update: {
          id?: string
          priority?: number | null
          tag_id?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_expertise_needs_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "expertise_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_expertise_needs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string | null
          profile_id: string | null
          team_id: string | null
        }
        Insert: {
          id?: string
          joined_at?: string | null
          profile_id?: string | null
          team_id?: string | null
        }
        Update: {
          id?: string
          joined_at?: string | null
          profile_id?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          assigned_mentor_id: string | null
          created_at: string | null
          id: string
          name: string
          pitch_summary: string | null
          program_id: string | null
          qualifying_path: Database["public"]["Enums"]["qualifying_path"] | null
          region_label: string | null
          stage: Database["public"]["Enums"]["team_stage"] | null
          track: string | null
          university_id: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_mentor_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          pitch_summary?: string | null
          program_id?: string | null
          qualifying_path?:
            | Database["public"]["Enums"]["qualifying_path"]
            | null
          region_label?: string | null
          stage?: Database["public"]["Enums"]["team_stage"] | null
          track?: string | null
          university_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_mentor_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          pitch_summary?: string | null
          program_id?: string | null
          qualifying_path?:
            | Database["public"]["Enums"]["qualifying_path"]
            | null
          region_label?: string | null
          stage?: Database["public"]["Enums"]["team_stage"] | null
          track?: string | null
          university_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_assigned_mentor_id_fkey"
            columns: ["assigned_mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          active_status: boolean | null
          cohort_history: number[] | null
          country: string
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          active_status?: boolean | null
          cohort_history?: number[] | null
          country: string
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          active_status?: boolean | null
          cohort_history?: number[] | null
          country?: string
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      university_pocs: {
        Row: {
          id: string
          profile_id: string | null
          since_year: number | null
          university_id: string | null
        }
        Insert: {
          id?: string
          profile_id?: string | null
          since_year?: number | null
          university_id?: string | null
        }
        Update: {
          id?: string
          profile_id?: string | null
          since_year?: number | null
          university_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "university_pocs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "university_pocs_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      visa_letters: {
        Row: {
          created_at: string | null
          generated_at: string | null
          id: string
          profile_id: string | null
          program_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["visa_letter_status"] | null
          storage_path: string | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          generated_at?: string | null
          id?: string
          profile_id?: string | null
          program_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["visa_letter_status"] | null
          storage_path?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          generated_at?: string | null
          id?: string
          profile_id?: string | null
          program_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["visa_letter_status"] | null
          storage_path?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "visa_letters_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visa_letters_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      conflict_type: "double_booked_judge" | "conflict_of_interest"
      event_type: "Workshop" | "Pitch Session" | "Demo Day" | "Ceremony"
      expertise_level: "Practitioner" | "Expert" | "Deep Expert"
      invite_status: "pending" | "accepted" | "expired"
      org_type: "Corporate" | "NonProfit" | "Accelerator" | "VC"
      person_status: "pending" | "invited" | "confirmed"
      program_status: "draft" | "active" | "completed"
      program_type: "Worlds" | "Regional" | "University"
      qualifying_path: "direct" | "regional"
      role_type:
        | "ADMIN"
        | "ORGANIZER"
        | "MENTOR"
        | "JUDGE"
        | "STUDENT"
        | "UNIVERSITY_POC"
      team_stage: "Pre-seed" | "Seed" | "Series A"
      visa_letter_status: "pending" | "generated" | "sent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      conflict_type: ["double_booked_judge", "conflict_of_interest"],
      event_type: ["Workshop", "Pitch Session", "Demo Day", "Ceremony"],
      expertise_level: ["Practitioner", "Expert", "Deep Expert"],
      invite_status: ["pending", "accepted", "expired"],
      org_type: ["Corporate", "NonProfit", "Accelerator", "VC"],
      person_status: ["pending", "invited", "confirmed"],
      program_status: ["draft", "active", "completed"],
      program_type: ["Worlds", "Regional", "University"],
      qualifying_path: ["direct", "regional"],
      role_type: [
        "ADMIN",
        "ORGANIZER",
        "MENTOR",
        "JUDGE",
        "STUDENT",
        "UNIVERSITY_POC",
      ],
      team_stage: ["Pre-seed", "Seed", "Series A"],
      visa_letter_status: ["pending", "generated", "sent"],
    },
  },
} as const
