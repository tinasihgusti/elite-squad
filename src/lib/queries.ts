import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { ProfileRow, WeeklyTrackerRow } from "@/lib/database.types";

/** Profil user yang sedang login. `cache` mencegah query ganda dalam satu render. */
export const getProfile = cache(async (): Promise<ProfileRow | null> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  if (error) {
    console.error("[getProfile]", error.message);
    return null;
  }
  return data;
});

/** Seluruh tracker milik user, terbaru dulu. 200 user × ~16 minggu — aman tanpa paging. */
export const getMyTrackers = cache(async (): Promise<WeeklyTrackerRow[]> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("weekly_trackers")
    .select("*")
    .eq("user_id", user.id)
    .order("week_number", { ascending: false });

  if (error) {
    console.error("[getMyTrackers]", error.message);
    return [];
  }
  return data ?? [];
});

export const getTrackerByWeek = cache(
  async (weekNumber: number): Promise<WeeklyTrackerRow | null> => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("weekly_trackers")
      .select("*")
      .eq("user_id", user.id)
      .eq("week_number", weekNumber)
      .maybeSingle();

    if (error) {
      console.error("[getTrackerByWeek]", error.message);
      return null;
    }
    return data;
  },
);

export function averageScore(row: WeeklyTrackerRow): number {
  const total =
    row.score_spiritual + row.score_academic + row.score_physical + row.score_social + row.score_mental;
  return Number((total / 5).toFixed(2));
}

export function habitCount(row: WeeklyTrackerRow): number {
  return [
    row.habit_worship,
    row.habit_reading,
    row.habit_exercise,
    row.habit_sleep,
    row.habit_journaling,
  ].filter(Boolean).length;
}
