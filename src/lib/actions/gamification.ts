"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { idleState, zodToActionState, type ActionState } from "./types";

const GAME_PATHS = ["/dashboard", "/amalan", "/misi", "/drama", "/leaderboard"];

function refreshGamePages() {
  GAME_PATHS.forEach((path) => revalidatePath(path));
}

/**
 * Ubah apa pun yang dilempar menjadi ActionState yang bisa ditampilkan.
 *
 * Sebelumnya sebagian kode berada di luar try/catch, sehingga kegagalan di
 * situ menembus ke error boundary dan peserta hanya melihat "Ada yang
 * bermasalah" tanpa petunjuk apa pun. Server Action tidak boleh pernah
 * melempar ke klien: penyebabnya harus sampai ke layar.
 */
function toActionState(scope: string, error: unknown): ActionState {
  console.error(`[${scope}]`, error);

  const detail =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : typeof error === "object" && error !== null
        ? JSON.stringify(error)
        : String(error);

  return {
    status: "error",
    message: "Gagal menyimpan. Rincian teknisnya ada di bawah.",
    detail: detail.slice(0, 500),
  };
}

/** Ubah error dari Supabase (bukan lemparan) menjadi ActionState. */
function fromSupabaseError(
  scope: string,
  error: { message: string; code?: string; details?: string; hint?: string },
): ActionState {
  console.error(`[${scope}]`, error);
  return {
    status: "error",
    message: "Gagal menyimpan ke database.",
    detail: [error.code && `kode ${error.code}`, error.message, error.hint]
      .filter(Boolean)
      .join(" · ")
      .slice(0, 500),
  };
}

/**
 * Centang / batal-centang satu amalan yaumi untuk HARI INI.
 *
 * Tidak ada kolom "checked": tercentang berarti barisnya ada. Undo menghapus
 * barisnya, dan trigger database mencabut XP-nya — termasuk bonus harian kalau
 * ceklisnya jadi tidak lengkap lagi. Tanggalnya diisi default `today_wib()` di
 * database, jadi peserta tidak bisa mengisi mundur ke hari kemarin.
 */
export async function toggleAmalAction(habitKey: string, checked: boolean): Promise<ActionState> {
  const parsed = z.string().min(1).max(60).safeParse(habitKey);
  if (!parsed.success) return { status: "error", message: "Amalan tidak dikenali." };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { status: "error", message: "Sesi berakhir. Silakan login ulang." };

    const { data: today, error: dateError } = await supabase.rpc("today_wib");
    if (dateError) return fromSupabaseError("toggleAmalAction:today_wib", dateError);
    if (!today) {
      return { status: "error", message: "Server tidak mengembalikan tanggal. Coba lagi." };
    }
    const logDate = today as unknown as string;

    if (checked) {
      const { error } = await supabase
        .from("daily_amal_logs")
        .insert({ user_id: user.id, habit_key: parsed.data, log_date: logDate });

      // 23505 = sudah tercentang. Bukan kegagalan dari sudut pandang peserta.
      if (error && error.code !== "23505") {
        return fromSupabaseError("toggleAmalAction:insert", error);
      }
    } else {
      const { error } = await supabase
        .from("daily_amal_logs")
        .delete()
        .eq("user_id", user.id)
        .eq("habit_key", parsed.data)
        .eq("log_date", logDate);

      if (error) return fromSupabaseError("toggleAmalAction:delete", error);
    }

    refreshGamePages();
  } catch (error) {
    return toActionState("toggleAmalAction", error);
  }

  return { status: "success", message: checked ? "Amalan tercatat." : "Centang dibatalkan." };
}

