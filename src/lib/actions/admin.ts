"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createAdminClient, isAdminDeleteEnabled } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/database.types";
import { idleState, zodToActionState, type ActionState } from "./types";

/**
 * Gerbang tunggal panel mentor. Setiap action di file ini memanggilnya lebih
 * dulu; tidak ada jalur yang menyentuh data peserta lain tanpa lewat sini.
 */
async function requireStaff(): Promise<
  { ok: true; staff: ProfileRow } | { ok: false; state: ActionState }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, state: { status: "error", message: "Sesi berakhir. Silakan login ulang." } };
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  if (!profile || (profile.role !== "mentor" && profile.role !== "admin")) {
    return {
      ok: false,
      state: { status: "error", message: "Akses ditolak. Halaman ini khusus mentor/admin." },
    };
  }

  return { ok: true, staff: profile };
}

function refreshAdminPages() {
  ["/admin", "/leaderboard", "/dashboard"].forEach((path) => revalidatePath(path));
}

// ---------------------------------------------------------------------------
// Penyesuaian XP
// ---------------------------------------------------------------------------

const adjustSchema = z.object({
  userId: z.string().uuid("Peserta tidak valid"),
  points: z.coerce
    .number({ invalid_type_error: "Jumlah XP harus berupa angka" })
    .int("Jumlah XP harus bilangan bulat")
    .refine((v) => v !== 0, "Jumlah XP tidak boleh 0")
    .refine((v) => Math.abs(v) <= 10_000, "Maksimal 10.000 XP per penyesuaian"),
  note: z
    .string()
    .trim()
    .min(5, "Tulis alasan penyesuaian minimal 5 karakter")
    .max(300, "Alasan maksimal 300 karakter"),
});

/**
 * Tambah atau kurangi XP peserta. Nilai negatif dipakai saat data peserta
 * terbukti tidak sesuai. Setiap penyesuaian tercatat sebagai baris tersendiri
 * di ledger lengkap dengan alasan dan siapa yang melakukannya — bisa ditelusuri,
 * dan bisa dibatalkan tanpa merusak perolehan XP yang sah.
 */
