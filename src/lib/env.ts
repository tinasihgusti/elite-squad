import { z } from "zod";

/**
 * Validasi environment variable sekali di satu tempat.
 * Kalau ada yang hilang/salah format, error-nya jelas saat build —
 * bukan "undefined is not a function" di runtime Vercel.
 */
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL harus berupa URL penuh, contoh: https://abcd.supabase.co"),
  /**
   * Di dashboard Supabase namanya berbeda-beda tergantung umur project:
   * project baru menyebutnya "Publishable key" (sb_publishable_...), project
   * lama menyebutnya "anon public" (JWT eyJ...). Keduanya dipakai di tempat
   * yang sama dan sama-sama aman dibawa ke browser selama RLS aktif.
   */
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(20, "Publishable key / anon key tidak valid atau belum diisi"),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  /**
   * Di dashboard: "Secret key" (sb_secret_...) pada project baru, atau
   * "service_role" (JWT) pada project lama.
   *
   * Hanya dipakai di server, untuk satu hal: menghapus akun peserta dari panel
   * mentor (Supabase Admin API tidak bisa dipanggil dengan publishable key).
   * Opsional — tanpa ini aplikasi tetap jalan, fitur hapus akun saja yang mati.
   * JANGAN diberi awalan NEXT_PUBLIC_: key ini tidak boleh sampai ke browser.
   */
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  // Terima kedua penamaan, supaya tidak tertukar dengan label di dashboard.
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY,
});

if (!parsed.success) {
  const detail = parsed.error.issues.map((i) => `- ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(
    `Konfigurasi environment belum lengkap.\n${detail}\n\nSalin .env.example menjadi .env.local (lokal) ` +
      `atau isi Environment Variables di Vercel, lalu jalankan ulang.`,
  );
}

export const env = parsed.data;

/** Base URL aplikasi — otomatis ikut domain Vercel kalau NEXT_PUBLIC_SITE_URL tidak diisi. */
export function getSiteUrl(): string {
  if (env.NEXT_PUBLIC_SITE_URL) return env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.NEXT_PUBLIC_VERCEL_URL) return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
