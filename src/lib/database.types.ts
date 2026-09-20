/**
 * Tipe database Supabase (ditulis manual agar repo tidak bergantung pada CLI codegen).
 * Kalau skema berubah, regenerate dengan:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
 */

export type AttendanceStatus = "hadir" | "izin" | "sakit" | "alpa";
export type UserRole = "member" | "mentor" | "admin";

/**
 * Catatan: semua tipe di bawah ditulis sebagai `type`, bukan `interface`.
 * supabase-js mencocokkan skema dengan `Record<string, ...>`, dan hanya
 * type alias yang mendapat index signature implisit di TypeScript —
 * memakai `interface` membuat inferensi tabel jatuh ke `never`.
 */
export type ProfileRow = {
  id: string;
  full_name: string;
  squad: string | null;
  faculty: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type WeeklyTrackerRow = {
  id: string;
  user_id: string;
  week_number: number;
  week_start_date: string;
  attendance: AttendanceStatus;
  session_topic: string | null;

  // Mini self-check (skala 1-5)
  score_spiritual: number;
  score_academic: number;
  score_physical: number;
  score_social: number;
  score_mental: number;

  // Indikator harian (checklist)
  habit_worship: boolean;
  habit_reading: boolean;
  habit_exercise: boolean;
  habit_sleep: boolean;
  habit_journaling: boolean;

  // Maba Drama / problem-solving space
  drama_category: string | null;
  drama_story: string | null;
  drama_action_plan: string | null;
  needs_followup: boolean;

  // Feedback sesi mentoring
  mentor_rating: number | null;
  session_feedback: string | null;
  suggestion: string | null;

  created_at: string;
  updated_at: string;
}

export type ProfileInsert = {
  id: string;
  full_name: string;
  squad?: string | null;
  faculty?: string | null;
  phone?: string | null;
  role?: UserRole;
  created_at?: string;
  updated_at?: string;
}

export type WeeklyTrackerInsert = {
  id?: string;
  user_id: string;
  week_number: number;
  week_start_date: string;
  attendance: AttendanceStatus;
  session_topic?: string | null;

  score_spiritual: number;
  score_academic: number;
  score_physical: number;
  score_social: number;
  score_mental: number;

  habit_worship?: boolean;
  habit_reading?: boolean;
  habit_exercise?: boolean;
  habit_sleep?: boolean;
  habit_journaling?: boolean;

  drama_category?: string | null;
  drama_story?: string | null;
  drama_action_plan?: string | null;
  needs_followup?: boolean;

  mentor_rating?: number | null;
  session_feedback?: string | null;
  suggestion?: string | null;

  created_at?: string;
  updated_at?: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      weekly_trackers: {
        Row: WeeklyTrackerRow;
        Insert: WeeklyTrackerInsert;
        Update: Partial<WeeklyTrackerRow>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      attendance_status: AttendanceStatus;
      user_role: UserRole;
    };
    CompositeTypes: { [_ in never]: never };
  };
}