export async function adjustXpAction(
  _prev: ActionState = idleState,
  formData: FormData,
): Promise<ActionState> {
  const gate = await requireStaff();
  if (!gate.ok) return gate.state;

  const parsed = adjustSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodToActionState(parsed.error.flatten().fieldErrors);

  const { userId, points, note } = parsed.data;

  if (userId === gate.staff.id) {
    return { status: "error", message: "Tidak bisa menyesuaikan XP akun sendiri." };
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.from("xp_events").insert({
      user_id: userId,
      source: "admin_adjustment",
      // Timestamp membuat tiap penyesuaian unik, jadi mentor bisa melakukannya
      // berkali-kali tanpa bentrok dengan constraint idempoten.
      ref_key: `adj:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
      points,
      note,
      created_by: gate.staff.id,
    });

    if (error) {
      console.error("[adjustXpAction]", error);
      return { status: "error", message: "Gagal menyimpan penyesuaian XP." };
    }
  } catch (error) {
    console.error("[adjustXpAction]", error);
    return { status: "error", message: "Gagal terhubung ke server." };
  }

  refreshAdminPages();
  return {
    status: "success",
    message: `XP peserta ${points > 0 ? "ditambah" : "dikurangi"} ${Math.abs(points)}.`,
  };
}

export async function revertAdjustmentAction(eventId: string): Promise<ActionState> {
  const gate = await requireStaff();
  if (!gate.ok) return gate.state;

  const parsed = z.string().uuid().safeParse(eventId);
  if (!parsed.success) return { status: "error", message: "Penyesuaian tidak ditemukan." };

  const supabase = createClient();
  const { error } = await supabase
    .from("xp_events")
    .delete()
    .eq("id", parsed.data)
    .eq("source", "admin_adjustment");

  if (error) {
    console.error("[revertAdjustmentAction]", error);
    return { status: "error", message: "Gagal membatalkan penyesuaian." };
  }

  refreshAdminPages();
  return { status: "success", message: "Penyesuaian dibatalkan." };
}

// ---------------------------------------------------------------------------
// Verifikasi & pencabutan kehadiran sesi
// ---------------------------------------------------------------------------

export async function verifyModuleAction(
  completionId: string,
  verified: boolean,
): Promise<ActionState> {
  const gate = await requireStaff();
  if (!gate.ok) return gate.state;

  const parsed = z.string().uuid().safeParse(completionId);
  if (!parsed.success) return { status: "error", message: "Data sesi tidak ditemukan." };

  const supabase = createClient();
  const { error } = await supabase
    .from("module_completions")
    .update({
      verified_by: verified ? gate.staff.id : null,
      verified_at: verified ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data);

  if (error) {
    console.error("[verifyModuleAction]", error);
    return { status: "error", message: "Gagal memperbarui verifikasi." };
  }

  refreshAdminPages();
  return { status: "success", message: verified ? "Kehadiran diverifikasi." : "Verifikasi dicabut." };
}

/** Cabut kehadiran sesi yang terdata tidak sesuai — XP sesinya ikut hilang. */
export async function revokeModuleAction(completionId: string): Promise<ActionState> {
  const gate = await requireStaff();
  if (!gate.ok) return gate.state;

  const parsed = z.string().uuid().safeParse(completionId);
  if (!parsed.success) return { status: "error", message: "Data sesi tidak ditemukan." };

  const supabase = createClient();
  const { error } = await supabase.from("module_completions").delete().eq("id", parsed.data);

  if (error) {
    console.error("[revokeModuleAction]", error);
    return { status: "error", message: "Gagal mencabut kehadiran sesi." };
  }

  refreshAdminPages();
  return { status: "success", message: "Kehadiran sesi dicabut beserta XP-nya." };
}

// ---------------------------------------------------------------------------
// Balasan Maba Drama ("cheat code" mentor)
// ---------------------------------------------------------------------------

const replySchema = z.object({
  reportId: z.string().uuid(),
  reply: z
    .string()
    .trim()
    .min(10, "Balasan minimal 10 karakter")
    .max(2000, "Balasan maksimal 2000 karakter"),
});

export async function replyDramaAction(
  _prev: ActionState = idleState,
  formData: FormData,
): Promise<ActionState> {
  const gate = await requireStaff();
  if (!gate.ok) return gate.state;

  const parsed = replySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodToActionState(parsed.error.flatten().fieldErrors);

  const supabase = createClient();
  const { error } = await supabase
    .from("drama_reports")
    .update({
      mentor_reply: parsed.data.reply,
      replied_by: gate.staff.id,
      replied_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.reportId);

  if (error) {
    console.error("[replyDramaAction]", error);
    return { status: "error", message: "Gagal mengirim balasan." };
  }

  revalidatePath("/admin");
  revalidatePath("/drama");
  return { status: "success", message: "Balasan terkirim ke peserta." };
}

// ---------------------------------------------------------------------------
// Hapus akun peserta
// ---------------------------------------------------------------------------

const deleteSchema = z.object({
  userId: z.string().uuid("Peserta tidak valid"),
  // Ketik ulang nama peserta agar tidak ada penghapusan karena salah klik.
  confirmName: z.string().trim().min(1, "Ketik nama peserta untuk konfirmasi"),
});

/**
 * Hapus akun peserta secara permanen.
 *
 * Menghapus user di `auth.users` memerlukan service role key; RLS tidak berlaku
 * untuk client ini, jadi status mentor/admin diverifikasi lebih dulu lewat
 * `requireStaff()`. Baris `profiles`, XP, amalan, modul, dan laporan drama ikut
 * terhapus melalui `on delete cascade`.
 */
export async function deleteParticipantAction(
  _prev: ActionState = idleState,
  formData: FormData,
): Promise<ActionState> {
  const gate = await requireStaff();
  if (!gate.ok) return gate.state;

  if (!isAdminDeleteEnabled()) {
    return {
      status: "error",
      message:
        "Fitur hapus akun belum aktif: SUPABASE_SERVICE_ROLE_KEY belum diisi di environment variable.",
    };
  }

  const parsed = deleteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodToActionState(parsed.error.flatten().fieldErrors);

  const { userId, confirmName } = parsed.data;

  if (userId === gate.staff.id) {
    return { status: "error", message: "Tidak bisa menghapus akun sendiri." };
  }

  try {
    const supabase = createClient();
    const { data: target } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", userId)
      .maybeSingle();

    if (!target) return { status: "error", message: "Peserta tidak ditemukan." };

    if (target.role !== "member" && gate.staff.role !== "admin") {
      return { status: "error", message: "Hanya admin yang boleh menghapus akun mentor." };
    }

    if (target.full_name.trim().toLowerCase() !== confirmName.toLowerCase()) {
      return {
        status: "error",
        message: `Nama konfirmasi tidak cocok. Ketik persis: ${target.full_name}`,
      };
    }

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(userId);

    if (error) {
      console.error("[deleteParticipantAction]", error);
      return { status: "error", message: `Gagal menghapus akun: ${error.message}` };
    }

    refreshAdminPages();
    return { status: "success", message: `Akun ${target.full_name} telah dihapus permanen.` };
  } catch (error) {
    console.error("[deleteParticipantAction]", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal menghapus akun.",
    };
  }
}