/** Centang / batalkan kehadiran satu sesi modul. Mentor bisa mencabutnya dari panel. */
export async function toggleModuleAction(
  sessionNumber: number,
  checked: boolean,
): Promise<ActionState> {
  const parsed = z.number().int().min(1).max(10).safeParse(sessionNumber);
  if (!parsed.success) return { status: "error", message: "Nomor sesi tidak valid." };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { status: "error", message: "Sesi berakhir. Silakan login ulang." };

    if (checked) {
      const { error } = await supabase
        .from("module_completions")
        .insert({ user_id: user.id, session_number: parsed.data });

      if (error && error.code !== "23505") {
        return fromSupabaseError("toggleModuleAction:insert", error);
      }
    } else {
      const { error } = await supabase
        .from("module_completions")
        .delete()
        .eq("user_id", user.id)
        .eq("session_number", parsed.data);

      if (error) return fromSupabaseError("toggleModuleAction:delete", error);
    }

    refreshGamePages();
  } catch (error) {
    return toActionState("toggleModuleAction", error);
  }

  return { status: "success", message: checked ? "Sesi tercatat." : "Centang sesi dibatalkan." };
}

export const DRAMA_CATEGORIES = [
  "Maba pasif / ghosting",
  "Konflik antar maba",
  "Jadwal & kehadiran kelompok",
  "Materi sulit disampaikan",
  "Maba apatis / rebel",
  "Beban pribadi asisten (burnout)",
  "Koordinasi dengan mentor",
  "Lainnya",
] as const;

const dramaSchema = z.object({
  category: z.enum(DRAMA_CATEGORIES, {
    errorMap: () => ({ message: "Pilih kategori kendala" }),
  }),
  title: z
    .string()
    .trim()
    .min(5, "Judul minimal 5 karakter")
    .max(140, "Judul maksimal 140 karakter"),
  story: z
    .string()
    .trim()
    .min(20, "Ceritakan minimal 20 karakter supaya mentor punya konteks")
    .max(2000, "Maksimal 2000 karakter"),
  isUrgent: z
    .union([z.literal("on"), z.literal("true"), z.boolean(), z.undefined()])
    .transform((v) => v === "on" || v === "true" || v === true),
});

export async function submitDramaAction(
  _prev: ActionState = idleState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = dramaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodToActionState(parsed.error.flatten().fieldErrors);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { status: "error", message: "Sesi berakhir. Silakan login ulang." };

    const { data: today } = await supabase.rpc("today_wib");

    const { error } = await supabase.from("drama_reports").insert({
      user_id: user.id,
      category: parsed.data.category,
      title: parsed.data.title,
      story: parsed.data.story,
      is_urgent: parsed.data.isUrgent,
      reported_on: (today as unknown as string) ?? undefined,
    });

    if (error) {
      console.error("[submitDramaAction]", error);
      return { status: "error", message: "Gagal mengirim laporan. Coba lagi." };
    }
  } catch (error) {
    console.error("[submitDramaAction]", error);
    return { status: "error", message: "Gagal terhubung ke server." };
  }

  refreshGamePages();
  return {
    status: "success",
    message:
      "Laporan terkirim. Mentor akan membalas dengan solusi praktis. XP laporan dihitung sekali per hari.",
  };
}

export async function deleteDramaAction(reportId: string): Promise<ActionState> {
  const parsed = z.string().uuid().safeParse(reportId);
  if (!parsed.success) return { status: "error", message: "Laporan tidak ditemukan." };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { status: "error", message: "Sesi berakhir. Silakan login ulang." };

    const { error } = await supabase
      .from("drama_reports")
      .delete()
      .eq("id", parsed.data)
      .eq("user_id", user.id);

    if (error) {
      console.error("[deleteDramaAction]", error);
      return {
        status: "error",
        message: "Gagal menghapus. Laporan yang sudah dibalas mentor tidak bisa dihapus.",
      };
    }
  } catch (error) {
    console.error("[deleteDramaAction]", error);
    return { status: "error", message: "Gagal terhubung ke server." };
  }

  refreshGamePages();
  return { status: "success", message: "Laporan dihapus." };
}
