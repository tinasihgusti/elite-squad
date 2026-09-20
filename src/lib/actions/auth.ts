"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { idleState, zodToActionState, type ActionState } from "./types";

/**
 * Terjemahkan pesan error Supabase Auth ke bahasa yang dimengerti peserta.
 *
 * Mengembalikan `detail` berisi pesan asli dari Supabase. Sebelumnya pesan
 * yang tidak dikenali ditelan menjadi "terjadi kesalahan" saja, sehingga
 * penyebab sebenarnya tidak pernah kelihatan dan tiap masalah butuh satu
 * putaran tebak-tebakan.
 */
function translateAuthError(message: string): { message: string; detail?: string } {
  const m = message.toLowerCase();

  if (m.includes("invalid login credentials")) return { message: "Email atau password salah." };

  if (m.includes("email not confirmed"))
    return {
      message: "Email belum dikonfirmasi. Cek inbox (dan folder spam) untuk link verifikasi.",
    };

  if (m.includes("user already registered") || m.includes("already been registered"))
    return { message: "Email ini sudah terdaftar. Silakan login atau gunakan email lain." };

  if (m.includes("rate limit") || m.includes("too many") || m.includes("for security purposes"))
    return { message: "Terlalu banyak percobaan. Tunggu sekitar satu menit lalu coba lagi." };

  // Sangat umum di free tier: SMTP bawaan Supabase dibatasi beberapa email
  // per jam, dan pendaftaran ikut gagal kalau emailnya tidak terkirim.
  if (
    m.includes("error sending") ||
    m.includes("confirmation email") ||
    m.includes("smtp") ||
    m.includes("email provider")
  )
    return {
      message:
        "Akun tidak bisa dibuat karena email konfirmasi gagal dikirim. SMTP bawaan Supabase " +
        "dibatasi beberapa email per jam. Pasang custom SMTP, atau matikan konfirmasi email " +
        "di Authentication → Sign In / Providers → Email → Confirm email.",
      detail: message,
    };

  // Penyebab paling umum saat pertama kali deploy: migrasi SQL belum dijalankan,
  // atau trigger pembuat profil error sehingga seluruh pendaftaran ikut gagal.
  if (m.includes("database error"))
    return {
      message:
        "Database Supabase belum siap. Jalankan ketiga file di supabase/migrations " +
        "(0001, 0002, lalu 0003) di SQL Editor, lalu coba daftar lagi. " +
        "Buka /setup-check untuk melihat bagian mana yang belum terpasang.",
      detail: message,
    };

  if (m.includes("signups not allowed") || m.includes("signup is disabled"))
    return {
      message:
        "Pendaftaran sedang dimatikan di Supabase. Aktifkan lewat Authentication → " +
        "Sign In / Providers → Email → Allow new users to sign up.",
      detail: message,
    };

  if (m.includes("redirect") && m.includes("url"))
    return {
      message:
        "URL redirect belum diizinkan Supabase. Tambahkan alamat aplikasi + /auth/callback " +
        "di Authentication → URL Configuration → Redirect URLs.",
      detail: message,
    };

  if (m.includes("email address") && m.includes("invalid"))
    return {
      message:
        "Email ditolak Supabase. Kalau memakai domain tidak umum, periksa pengaturan " +
        "email provider di dashboard Supabase.",
      detail: message,
    };

  if (m.includes("password"))
    return { message: "Password tidak memenuhi syarat keamanan Supabase.", detail: message };

  return {
    message: "Pendaftaran gagal di sisi server autentikasi.",
    detail: message,
  };
}

export async function registerAction(
  _prev: ActionState = idleState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodToActionState(parsed.error.flatten().fieldErrors);

  const { email, password, fullName, squad, faculty, phone } = parsed.data;

  try {
    const supabase = await createClient();
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

    if (error) {
      console.error("[registerAction:supabase]", error.status, error.message);
      const t = translateAuthError(error.message);
      return { status: "error", message: t.message, detail: t.detail };
    }

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
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      console.error("[loginAction:supabase]", error.status, error.message);
      const t = translateAuthError(error.message);
      return { status: "error", message: t.message, detail: t.detail };
    }
  } catch (error) {
    console.error("[loginAction]", error);
    return { status: "error", message: "Gagal terhubung ke server. Periksa koneksi lalu coba lagi." };
  }

  revalidatePath("/", "layout");
  redirect(safeNext);
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
