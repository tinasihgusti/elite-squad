import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type {
  AmalItemRow,
  DramaReportRow,
  LeaderboardRow,
  LeaderboardScope,
  LevelRow,
  MissionProgressRow,
  ModuleCompletionRow,
  ModuleSessionRow,
  XpEventRow,
} from "@/lib/database.types";

/** Tanggal "hari ini" menurut server (WIB) — acuan reset amalan harian. */
export const getToday = cache(async (): Promise<string> => {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("today_wib");

  if (error || !data) {
    console.error("[getToday]", error?.message);
    // Fallback: hitung WIB dari jam server agar halaman tetap tampil.
    return new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
  }
  return data as unknown as string;
});

export const getAmalItems = cache(async (): Promise<AmalItemRow[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("amal_items")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    console.error("[getAmalItems]", error.message);
    return [];
  }
  return data ?? [];
});

/** Kunci amalan yang sudah dicentang hari ini. Hari baru otomatis kosong. */
export const getTodayAmalKeys = cache(async (): Promise<string[]> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const today = await getToday();
  const { data, error } = await supabase
    .from("daily_amal_logs")
    .select("habit_key")
    .eq("user_id", user.id)
    .eq("log_date", today);

  if (error) {
    console.error("[getTodayAmalKeys]", error.message);
    return [];
  }
  return (data ?? []).map((row) => row.habit_key);
});

export const getModuleSessions = cache(async (): Promise<ModuleSessionRow[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("module_sessions")
    .select("*")
    .order("session_number");

  if (error) {
    console.error("[getModuleSessions]", error.message);
    return [];
  }
  return data ?? [];
});

export const getMyModuleCompletions = cache(async (): Promise<ModuleCompletionRow[]> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("module_completions")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    console.error("[getMyModuleCompletions]", error.message);
    return [];
  }
  return data ?? [];
});

export const getLevels = cache(async (): Promise<LevelRow[]> => {
  const supabase = createClient();
  const { data, error } = await supabase.from("levels").select("*").order("level");

  if (error) {
    console.error("[getLevels]", error.message);
    return [];
  }
  return data ?? [];
});

export const getMissionProgress = cache(async (): Promise<MissionProgressRow | null> => {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("mission_progress", {});

  if (error) {
    console.error("[getMissionProgress]", error.message);
    return null;
  }
  const rows = data as unknown as MissionProgressRow[] | null;
  return rows?.[0] ?? null;
});

export async function getLeaderboard(
  scope: LeaderboardScope = "all",
  limit = 50,
): Promise<LeaderboardRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("leaderboard", { p_scope: scope, p_limit: limit });

  if (error) {
    console.error("[getLeaderboard]", error.message);
    return [];
  }
  return (data as unknown as LeaderboardRow[] | null) ?? [];
}

export const getMyDramaReports = cache(async (): Promise<DramaReportRow[]> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("drama_reports")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getMyDramaReports]", error.message);
    return [];
  }
  return data ?? [];
});

export const getMyXpHistory = cache(async (limit = 30): Promise<XpEventRow[]> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("xp_events")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getMyXpHistory]", error.message);
    return [];
  }
  return data ?? [];
});

export const XP_SOURCE_LABEL: Record<string, string> = {
  daily_amal: "Amalan yaumi",
  daily_bonus: "Bonus harian",
  module_session: "Sesi modul",
  drama_report: "Maba Drama",
  weekly_tracker: "Tracker mingguan",
  admin_adjustment: "Penyesuaian mentor",
};

/** Persentase menuju level berikutnya, untuk progress bar. */
export function levelProgress(progress: MissionProgressRow, levels: LevelRow[]): number {
  const current = levels.find((l) => l.level === progress.level);
  if (!current) return 0;
  if (progress.next_level_min_xp === null) return 100;

  const span = progress.next_level_min_xp - current.min_xp;
  if (span <= 0) return 100;

  const gained = progress.total_xp - current.min_xp;
  return Math.max(0, Math.min(100, Math.round((gained / span) * 100)));
}
