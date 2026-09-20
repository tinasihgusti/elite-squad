import "server-only";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/queries";
import type {
  AdminParticipantRow,
  DramaReportRow,
  ModuleCompletionRow,
  ProfileRow,
  XpEventRow,
} from "@/lib/database.types";

/** Profil staf yang sedang login, atau null kalau bukan mentor/admin. */
export const getStaffProfile = cache(async (): Promise<ProfileRow | null> => {
  const profile = await getProfile();
  if (!profile) return null;
  return profile.role === "mentor" || profile.role === "admin" ? profile : null;
});

export const getParticipants = cache(async (): Promise<AdminParticipantRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_participants", {});

  if (error) {
    console.error("[getParticipants]", error.message);
    return [];
  }
  return (data as unknown as AdminParticipantRow[] | null) ?? [];
});

export type DramaWithAuthor = DramaReportRow & {
  profiles: Pick<ProfileRow, "full_name" | "squad"> | null;
};

export const getAllDramaReports = cache(async (limit = 100): Promise<DramaWithAuthor[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("drama_reports")
    .select("*, profiles!drama_reports_user_id_fkey (full_name, squad)")
    .order("is_urgent", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getAllDramaReports]", error.message);
    return [];
  }
  return (data as unknown as DramaWithAuthor[] | null) ?? [];
});

export const getRecentAdjustments = cache(async (limit = 20): Promise<XpEventRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("xp_events")
    .select("*")
    .eq("source", "admin_adjustment")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getRecentAdjustments]", error.message);
    return [];
  }
  return data ?? [];
});

export const getPendingVerifications = cache(async (): Promise<ModuleCompletionRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("module_completions")
    .select("*")
    .is("verified_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[getPendingVerifications]", error.message);
    return [];
  }
  return data ?? [];
});
