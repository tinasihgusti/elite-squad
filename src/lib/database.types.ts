/**
 * Tipe database Supabase (ditulis manual agar repo tidak bergantung pada CLI codegen).
 * Kalau skema berubah, regenerate dengan:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
 */

export type AttendanceStatus = "hadir" | "izin" | "sakit" | "alpa";
export type UserRole = "member" | "mentor" | "admin";


export type XpSource =
  | "daily_amal"
  | "daily_bonus"
  | "module_session"
  | "drama_report"
  | "weekly_tracker"
  | "admin_adjustment";

export type LevelRow = {
  level: number;
  name: string;
  min_xp: number;
  description: string;
};

export type AmalItemRow = {
  key: string;
  label: string;
  description: string | null;
  xp_reward: number;
  sort_order: number;
  is_active: boolean;
};

export type ModuleSessionRow = {
  session_number: number;
  phase: string;
  theme: string;
  title: string;
  focus: string;
  juklak_indicator: string;
  delivery: string;
  xp_reward: number;
};

export type XpEventRow = {
  id: string;
  user_id: string;
  source: XpSource;
  ref_key: string;
  points: number;
  note: string | null;
  occurred_on: string;
  created_by: string | null;
  created_at: string;
};

export type DailyAmalLogRow = {
  user_id: string;
  log_date: string;
  habit_key: string;
  created_at: string;
};

export type ModuleCompletionRow = {
  id: string;
  user_id: string;
  session_number: number;
  reflection: string | null;
  completed_on: string;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
};

export type DramaReportRow = {
  id: string;
  user_id: string;
  category: string;
  title: string;
  story: string;
  is_urgent: boolean;
  reported_on: string;
  mentor_reply: string | null;
  replied_by: string | null;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Baris hasil fungsi `public.leaderboard()`. */
export type LeaderboardRow = {
  user_id: string;
  full_name: string;
  squad: string | null;
  faculty: string | null;
  scoped_xp: number;
  total_xp: number;
  level: number;
  level_name: string;
  rank_position: number;
};

/** Baris hasil fungsi `public.mission_progress()`. */
export type MissionProgressRow = {
  total_xp: number;
  today_xp: number;
  level: number;
  level_name: string;
  next_level_min_xp: number | null;
  sessions_total: number;
  sessions_done: number;
  sessions_verified: number;
  attendance_percent: number | null;
  amal_today_done: number;
  amal_today_total: number;
  amal_streak_days: number;
  graduated: boolean;
};

/** Baris hasil fungsi `public.admin_participants()`. */
export type AdminParticipantRow = {
  user_id: string;
  full_name: string;
  squad: string | null;
  faculty: string | null;
  phone: string | null;
  role: UserRole;
  total_xp: number;
  today_xp: number;
  level: number;
  level_name: string;
  sessions_done: number;
  sessions_verified: number;
  amal_logged_days: number;
  drama_count: number;
  last_active_on: string | null;
  joined_at: string;
};

/** Baris hasil fungsi `public.setup_status()`. */
export type SetupStatusRow = {
  item: string;
  ready: boolean;
  detail: string;
};

export type LeaderboardScope = "daily" | "weekly" | "monthly" | "all";

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
      levels: {
        Row: LevelRow;
        Insert: LevelRow;
        Update: Partial<LevelRow>;
        Relationships: [];
      };
      amal_items: {
        Row: AmalItemRow;
        Insert: AmalItemRow;
        Update: Partial<AmalItemRow>;
        Relationships: [];
      };
      module_sessions: {
        Row: ModuleSessionRow;
        Insert: ModuleSessionRow;
        Update: Partial<ModuleSessionRow>;
        Relationships: [];
      };
      xp_events: {
        Row: XpEventRow;
        Insert: {
          id?: string;
          user_id: string;
          source: XpSource;
          ref_key: string;
          points: number;
          note?: string | null;
          occurred_on?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<XpEventRow>;
        Relationships: [];
      };
      daily_amal_logs: {
        Row: DailyAmalLogRow;
        Insert: { user_id: string; habit_key: string; log_date?: string; created_at?: string };
        Update: Partial<DailyAmalLogRow>;
        Relationships: [];
      };
      module_completions: {
        Row: ModuleCompletionRow;
        Insert: {
          id?: string;
          user_id: string;
          session_number: number;
          reflection?: string | null;
          completed_on?: string;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
        };
        Update: Partial<ModuleCompletionRow>;
        Relationships: [];
      };
      drama_reports: {
        Row: DramaReportRow;
        Insert: {
          id?: string;
          user_id: string;
          category: string;
          title: string;
          story: string;
          is_urgent?: boolean;
          reported_on?: string;
          mentor_reply?: string | null;
          replied_by?: string | null;
          replied_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<DramaReportRow>;
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
    Functions: {
      leaderboard: {
        Args: { p_scope?: LeaderboardScope; p_limit?: number };
        Returns: LeaderboardRow[];
      };
      mission_progress: {
        Args: { p_user?: string };
        Returns: MissionProgressRow[];
      };
      admin_participants: {
        Args: Record<string, never>;
        Returns: AdminParticipantRow[];
      };
      ensure_profile: {
        Args: Record<string, never>;
        Returns: ProfileRow;
      };
      setup_status: {
        Args: Record<string, never>;
        Returns: SetupStatusRow[];
      };
      today_wib: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      attendance_status: AttendanceStatus;
      user_role: UserRole;
      xp_source: XpSource;
    };
    CompositeTypes: { [_ in never]: never };
  };
}
