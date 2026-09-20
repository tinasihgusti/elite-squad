"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { trackerSchema } from "@/lib/validations/tracker";
import { idleState, zodToActionState, type ActionState } from "./types";

export async function submitTrackerAction(
  _prev: ActionState = idleState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = trackerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodToActionState(parsed.error.flatten().fieldErrors);

  const d = parsed.data;

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { status: "error", message: "Sesi kamu sudah berakhir. Silakan login ulang." };
    }

    const { error } = await supabase.from("weekly_trackers").upsert(
      {
        user_id: user.id,
        week_number: d.weekNumber,
        week_start_date: d.weekStartDate,
        attendance: d.attendance,
        session_topic: d.sessionTopic || null,

        score_spiritual: d.scoreSpiritual,
        score_academic: d.scoreAcademic,
        score_physical: d.scorePhysical,
        score_social: d.scoreSocial,
        score_mental: d.scoreMental,

        habit_worship: d.habitWorship,
        habit_reading: d.habitReading,
        habit_exercise: d.habitExercise,
        habit_sleep: d.habitSleep,
        habit_journaling: d.habitJournaling,

        drama_category: d.dramaCategory || null,
        drama_story: d.dramaStory || null,
        drama_action_plan: d.dramaActionPlan || null,
        needs_followup: d.needsFollowup,

        mentor_rating: d.mentorRating ?? null,
        session_feedback: d.sessionFeedback || null,
        suggestion: d.suggestion || null,
      },
      { onConflict: "user_id,week_number" },
    );

    if (error) {
      console.error("[submitTrackerAction]", error);
      if (error.code === "23514") {
        return { status: "error", message: "Ada nilai isian di luar rentang yang diizinkan." };
      }
      if (error.code === "42501") {
        return { status: "error", message: "Kamu tidak punya izin menyimpan data ini." };
      }
      return { status: "error", message: "Gagal menyimpan tracker. Coba lagi beberapa saat." };
    }
  } catch (error) {
    console.error("[submitTrackerAction]", error);
    return { status: "error", message: "Gagal terhubung ke server. Periksa koneksi lalu coba lagi." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/tracker");
  revalidatePath("/rekap");

  return {
    status: "success",
    message: `Tracker Minggu ${d.weekNumber} tersimpan. Terima kasih sudah konsisten!`,
  };
}
