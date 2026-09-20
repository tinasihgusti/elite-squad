import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import type { Database } from "@/lib/database.types";

/**
 * Client service-role — MELEWATI seluruh Row Level Security.
 *
 * Dipakai hanya untuk menghapus akun peserta lewat Supabase Admin API, yang
 * memang tidak bisa dilakukan dengan anon key. Setiap pemanggil WAJIB
 * memverifikasi bahwa user yang login benar-benar mentor/admin lebih dulu.
 *
 * `server-only` membuat build gagal kalau file ini pernah ter-import dari
 * Client Component, sehingga key-nya mustahil bocor ke browser.
 */
export function createAdminClient() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY belum diset. Fitur hapus akun peserta nonaktif. " +
        "Isi variabel ini di .env.local / Environment Variables Vercel untuk mengaktifkannya.",
    );
  }

  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export function isAdminDeleteEnabled(): boolean {
  return Boolean(env.SUPABASE_SERVICE_ROLE_KEY);
}
