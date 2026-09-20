import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { env } from "@/lib/env";
import type { Database } from "@/lib/database.types";

/**
 * Supabase client untuk Server Component, Route Handler, dan Server Action.
 * Session dibaca/ditulis lewat cookie httpOnly — aman, tidak bocor ke JS client.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Dipanggil dari Server Component: set cookie diabaikan.
            // Refresh session tetap ditangani middleware, jadi ini aman.
          }
        },
      },
    },
  );
}
