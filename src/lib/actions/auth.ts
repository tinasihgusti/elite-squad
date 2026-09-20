"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { idleState, zodToActionState, type ActionState } from "./types";

/** Terjemahkan pesan error Supabase Auth ke bahasa yang dimengerti peserta. */
function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email atau password salah.";
  if (m.includes("email not confirmed"))
    return "Email belum dikonfirmasi. Cek inbox (dan folder spam) untuk link verifikasi.";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "Email ini sudah terdaftar. Silakan login atau gunakan email lain.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
  if (m.includes("password")) return "Password tidak memenuhi syarat keamanan.";
  return "Terjadi kesalahan pada server autentikasi. Coba lagi beberapa saat.";
}

export async function registerAction(
  _prev: ActionState = idleState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodToActionState(parsed.error.flatten().fieldErrors);

  const { email, password, fullName, squad, faculty, phone } = parsed.data;

  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
        data: {
          full_name: fullName,
          squad: squad || null,
          faculty: faculty || null,
          phone: phone || null,
        },
      },
    });

    if (error) return { status: "error", message: translateAuthError(error.message) };

    // Email confirmation aktif: belum ada session, peserta harus verifikasi dulu.
    if (!data.session) {
      return {
        status: "success",
        message: `Pendaftaran berhasil. Kami kirim link verifikasi ke ${email} — buka link itu untuk mengaktifkan akun.`,
      };
    }
  } catch (error) {
    console.error("[registerAction]", error);
    return { status: "error", message: "Gagal terhubung ke server. Periksa koneksi lalu coba lagi." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function loginAction(
  _prev: ActionState = idleState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodToActionState(parsed.error.flatten().fieldErrors);

  const next = (formData.get("next") as string | null) ?? "/dashboard";
  // Cegah open redirect: hanya izinkan path internal.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) return { status: "error", message: translateAuthError(error.message) };
  } catch (error) {
    console.error("[loginAction]", error);
    return { status: "error", message: "Gagal terhubung ke server. Periksa koneksi lalu coba lagi." };
  }

  revalidatePath("/", "layout");
  redirect(safeNext);
}

export async function logoutAction(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
